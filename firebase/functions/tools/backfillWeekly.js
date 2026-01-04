const admin = require('firebase-admin')
const { getISOWeek, isoWeekStartDate } = require('../helpers')

// initialize admin (works with emulator if env var set)
admin.initializeApp()
const db = admin.firestore()

async function backfill() {
  console.log('Starting weekly backfill...')
  const messesSnap = await db.collection('messes').get()
  let total = 0
  for (const ms of messesSnap.docs) {
    const messId = ms.id
    console.log('Processing mess', messId)
    // fetch all daily aggregates
    const dailySnap = await db.collection('aggregates').doc(messId).collection('daily').get()
    const byWeek = {}
    dailySnap.forEach(d => {
      const data = d.data()
      const dateStr = data.date
      const dt = new Date(`${dateStr}T00:00:00Z`)
      const weekId = getISOWeek(dt)
      if (!byWeek[weekId]) byWeek[weekId] = { hygieneSum:0, count:0, dates: [] }
      byWeek[weekId].hygieneSum += (data.hygieneSum || 0)
      byWeek[weekId].count += (data.count || 0)
      byWeek[weekId].dates.push(dateStr)
    })

    for (const [weekId, stats] of Object.entries(byWeek)) {
      if (stats.count === 0) continue
      const avg = stats.hygieneSum / stats.count
      const docRef = db.collection('aggregates').doc(messId).collection('weekly').doc(weekId)
      await docRef.set({ weekId, weekStart: isoWeekStartDate(weekId), hygieneSum: stats.hygieneSum, count: stats.count, hygieneAvg: Number(avg.toFixed(2)), badge: computeBadge(avg) }, { merge: true })
      total++
    }
  }
  console.log('Backfill finished, weekly docs written:', total)
}

function computeBadge(score) {
  if (score >= 4.0) return 'Gold'
  if (score >= 3.0) return 'Silver'
  return 'Red'
}

backfill().catch(err => {
  console.error('Backfill failed', err)
  process.exit(1)
})
