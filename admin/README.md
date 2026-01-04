# MessCheck Admin Panel (Scaffold)

This is a minimal admin panel for MessCheck built with React (18), Vite, and Material UI.

Features included:
- Firebase authentication (Email/Password) with a simple `AuthProvider` that loads `users/{uid}` for role checks
- Dashboard page showing mess hygiene scores, badges, and alerts
- Basic chart using Chart.js (bar chart for hygiene scores)
- Alerts panel that lists alerts created by Cloud Functions

Setup

1. cd admin
2. npm install
3. Replace Firebase config in `src/services/firebase.js` with your project config
4. Start dev server: npm run dev

Next steps

- Wire export to CSV/PDF
- Add more charts and drill-downs for mess/day
- Add role-based enforcement (admin-only) and testing with Firebase emulator
 
Notes

- Create an admin user in Firebase Auth (Email/Password) and set their `users/{uid}.role` field to `admin` in Firestore to allow access.
- The app reads `messes` and `alerts` collections; Cloud Functions write alerts and aggregates via the Admin SDK.
- For production, configure OAuth domains and secure the app behind proper auth restrictions.
