# MessCheck Android (Scaffold)

This folder contains a minimal Android Studio project scaffold for the MessCheck app (Kotlin + Jetpack Compose, Material 3).

## What is included
- Minimal Gradle config (top-level and `:app` module)
- `MainActivity` with a simple Compose splash screen
- `themes.xml` with Material3 DayNight support (dark mode enabled)
- Placeholders for Firebase integration instructions

## Firebase placeholders
1. Create a Firebase project and add an Android app with package `com.messcheck`.
2. Download `google-services.json` and place it at `app/google-services.json`.
3. In `app/build.gradle` we include Firebase BoM and common Firebase SDKs (Auth, Firestore, Storage).

## Authentication (Email & Phone)

- This scaffold includes an implementation for Firebase Authentication (Email/Password and Phone OTP).
- Enable **Email/Password** and **Phone** sign-in providers in the Firebase Console → Authentication → Sign-in method.
- After a user authenticates, a `users/{uid}` document will be created with default `role: "student"`. Admins will be managed separately via the web admin panel.
- On first successful sign-in the app routes the user to the College & Mess selection screen where their `collegeId` and `messId` are saved into the user document.

## Notes
- Placeholders are included for Cloud Functions and Firestore rules under the `firebase/` folder.
- Phone OTP uses Firebase's phone authentication flow; auto-retrieval depends on device and network conditions.

## Image upload

- The app supports selecting images from the gallery and capturing via camera (if available).
- Camera capture uses a `FileProvider`; ensure the Android manifest contains the provider entry and permissions (already included in scaffold).
- Images are resized and compressed before upload to Firebase Storage to reduce bandwidth and storage usage.
- Upload progress is shown in the UI and on success the image download URL is attached to the rating document.
 - Camera capture requires the `CAMERA` permission; the app requests it at runtime when needed.
 
## Firestore

- The app expects the following collections: `users`, `colleges`, `messes`, `ratings`, and `complaints`.
- A seed script is included at `firebase/seed.js` to add sample colleges/messes for testing.
- Index suggestions are included in `firebase/firestore.indexes.json` and documented in `messcheck-android/README_FIRESTORE.md`.

## Next steps
- Implement Navigation, Auth (OTP + Email), Firestore models, and image upload.
- Add unit tests and CI setup.

> Note: This is a scaffold to help you open the project in Android Studio. You will need to run Gradle sync and add the google-services.json file.
