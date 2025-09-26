// Firebase initialization and Firestore helpers
// Ensure you set the env vars in your .env (see .env.example)
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, serverTimestamp, addDoc, collection, getDocs, query, orderBy, limit, doc, getDoc, updateDoc, deleteDoc, startAfter, where, runTransaction } from 'firebase/firestore';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  setPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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
export const storage = getStorage(app);

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

// Helper to generate the next admission number atomically
async function getNextAdmissionNumber() {
  const countersDocRef = doc(db, 'counters', 'admin_admissions');
  const next = await runTransaction(db, async (txn) => {
    const snap = await txn.get(countersDocRef);
    let last = 0;
    if (snap.exists()) {
      const d = snap.data();
      last = Number(d.lastAdmissionNumber) || 0;
    } else {
      // initialize the counters doc
      txn.set(countersDocRef, { lastAdmissionNumber: 0, updatedAt: serverTimestamp() });
    }
    const newVal = last + 1;
    txn.update(countersDocRef, { lastAdmissionNumber: newVal, updatedAt: serverTimestamp() });
    return newVal;
  });
  // Zero-pad to at least 4 digits (e.g., 0001, 0123, 1234). Will naturally exceed 4 once count > 9999.
  return String(next).padStart(4, '0');
}

// Submit an admin admission (admin registration of a student) to Firestore
export async function submitAdminAdmission(data) {
  // Generate a unique, incrementing admission number
  const admissionNumber = await getNextAdmissionNumber();
  const payload = {
    ...data,
    admissionNumber,
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(collection(db, 'admin_admissions'), payload);
  return { id: docRef.id, admissionNumber };
}

// Upload a passport photo for admin admission and return the public URL
export async function uploadAdminAdmissionPhoto(file) {
  if (!file) return '';
  const safeName = file.name?.replace(/[^a-zA-Z0-9_.-]/g, '_') || 'photo.jpg';
  const key = `admin_admissions/${Date.now()}_${safeName}`;
  const storageRef = ref(storage, key);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}

// Fetch recent submissions (simple helper)
export async function fetchRecentSubmissions({ take = 50 } = {}) {
  const q = query(collection(db, 'submissions'), orderBy('createdAt', 'desc'), limit(take));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// List enquiries (contact form submissions) from 'submissions'
export async function listEnquiries({ take = 100 } = {}) {
  const qRef = query(collection(db, 'submissions'), orderBy('createdAt', 'desc'), limit(take));
  const snap = await getDocs(qRef);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// List applications (public site applications) from 'admissions'
export async function listApplications({ take = 100 } = {}) {
  const qRef = query(collection(db, 'admissions'), orderBy('createdAt', 'desc'), limit(take));
  const snap = await getDocs(qRef);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Auth helpers with 15-minute session timeout
let sessionTimer;
const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds

export async function signInWithEmail(email, password) {
  // Set session persistence to SESSION
  await setPersistence(auth, browserSessionPersistence);
  
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  
  // Reset any existing timer
  if (sessionTimer) {
    clearTimeout(sessionTimer);
  }
  
  // Set up the session timeout
  sessionTimer = setTimeout(() => {
    signOut(auth).then(() => {
      // Redirect to login page on timeout
      window.location.href = '/login';
    });
  }, SESSION_TIMEOUT);
  
  return userCredential.user;
}

export async function signUpWithEmail(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function signOutUser() {
  if (sessionTimer) {
    clearTimeout(sessionTimer);
  }
  return signOut(auth);
}

export function subscribeAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

// Admin admissions CRUD helpers
export async function listAdminAdmissions({ take = 100 } = {}) {
  const q = query(collection(db, 'admin_admissions'), orderBy('createdAt', 'desc'), limit(take));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function listAdminAdmissionsPage({ take = 25, cursor = null, course = '' } = {}) {
  let qBase = [orderBy('createdAt', 'desc'), limit(take)];
  const col = collection(db, 'admin_admissions');
  // Optional course filter
  if (course) {
    qBase = [where('course', '==', course), orderBy('createdAt', 'desc'), limit(take)];
  }
  let qRef = query(col, ...qBase);
  if (cursor) {
    qRef = query(col, ...qBase, startAfter(cursor));
  }
  const snap = await getDocs(qRef);
  const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  const lastDoc = snap.docs[snap.docs.length - 1] || null;
  return { items: docs, cursor: lastDoc };
}

export async function getAdminAdmissionById(id) {
  const ref = doc(db, 'admin_admissions', id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function updateAdminAdmission(id, data) {
  const ref = doc(db, 'admin_admissions', id);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
}

export async function deleteAdminAdmission(id) {
  const ref = doc(db, 'admin_admissions', id);
  await deleteDoc(ref);
}

// ===== Fees & Payments Helpers =====
// Course fees are stored in collection 'course_fees'
// - Driving: doc id 'Driving' with shape { classes: { 'A1/A2': { 'New Student': 7000, 'Endorsement': 5000, 'Refresher': 0 }, 'B1/B2': {...}, ... }, updatedAt }
// - Computing: doc id 'Computing' with shape { levels: { Beginner: 3000, Intermediate: 6000 }, updatedAt }
export async function getCourseFees() {
  // Backward compatibility: returns a flat map if present, else builds from structured docs
  const snap = await getDocs(collection(db, 'course_fees'));
  const fees = {};
  snap.forEach(d => { fees[d.id] = Number(d.data()?.amount || 0); });
  return fees; // { Driving: 5000, Computing: 3000 } when using legacy flat docs
}

// New: get structured fees
export async function getStructuredFees() {
  const drivingRef = doc(db, 'course_fees', 'Driving');
  const computingRef = doc(db, 'course_fees', 'Computing');
  const [dSnap, cSnap] = await Promise.all([getDoc(drivingRef), getDoc(computingRef)]);
  const driving = dSnap.exists() ? (dSnap.data()?.classes || {}) : {};
  const computing = cSnap.exists() ? (cSnap.data()?.levels || {}) : {};
  return { driving, computing };
}

export async function setCourseFee(courseKey, amount) {
  if (!courseKey) throw new Error('courseKey required');
  const ref = doc(db, 'course_fees', courseKey);
  await updateDoc(ref, { amount: Number(amount), updatedAt: serverTimestamp() }).catch(async (e) => {
    // If doc doesn't exist, create it
    if (e && /NOT_FOUND|No document to update/.test(String(e))) {
      await runTransaction(db, async (txn) => {
        const s = await txn.get(ref);
        if (!s.exists()) txn.set(ref, { amount: Number(amount), createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        else txn.update(ref, { amount: Number(amount), updatedAt: serverTimestamp() });
      });
    } else {
      throw e;
    }
  });
}

// New: set driving fee by class and type
export async function setDrivingFee(drivingClass, drivingType, amount) {
  if (!drivingClass || !drivingType) throw new Error('drivingClass and drivingType are required');
  const ref = doc(db, 'course_fees', 'Driving');
  await runTransaction(db, async (txn) => {
    const s = await txn.get(ref);
    const prev = s.exists() ? (s.data() || {}) : {};
    const classes = { ...(prev.classes || {}) };
    const classMap = { ...(classes[drivingClass] || {}) };
    classMap[drivingType] = Number(amount);
    classes[drivingClass] = classMap;
    if (!s.exists()) txn.set(ref, { classes, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    else txn.update(ref, { classes, updatedAt: serverTimestamp() });
  });
}

// New: set computing fee by level
export async function setComputingFee(level, amount) {
  if (!level) throw new Error('level is required');
  const ref = doc(db, 'course_fees', 'Computing');
  await runTransaction(db, async (txn) => {
    const s = await txn.get(ref);
    const prev = s.exists() ? (s.data() || {}) : {};
    const levels = { ...(prev.levels || {}) };
    levels[level] = Number(amount);
    if (!s.exists()) txn.set(ref, { levels, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    else txn.update(ref, { levels, updatedAt: serverTimestamp() });
  });
}

// Payments are stored under each student: admin_admissions/{id}/payments
export async function addStudentPayment(studentId, { amount, confirmationCode, paidAt = null, note = '' }) {
  if (!studentId) throw new Error('studentId required');
  const colRef = collection(db, 'admin_admissions', studentId, 'payments');
  const payload = {
    amount: Number(amount),
    confirmationCode: confirmationCode || '',
    paidAt: paidAt || new Date().toISOString(),
    note,
    createdAt: serverTimestamp(),
  };
  await addDoc(colRef, payload);
}

export async function listStudentPayments(studentId) {
  const colRef = collection(db, 'admin_admissions', studentId, 'payments');
  const qRef = query(colRef, orderBy('createdAt', 'desc'));
  const snap = await getDocs(qRef);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getStudentPaymentsTotal(studentId) {
  const payments = await listStudentPayments(studentId);
  return payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
}
