// Cloud Functions for MessCheck: hygiene aggregation, badge computation, and alerts
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

const computeBadge = (score) => {
  if (score >= 4.0) return 'Gold';
  if (score >= 3.0) return 'Silver';
  return 'Red';
};

const { getISOWeek, isoWeekStartDate } = require('./helpers')
const { getPreviousWeek } = require('./helpers')

const formatDate = (d) => {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// When a rating is created we update the daily hygiene aggregate for that mess and recompute weekly hygiene score.
exports.onRatingCreate = functions.firestore.document('ratings/{ratingId}').onCreate(async (snap, context) => {
  const rating = snap.data();
  if (!rating || !rating.messId || typeof rating.hygiene === 'undefined') return null;

  const messId = rating.messId;
  // Use the rating timestamp if present otherwise server timestamp
  const ts = rating.timestamp ? new admin.firestore.Timestamp(rating.timestamp._seconds, rating.timestamp._nanoseconds) : admin.firestore.Timestamp.now();
  const date = ts.toDate();
  const dateStr = formatDate(date);

  const dailyRef = db.collection('aggregates').doc(messId).collection('daily').doc(dateStr);

  // Atomically increment daily counters
  await db.runTransaction(async (t) => {
    const doc = await t.get(dailyRef);
    if (!doc.exists) {
      t.set(dailyRef, {
        date: dateStr,
        hygieneSum: rating.hygiene,
        count: 1
      });
    } else {
      t.update(dailyRef, {
        hygieneSum: admin.firestore.FieldValue.increment(rating.hygiene),
        count: admin.firestore.FieldValue.increment(1)
      });
    }
  });

  // Recompute weekly hygiene score (last 7 days) and update mess document + badge
  const today = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setUTCDate(today.getUTCDate() - i);
    days.push(formatDate(d));
  }

  const dailyDocs = await Promise.all(days.map(d => db.collection('aggregates').doc(messId).collection('daily').doc(d).get()));
  const dailyAverages = dailyDocs.map(doc => doc.exists ? (doc.data().hygieneSum / doc.data().count) : null);

  // compute weekly average across days that have data
  const sums = dailyAverages.filter(v => v !== null).reduce((acc, v) => acc + v, 0);
  const countDays = dailyAverages.filter(v => v !== null).length;
  const weeklyAverage = countDays > 0 ? (sums / countDays) : 0.0;

  const messRef = db.collection('messes').doc(messId);
  await messRef.update({ hygieneScore: weeklyAverage, badge: computeBadge(weeklyAverage) }).catch(async (err) => {
    // if mess doc doesn't exist yet, set it with these fields
    await messRef.set({ hygieneScore: weeklyAverage, badge: computeBadge(weeklyAverage) }, { merge: true });
  });

  // Update weekly bucket for ISO week (server-side weekly aggregation)
  try {
    const weekId = getISOWeek(date);
    const weeklyRef = db.collection('aggregates').doc(messId).collection('weekly').doc(weekId);
    await db.runTransaction(async (t) => {
      const wDoc = await t.get(weeklyRef);
      if (!wDoc.exists) {
        // initialise
        t.set(weeklyRef, {
          weekId,
          weekStart: isoWeekStartDate(weekId),
          hygieneSum: rating.hygiene,
          count: 1,
          hygieneAvg: Number((rating.hygiene).toFixed(2)),
          badge: computeBadge(rating.hygiene)
        });
      } else {
        const prev = wDoc.data();
        const newSum = (prev.hygieneSum || 0) + rating.hygiene;
        const newCount = (prev.count || 0) + 1;
        const avg = newCount > 0 ? (newSum / newCount) : 0.0;
        t.update(weeklyRef, {
          hygieneSum: admin.firestore.FieldValue.increment(rating.hygiene),
          count: admin.firestore.FieldValue.increment(1),
          hygieneAvg: Number(avg.toFixed(2)),
          badge: computeBadge(avg),
          weekStart: prev.weekStart || isoWeekStartDate(weekId)
        });
      }
    });
  } catch (e) {
    console.error('Failed to update weekly aggregate', e);
  }

  // Check for consecutive low score days (last 3 days) and write an alert if needed
  const last3 = dailyAverages.slice(0, 3);
  const lowStreak = last3.length === 3 && last3.every(v => v !== null && v < 3.0);
  if (lowStreak) {
    const startDate = days[2]; // oldest of the 3-day window
    const alertId = `low_hygiene_${messId}_${startDate}`;
    const alertRef = db.collection('alerts').doc(alertId);
    await alertRef.set({
      messId,
      type: 'low_hygiene',
      message: `Hygiene score < 3 for 3 consecutive days starting ${startDate}`,
      startDate,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      resolved: false
    }, { merge: true });
  }

  return null;
});

