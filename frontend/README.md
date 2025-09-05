# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh
  npm install jspdf

## Firebase Form Submissions

This app can store Contact form submissions in Firebase Firestore.

Setup steps:

1. Create a Firebase project and enable Firestore (Native mode).
2. Copy `.env.example` to `.env` and fill your Firebase config values:

   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

3. Install dependencies:

   ```bash
   npm install
   ```

4. Configure Firestore Security Rules to allow writes to `submissions` but restrict reads (so public users can submit, but cannot list all submissions from the client):

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /submissions/{docId} {
         allow create: if true;            // anyone can submit
         allow read: if false;             // no public reads
       }

       // Deny everything else by default
       match /{document=**} {
         allow read, write: if false;
       }
     }
   }
   ```

5. Run the app:

   ```bash
   npm run dev
   ```
