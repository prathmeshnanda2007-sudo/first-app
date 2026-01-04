# Cloud Functions for MessCheck

This folder contains Firebase Cloud Functions that:

- Update daily hygiene aggregates when a new rating is created (`onRatingCreate`) and recompute weekly hygiene scores and badges for messes.
- Generate alerts when a mess has 3 consecutive low-hygiene days.
- Run a scheduled job (`weeklyComplaintSummary`) that scans complaints in the last 7 days and flags frequent complaint tags (count > 5).

Setup & deploy

1. Install dependencies:
   - cd firebase/functions
   - npm install
2. Deploy functions:
   - firebase deploy --only functions

   Run tests and backfill (dev)

   1. Install dev dependencies:
      - cd firebase/functions
      - npm install

   2. Run emulator-based tests:
      - npm run emulator:test
      This starts the Firestore emulator, runs the Mocha tests in `test/`, and stops the emulator automatically.

   3. Backfill weekly aggregates (one-time, idempotent):
      - npm run backfill:weekly
      The script `tools/backfillWeekly.js` scans `aggregates/{messId}/daily/*`, groups entries by ISO week (`YYYY-Www`), and writes `aggregates/{messId}/weekly/{weekId}` with { `weekId`, `weekStart`, `hygieneSum`, `count`, `hygieneAvg`, `badge` }. The script is safe to run multiple times.

   Dashboard summaries

    - A server-side function `onWeeklyAggregateWrite` listens to writes on `aggregates/{messId}/weekly/{weekId}` and updates `dashboardSummaries/{collegeId}` with a `messages` map containing lightweight per-mess summaries (weekId, avg, badge, prevAvg, trend, count). This makes Dashboard reads a single document read instead of N per mess.

    - The function stores summaries under `dashboardSummaries/{collegeId}`; if a mess has no `collegeId`, summaries are placed under `dashboardSummaries/global`.

Backfill dashboard summaries (one-time)

 - Run the backfill script to populate `dashboardSummaries/{collegeId}` from existing weekly aggregates:
    - npm run backfill:dashboard
    - Options:
       - `--week=YYYY-Www` to specify a target week (defaults to current ISO week)
       - `--dry` to run in dry mode (no writes)

 - The script is idempotent and safe to re-run; it replaces the `dashboardSummaries/{collegeId}` doc with the computed `messages` map so repeated runs are deterministic.

 - `--verbose` (dry-run-only) will produce a CSV and JSON artifact listing every weekly doc found for the target week including `path`, `messId`, `collegeId`, and `weekId`. Artifacts are written to `firebase/functions/artifacts/` and in CI are uploaded by the `backfill-dashboard` workflow so you can download and inspect them.

Notes

- Functions use the Admin SDK (server) so security rules are bypassed when they write aggregates and alerts.
- Alerts are written to the `alerts` collection with a deterministic ID to avoid duplicates (`low_hygiene_{messId}_{startDate}`, `complaint_flag_{messId}_{tag}_{weekStart}`).
- Adjust schedule and thresholds as needed.
