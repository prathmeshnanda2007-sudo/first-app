const admin = require('firebase-admin');

// This script seeds sample colleges and messes. Use with `node seed.js` after setting GOOGLE_APPLICATION_CREDENTIALS.
// Example: set GOOGLE_APPLICATION_CREDENTIALS=c:\path\to\serviceAccount.json; node seed.js

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!serviceAccountPath) {
  console.error('Please set GOOGLE_APPLICATION_CREDENTIALS env var to a service account json file');
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.applicationDefault() });
const db = admin.firestore();

async function seed() {
  const colleges = [
    { collegeId: 'college_a', name: 'College A', city: 'City X' },
    { collegeId: 'college_b', name: 'College B', city: 'City Y' }
  ];

  const messes = [
    { messId: 'mess_1', collegeId: 'college_a', name: 'Main Mess', hygieneScore: 4.2, badge: 'Gold' },
    { messId: 'mess_2', collegeId: 'college_a', name: 'Annex Mess', hygieneScore: 3.5, badge: 'Silver' },
    { messId: 'mess_3', collegeId: 'college_b', name: 'Central Mess', hygieneScore: 2.8, badge: 'Red' }
  ];

  for (const c of colleges) {
    await db.collection('colleges').doc(c.collegeId).set({ name: c.name, city: c.city });
    console.log('Seeded college', c.collegeId);
  }

  for (const m of messes) {
    await db.collection('messes').doc(m.messId).set({ collegeId: m.collegeId, name: m.name, hygieneScore: m.hygieneScore, badge: m.badge });
    console.log('Seeded mess', m.messId);
  }

  console.log('Seeding complete');
}

seed().catch(err => console.error(err));
