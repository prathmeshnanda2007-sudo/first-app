const { expect } = require('chai')
const firebaseFunctionsTest = require('firebase-functions-test')()
const admin = require('firebase-admin')
const { getISOWeek } = require('../helpers')

describe('recomputeWeeklyAggregates scheduled job', function () {
  before(async function () {
    process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8080'
    process.env.FIREBASE_PROJECT = process.env.FIREBASE_PROJECT || 'demo-project'
    if (!admin.apps.length) admin.initializeApp({ projectId: process.env.FIREBASE_PROJECT })
    this.db = admin.firestore()
    this.funcs = require('../index')
    this.wrapped = firebaseFunctionsTest.wrap(this.funcs.recomputeWeeklyAggregates)
  })

  beforeEach(async function () {
    // clear relevant collections
    const deletes = []
    const collections = ['messes', 'aggregates']
    for (const c of collections) {
      const snap = await this.db.collection(c).get()
      snap.forEach(d => deletes.push(d.ref.delete()))
    }
    await Promise.all(deletes)
  })

  it('recomputes weekly aggregates from daily entries', async function () {
    const messId = 'mess3'
    await this.db.collection('messes').doc(messId).set({ name: 'Backfill Mess' })

    // create three daily docs in same ISO week
    const dates = [new Date(Date.UTC(2025,11,1)), new Date(Date.UTC(2025,11,2)), new Date(Date.UTC(2025,11,3))]
    for (const dt of dates) {
      const dstr = dt.toISOString().slice(0,10)
      await this.db.collection('aggregates').doc(messId).collection('daily').doc(dstr).set({ date: dstr, hygieneSum: 3.5, count: 1 })
    }

    // call recompute job
    await this.wrapped()

    const weekId = getISOWeek(dates[0])
    const wk = await this.db.collection('aggregates').doc(messId).collection('weekly').doc(weekId).get()
    expect(wk.exists).to.be.true
    const data = wk.data()
    expect(data.count).to.equal(3)
    expect(data.hygieneAvg).to.be.closeTo(3.5, 0.001)
    expect(['Silver','Gold','Red']).to.include(data.badge)
  })
})