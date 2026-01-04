# Firestore Schema & Indexes

This document describes the Firestore schema used by MessCheck and example queries that should be indexed.

Collections:
- `users/{userId}`: store user profile, role (student/admin), collegeId, messId
- `colleges/{collegeId}`: name, city
- `messes/{messId}`: collegeId, name, hygieneScore, badge
- `ratings/{ratingId}`: messId, userId, mealType, taste, hygiene, quantity, comment, imageUrl, timestamp
- `complaints/{complaintId}`: messId, userId, tags, description, timestamp
 - `aggregates/{messId}/daily/{YYYY-MM-DD}`: hygieneSum, count, date (created by Cloud Functions)
 - `alerts/{alertId}`: messId, type, message, createdAt, resolved (created by Cloud Functions)

Indexes (see `firebase/firestore.indexes.json`):
- ratings by (messId ASC, timestamp DESC) for fetching recent ratings per mess
- complaints by (messId ASC, timestamp DESC) for weekly complaint scans

Rules & best practices:
- Use `whereEqualTo("messId", messId).orderBy("timestamp", "desc").limit(50)` for recent ratings and ensure the index exists.
- Avoid fetching large datasets; paginate queries.
- Use Cloud Functions for aggregate calculations and keep reads cheap on clients.

Seeding:
- `firebase/seed.js` is included to create sample colleges and messes. Run with:
  - `set GOOGLE_APPLICATION_CREDENTIALS=C:\path\to\serviceAccount.json; node firebase/seed.js`

