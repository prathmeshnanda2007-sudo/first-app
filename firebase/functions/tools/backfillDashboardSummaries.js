const admin = require('firebase-admin')
const { getISOWeek, getPreviousWeek } = require('../helpers')

// Initialize admin; expects FIRESTORE_EMULATOR_HOST set for emulator
if (!admin.apps.length) admin.initializeApp()
const db = admin.firestore()

const fs = require('fs')
const path = require('path')

async function backfillDashboardSummaries({ targetWeek = getISOWeek(new Date()), dryRun = false, verbose = false } = {}) {
  console.log('Backfilling dashboard summaries for week', targetWeek, dryRun ? '(DRY-RUN)' : '')
  const prevWeek = getPreviousWeek(targetWeek)

  const messesSnap = await db.collection('messes').get()
  const summariesByCollege = {}

  for (const ms of messesSnap.docs) {
    const messId = ms.id
    const messData = ms.data() || {}
    const collegeId = messData.collegeId || 'global'
    const name = messData.name || ''

    // read current and previous weekly docs
    const curSnap = await db.collection('aggregates').doc(messId).collection('weekly').doc(targetWeek).get()
    if (!curSnap.exists) continue // skip messes with no data for target week
    const cur = curSnap.data()
    const prevSnap = await db.collection('aggregates').doc(messId).collection('weekly').doc(prevWeek).get()
    const prev = prevSnap.exists ? prevSnap.data() : null

    const curAvg = cur.hygieneAvg != null ? Number(Number(cur.hygieneAvg).toFixed(2)) : null
    const prevAvg = prev && prev.hygieneAvg != null ? Number(Number(prev.hygieneAvg).toFixed(2)) : null
    let trend = 0
    if (prevAvg == null) trend = 0
    else if (curAvg > prevAvg) trend = 1
    else if (curAvg < prevAvg) trend = -1

    const entry = {
      messId,
      name,
      weekId: targetWeek,
      avg: curAvg,
      badge: cur.badge || null,
      count: cur.count || 0,
      prevAvg,
      trend,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }

    if (!summariesByCollege[collegeId]) summariesByCollege[collegeId] = { messages: {} }
    summariesByCollege[collegeId].messages[messId] = entry
  }

  // If verbose mode, also enumerate all weekly docs for the given week using collectionGroup
  let artifactPaths = []
  if (verbose) {
    const rows = []
    const snap = await db.collectionGroup('weekly').where('weekId', '==', targetWeek).get()
    console.log('Verbose: found weekly docs via collectionGroup:', snap.size)
    for (const d of snap.docs) {
      const data = d.data() || {}
      // try to derive messId from path: aggregates/{messId}/weekly/{weekId}
      const parts = d.ref.path.split('/')
      const messId = parts.length >= 3 ? parts[1] : null
      let collegeId = data.collegeId || null
      // if collegeId not on weekly doc, fetch mess doc
      if (!collegeId && messId) {
        const mdoc = await db.collection('messes').doc(messId).get()
        if (mdoc.exists) collegeId = mdoc.data().collegeId || null
      }
      rows.push({ path: d.ref.path, messId, collegeId, weekId: data.weekId || targetWeek })
    }

    // write JSON and CSV artifacts
    const outDir = path.join(__dirname, '..', 'artifacts')
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
    const jsonPath = path.join(outDir, `backfill-dashboard-verbose-${targetWeek}.json`)
    fs.writeFileSync(jsonPath, JSON.stringify(rows, null, 2))
    const csvPath = path.join(outDir, `backfill-dashboard-verbose-${targetWeek}.csv`)
    const csvLines = ['path,messId,collegeId,weekId', ...rows.map(r => `${r.path},${r.messId || ''},${r.collegeId || ''},${r.weekId}`)]
    fs.writeFileSync(csvPath, csvLines.join('\n'))
    artifactPaths = [jsonPath, csvPath]
    console.log('Verbose artifacts written:', artifactPaths.join(', '))
  }

  const results = []
  for (const [collegeId, payload] of Object.entries(summariesByCollege)) {
    const ref = db.collection('dashboardSummaries').doc(collegeId)
    if (dryRun) {
      console.log('Would set', ref.path, JSON.stringify(payload).slice(0, 200))
      results.push({ collegeId, written: false })
    } else {
      // Replace the document to ensure idempotency
      await ref.set({ messages: payload.messages, lastUpdated: admin.firestore.FieldValue.serverTimestamp() }, { merge: false })
      results.push({ collegeId, written: true })
    }
  }

  console.log('Backfill completed. Colleges processed:', results.length)
  return { results, artifacts: artifactPaths }
}

if (require.main === module) {
  const argv = require('minimist')(process.argv.slice(2))
  const week = argv.week || argv.w
  const dry = argv.dry || argv.d
  const verbose = argv.verbose || argv.v
;(async () => {
    try {
      const res = await backfillDashboardSummaries({ targetWeek: week, dryRun: !!dry, verbose: !!verbose })
      if (res && res.artifacts && res.artifacts.length > 0) console.log('ARTIFACTS:', res.artifacts.join(';'))
      process.exit(0)
    } catch (e) {
      console.error('Backfill failed', e)
      process.exit(1)
    }
  })()
}

module.exports = { backfillDashboardSummaries }
