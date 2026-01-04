const { expect } = require('chai')
const firebaseFunctionsTest = require('firebase-functions-test')()
const admin = require('firebase-admin')

const PATH_RATINGS = 'ratings'
const PATH_AGGREGATES = 'aggregates'
const PATH_MESSES = 'messes'
const PATH_ALERTS = 'alerts'

describe('onRatingCreate Cloud Function', function () {
  let testEnv
  let db
  let wrapped

  before(async function () {
    // connect admin to emulator
    process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8080'
    process.env.FIREBASE_PROJECT = process.env.FIREBASE_PROJECT || 'demo-project'
    if (!admin.apps.length) admin.initializeApp({ projectId: process.env.FIREBASE_PROJECT })
    db = admin.firestore()

    // require functions and wrap
    const myFunctions = require('../index')
    wrapped = firebaseFunctionsTest.wrap(myFunctions.onRatingCreate)
  })

  after(async function () {
    // clean up
    await firebaseFunctionsTest.cleanup()
  })

  beforeEach(async function () {
    // clear data
    const deletes = []
    const collections = [PATH_RATINGS, PATH_AGGREGATES, PATH_MESSES, PATH_ALERTS]
    for (const c of collections) {
      const snap = await db.collection(c).get()
      snap.forEach(d => deletes.push(d.ref.delete()))
    }
    await Promise.all(deletes)
  })

  it('creates/updates weekly aggregate when a rating is created', async function () {
    const messId = 'mess1'
    await db.collection(PATH_MESSES).doc(messId).set({ name: 'Test Mess' })

    // rating timestamp - use fixed date to control week
    const ts = new admin.firestore.Timestamp(1760, 0) // unrealistic but deterministic; replaced by date create below
    const date = new Date(Date.UTC(2025, 11, 3)) // 2025-12-03
    const timestamp = admin.firestore.Timestamp.fromDate(date)
    const rating = { messId, hygiene: 4.0, timestamp }

    const snap = firebaseFunctionsTest.firestore.makeDocumentSnapshot(rating, `${PATH_RATINGS}/r1`)

    await wrapped(snap, { params: { ratingId: 'r1' } })

    // check weekly doc
    const isoWeek = (() => {
      const d = new Date(Date.UTC(2025, 11, 3))
      // compute ISO week same as function in index.js: use week containing Thursday
      d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
      const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
      const w = String(weekNo).padStart(2, '0')
      return `${d.getUTCFullYear()}-W${w}`
    })()

    const wkDoc = await db.collection(PATH_AGGREGATES).doc(messId).collection('weekly').doc(isoWeek).get()
    expect(wkDoc.exists).to.be.true
    const data = wkDoc.data()
    expect(data.hygieneAvg).to.be.closeTo(4.0, 0.001)
    expect(data.count).to.equal(1)
    expect(data.badge).to.equal('Gold')
  })

  it('creates low hygiene alert after 3 consecutive low days', async function () {
    const messId = 'mess2'
    await db.collection(PATH_MESSES).doc(messId).set({ name: 'Bad Mess' })

    // create two pre-existing daily aggregates for the prior two days with low averages
    const buildDate = (y, m, d) => new Date(Date.UTC(y, m, d))
    const d1 = buildDate(2025, 11, 1) // day -2
    const d2 = buildDate(2025, 11, 2) // day -1
    const d3 = buildDate(2025, 11, 3) // today

    const dateStr = (dt) => dt.toISOString().slice(0, 10)

    await db.collection(PATH_AGGREGATES).doc(messId).collection('daily').doc(dateStr(d1)).set({ date: dateStr(d1), hygieneSum: 2.0, count: 1 })
    await db.collection(PATH_AGGREGATES).doc(messId).collection('daily').doc(dateStr(d2)).set({ date: dateStr(d2), hygieneSum: 2.5, count: 1 })

    // now create rating for today with low hygiene
    const timestamp = admin.firestore.Timestamp.fromDate(d3)
    const rating = { messId, hygiene: 2.8, timestamp }
    const snap = firebaseFunctionsTest.firestore.makeDocumentSnapshot(rating, `${PATH_RATINGS}/r2`)

    await wrapped(snap, { params: { ratingId: 'r2' } })

    // alert id should be low_hygiene_{messId}_{startDate} where startDate is oldest of 3-day window
    const startDate = dateStr(d1)
    const alertId = `low_hygiene_${messId}_${startDate}`
    const alertDoc = await db.collection(PATH_ALERTS).doc(alertId).get()
    expect(alertDoc.exists).to.be.true
    const alertData = alertDoc.data()
    expect(alertData.type).to.equal('low_hygiene')
    expect(alertData.resolved).to.be.false
  })
})