// Update dashboard summary document per college when weekly aggregates are created/updated/deleted
exports.onWeeklyAggregateWrite = functions.firestore.document('aggregates/{messId}/weekly/{weekId}').onWrite(async (change, context) => {
  const messId = context.params.messId
  const weekId = context.params.weekId
  const after = change.after.exists ? change.after.data() : null
  const before = change.before.exists ? change.before.data() : null

  // fetch mess document to find collegeId and name
  const messSnap = await db.collection('messes').doc(messId).get()
  const collegeId = messSnap.exists ? (messSnap.data().collegeId || 'global') : 'global'
  const messName = messSnap.exists ? (messSnap.data().name || '') : ''

  const summaryRef = db.collection('dashboardSummaries').doc(collegeId)

  // handle deletion
  if (!after) {
    // remove the mess entry from the summary
    try {
      await summaryRef.update({ [`messages.${messId}`]: admin.firestore.FieldValue.delete(), lastUpdated: admin.firestore.FieldValue.serverTimestamp() })
    } catch (e) {
      // if doc doesn't exist, nothing to do
      console.error('Failed to remove message from summary', e)
    }
    return null
  }

  // compute previous week avg for trend
  const prevWeekId = getPreviousWeek(weekId)
  const prevSnap = await db.collection('aggregates').doc(messId).collection('weekly').doc(prevWeekId).get()
  const prevAvg = prevSnap.exists ? (prevSnap.data().hygieneAvg || null) : null

  const curAvg = after.hygieneAvg || (after.hygieneSum && after.count ? (after.hygieneSum / after.count) : null)
  const badge = after.badge || computeBadge(curAvg || 0)
  const count = after.count || 0

  let trend = 0
  if (prevAvg == null) trend = 0
  else if (curAvg > prevAvg) trend = 1
  else if (curAvg < prevAvg) trend = -1

  const payload = {
    messages: {
      [messId]: {
        messId,
        name: messName,
        weekId,
        avg: Number(curAvg !== null ? Number(curAvg.toFixed(2)) : null),
        badge,
        count,
        prevAvg: prevAvg != null ? Number(Number(prevAvg).toFixed(2)) : null,
        trend,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }
    },
    lastUpdated: admin.firestore.FieldValue.serverTimestamp()
  }

  await summaryRef.set(payload, { merge: true })
  return null
})

// Weekly complaint analysis: scheduled job that runs every day and flags any mess tag with >5 occurrences in the last 7 days
exports.weeklyComplaintSummary = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  const now = admin.firestore.Timestamp.now().toDate();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setUTCDate(now.getUTCDate() - 7);
  const startTs = admin.firestore.Timestamp.fromDate(sevenDaysAgo);

  const complaintsSnap = await db.collection('complaints').where('timestamp', '>=', startTs).get();
  const counts = {}; // map messId -> tag -> count
  complaintsSnap.forEach(doc => {
    const data = doc.data();
    const messId = data.messId;
    const tags = data.tags || [];
    if (!counts[messId]) counts[messId] = {};
    tags.forEach(tag => {
      counts[messId][tag] = (counts[messId][tag] || 0) + 1;
    });
  });

  const batch = db.batch();
  for (const messId of Object.keys(counts)) {
    for (const tag of Object.keys(counts[messId])) {
      const cnt = counts[messId][tag];
      if (cnt > 5) {
        const weekStart = formatDate(sevenDaysAgo);
        const alertId = `complaint_flag_${messId}_${tag}_${weekStart}`;
        const ref = db.collection('alerts').doc(alertId);
        batch.set(ref, {
          messId,
          type: 'complaint_flag',
          tag,
          count: cnt,
          weekStart,
          message: `Tag ${tag} appeared ${cnt} times in last 7 days for mess ${messId}`,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          resolved: false
        }, { merge: true });
      }
    }
  }
  await batch.commit();

  return null;
});

// Recompute weekly aggregates from daily aggregates for recent weeks (safety / backfill)
exports.recomputeWeeklyAggregates = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  // compute last 8 ISO weeks
  const now = new Date();
  const weeks = [];
  for (let i = 0; i < 8; i++) {
    const d = new Date(now);
    d.setUTCDate(now.getUTCDate() - i * 7);
    weeks.push(getISOWeek(d));
  }

  const messesSnap = await db.collection('messes').get();
  const promises = [];
  messesSnap.forEach(ms => {
    const messId = ms.id;
    weeks.forEach(weekId => {
      // build array of 7 date strings for the week
      const weekStartStr = isoWeekStartDate(weekId)
      const start = new Date(`${weekStartStr}T00:00:00Z`)
      const dates = []
      for (let j = 0; j < 7; j++) {
        const d = new Date(start)
        d.setUTCDate(start.getUTCDate() + j)
        dates.push(formatDate(d))
      }
      const p = db.collection('aggregates').doc(messId).collection('daily').where('date', 'in', dates).get().then(snap => {
        if (snap.empty) return null
        let hSum = 0
        let cnt = 0
        snap.forEach(d => {
          const data = d.data()
          hSum += (data.hygieneSum || 0)
          cnt += (data.count || 0)
        })
        if (cnt === 0) return null
        const avg = hSum / cnt
        const weeklyRef = db.collection('aggregates').doc(messId).collection('weekly').doc(weekId)
        return weeklyRef.set({ weekId, weekStart: weekStartStr, hygieneSum: hSum, count: cnt, hygieneAvg: Number(avg.toFixed(2)), badge: computeBadge(avg) }, { merge: true })
      }).catch(err => { console.error('recompute week failed', messId, weekId, err) })
      promises.push(p)
    })
  })

  await Promise.all(promises)
  return null
})
