const { expect } = require('chai')
const firebaseFunctionsTest = require('firebase-functions-test')()
const admin = require('firebase-admin')
const { backfillDashboardSummaries } = require('../tools/backfillDashboardSummaries')
const { getISOWeek } = require('../helpers')

describe('backfillDashboardSummaries script', function () {
  before(async function () {
    process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8080'
    process.env.FIREBASE_PROJECT = process.env.FIREBASE_PROJECT || 'demo-project'
    if (!admin.apps.length) admin.initializeApp({ projectId: process.env.FIREBASE_PROJECT })
    this.db = admin.firestore()
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

  it('writes dashboard summaries for colleges', async function () {
    const messId = 'm_back1'
    const collegeId = 'college_back'
    await this.db.collection('messes').doc(messId).set({ name: 'Back Mess', collegeId })

    const week = getISOWeek(new Date())
    await this.db.collection('aggregates').doc(messId).collection('weekly').doc(week).set({ weekId: week, hygieneAvg: 4.2, count: 5, badge: 'Gold' })

    // run twice to assert idempotency
    await backfillDashboardSummaries({ targetWeek: week, dryRun: false })
    await backfillDashboardSummaries({ targetWeek: week, dryRun: false })

    const doc = await this.db.collection('dashboardSummaries').doc(collegeId).get()
    expect(doc.exists).to.be.true
    const data = doc.data()
    expect(data.messages).to.have.property(messId)
    expect(data.messages[messId].avg).to.be.closeTo(4.2, 0.01)
    expect(data.lastUpdated).to.exist
  })
})