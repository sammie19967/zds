// Firebase initialization and Firestore helpers
// Ensure you set the env vars in your .env (see .env.example)
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, serverTimestamp, addDoc, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Helpful validation to catch misconfigured env
function assertFirebaseConfig(cfg) {
  const missing = [];
  if (!cfg.apiKey) missing.push('VITE_FIREBASE_API_KEY');
  if (!cfg.projectId) missing.push('VITE_FIREBASE_PROJECT_ID');
  if (!cfg.appId) missing.push('VITE_FIREBASE_APP_ID');
  if (missing.length) {
    // eslint-disable-next-line no-console
    console.error('Firebase config is missing required env vars:', missing.join(', '));
    throw new Error(`Firebase config missing: ${missing.join(', ')}. Did you create a .env file and restart the dev server?`);
  }
}

assertFirebaseConfig(config);

const app = getApps().length ? getApps()[0] : initializeApp(config);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Submit a contact message to Firestore
export async function submitContactMessage({ name, email, phone, subject, message }) {
  const payload = {
    name,
    email,
    phone: phone || '',
    subject: subject || 'General Inquiry',
    message,
    createdAt: serverTimestamp(),
  };
  await addDoc(collection(db, 'submissions'), payload);
}

// Submit an admission application to Firestore
export async function submitAdmissionApplication(data) {
  const payload = {
    ...data,
    createdAt: serverTimestamp(),
  };
  await addDoc(collection(db, 'admissions'), payload);
}

// Fetch recent submissions (simple helper)
export async function fetchRecentSubmissions({ take = 50 } = {}) {
  const q = query(collection(db, 'submissions'), orderBy('createdAt', 'desc'), limit(take));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Auth helpers
export async function signInWithEmail(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signUpWithEmail(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function signOutUser() {
  return signOut(auth);
}

export function subscribeAuth(callback) {
  return onAuthStateChanged(auth, callback);
}
