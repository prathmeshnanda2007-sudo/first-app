const { expect } = require('chai')
const firebaseFunctionsTest = require('firebase-functions-test')()
const admin = require('firebase-admin')
const { getISOWeek } = require('../helpers')

describe('onWeeklyAggregateWrite Cloud Function', function () {
  before(async function () {
    process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8080'
    process.env.FIREBASE_PROJECT = process.env.FIREBASE_PROJECT || 'demo-project'
    if (!admin.apps.length) admin.initializeApp({ projectId: process.env.FIREBASE_PROJECT })
    this.db = admin.firestore()
    this.funcs = require('../index')
    this.wrapped = firebaseFunctionsTest.wrap(this.funcs.onWeeklyAggregateWrite)
  })

  beforeEach(async function () {
    // clear relevant collections
    const deletes = []
    const collections = ['messes', 'aggregates', 'dashboardSummaries']
    for (const c of collections) {
      const snap = await this.db.collection(c).get()
      snap.forEach(d => deletes.push(d.ref.delete()))
    }
    await Promise.all(deletes)
  })

  it('writes dashboard summary on weekly aggregate create and computes trend', async function () {
    const messId = 'messD1'
    const collegeId = 'collegeX'
    await this.db.collection('messes').doc(messId).set({ name: 'Summary Mess', collegeId })

    // prev week avg
    const prevDate = new Date(Date.UTC(2025, 11, 1))
    const prevWeek = getISOWeek(prevDate)
    await this.db.collection('aggregates').doc(messId).collection('weekly').doc(prevWeek).set({ weekId: prevWeek, hygieneAvg: 3.0, count: 2, badge: 'Silver' })

    // create new weekly aggregate (trigger)
    const curDate = new Date(Date.UTC(2025, 11, 8))
    const curWeek = getISOWeek(curDate)
    const newWeekly = { weekId: curWeek, hygieneAvg: 3.8, count: 3, badge: 'Silver' }

    const afterSnap = firebaseFunctionsTest.firestore.makeDocumentSnapshot(newWeekly, `aggregates/${messId}/weekly/${curWeek}`)
    const change = firebaseFunctionsTest.firestore.makeChange(null, afterSnap)

    await this.wrapped(change, { params: { messId, weekId: curWeek } })

    const summaryDoc = await this.db.collection('dashboardSummaries').doc(collegeId).get()
    expect(summaryDoc.exists).to.be.true
    const data = summaryDoc.data()
    expect(data.messages).to.have.property(messId)
    const msg = data.messages[messId]
    expect(msg.avg).to.be.closeTo(3.8, 0.01)
    expect(msg.prevAvg).to.be.closeTo(3.0, 0.01)
    expect(msg.trend).to.equal(1)
  })

  it('removes entry when weekly doc deleted', async function () {
    const messId = 'messD2'
    const collegeId = 'collegeY'
    await this.db.collection('messes').doc(messId).set({ name: 'Summary Mess 2', collegeId })

    const week = getISOWeek(new Date(Date.UTC(2025, 11, 8)))
    // simulate existing weekly doc (before)
    const beforeSnap = firebaseFunctionsTest.firestore.makeDocumentSnapshot({ weekId: week, hygieneAvg: 2.5, count: 1, badge: 'Red' }, `aggregates/${messId}/weekly/${week}`)
    const change = firebaseFunctionsTest.firestore.makeChange(beforeSnap, null)

    await this.wrapped(change, { params: { messId, weekId: week } })

    const summaryDoc = await this.db.collection('dashboardSummaries').doc(collegeId).get()
    // doc may not exist or messages.messId should be absent
    if (summaryDoc.exists) {
      const data = summaryDoc.data()
      expect(data.messages && data.messages[messId]).to.be.undefined
    }
  })
})