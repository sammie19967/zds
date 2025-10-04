// Firebase initialization and Firestore helpers
// Ensure you set the env vars in your .env (see .env.example)
import { initializeApp, getApps } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { getFirestore, serverTimestamp, addDoc, collection, getDocs, query, orderBy, limit, doc, getDoc, updateDoc, deleteDoc, startAfter, where, runTransaction, collectionGroup, getCountFromServer, documentId } from 'firebase/firestore';
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

// Enable App Check debug token in development so local/dev builds work while App Check is enforced
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  // eslint-disable-next-line no-underscore-dangle
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true; // or set a specific token string if you prefer
}

const app = getApps().length ? getApps()[0] : initializeApp(config);

// Initialize App Check (reCAPTCHA v3). This automatically attaches App Check tokens
// to Firestore/Storage requests so they are not blocked when App Check enforcement is on.
try {
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || import.meta.env.VITE_FIREBASE_RECAPTCHA_KEY;
  if (siteKey) {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(siteKey),
      isTokenAutoRefreshEnabled: true,
    });
  } else {
    // eslint-disable-next-line no-console
    console.warn('[AppCheck] Missing VITE_RECAPTCHA_SITE_KEY in environment. App Check may block client requests when enforced.');
  }
} catch (e) {
  // eslint-disable-next-line no-console
  console.warn('[AppCheck] Initialization failed:', e);
}
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
    // We had 94 students before migration; start new admissions at 95.
    const BASE_START = 94; // so the first generated will be 95 -> '0095'
    let last = 0;
    if (snap.exists()) {
      const d = snap.data();
      last = Number(d.lastAdmissionNumber) || 0;
    } else {
      // Initialize the counters doc at 94 on first run
      txn.set(countersDocRef, { lastAdmissionNumber: BASE_START, updatedAt: serverTimestamp() });
      last = BASE_START;
    }
    // Ensure we never generate a number below 95 even if the counter was reset lower
    const baseLast = Math.max(last, BASE_START);
    const newVal = baseLast + 1;
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
export async function addStudentPayment(studentId, { amount, confirmationCode, paidAt = null, note = '' , method = ''}) {
  if (!studentId) throw new Error('studentId required');
  const colRef = collection(db, 'admin_admissions', studentId, 'payments');
  const paidIso = paidAt || new Date().toISOString();
  const payload = {
    amount: Number(amount),
    confirmationCode: confirmationCode || '',
    method: method || '',
    paidAt: paidIso,
    note,
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(colRef, payload);
  return docRef.id;
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

// Lookup a payment doc across all admin_admissions/*/payments by its document ID
export async function getPaymentById(paymentId) {
  if (!paymentId) return null;
  const qRef = query(collectionGroup(db, 'payments'), where(documentId(), '==', paymentId), limit(1));
  const snap = await getDocs(qRef);
  if (snap.empty) return null;
  const d = snap.docs[0];
  const payment = { id: d.id, ...d.data() };
  // parent is the payments collection, parent.parent is the student doc
  const studentRef = d.ref.parent.parent;
  const studentSnap = studentRef ? await getDoc(studentRef) : null;
  const student = studentSnap && studentSnap.exists() ? { id: studentSnap.id, ...studentSnap.data() } : null;
  return { payment, student };
}

// Fetch a specific payment by known studentId and paymentId
export async function getPaymentByStudent(studentId, paymentId) {
  if (!studentId || !paymentId) return null;
  const paymentRef = doc(db, 'admin_admissions', studentId, 'payments', paymentId);
  const snap = await getDoc(paymentRef);
  if (!snap.exists()) return null;
  const payment = { id: snap.id, ...snap.data() };
  const studentRef = doc(db, 'admin_admissions', studentId);
  const studentSnap = await getDoc(studentRef);
  const student = studentSnap.exists() ? { id: studentSnap.id, ...studentSnap.data() } : null;
  return { payment, student };
}

// Log a receipt verification attempt
export async function logReceiptVerification({
  studentId = '',
  paymentId = '',
  inputUrl = '',
  success = false,
  errorMessage = '',
}) {
  try {
    const payload = {
      studentId,
      paymentId,
      inputUrl,
      success: Boolean(success),
      errorMessage: String(errorMessage || ''),
      createdAt: serverTimestamp(),
    };
    await addDoc(collection(db, 'receipt_verifications'), payload);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.debug('Failed to log verification attempt', e);
  }
}

// ===== Fuel Tracking Helpers =====
// Settings doc: settings/fuel { pricePerLitre: number, updatedAt }
export async function getFuelSettings() {
  const ref = doc(db, 'settings', 'fuel');
  const snap = await getDoc(ref);
  if (!snap.exists()) return { pricePerLitre: 0 };
  const d = snap.data() || {};
  return { pricePerLitre: Number(d.pricePerLitre || 0), ...d };
}

// ===== Employees & Expenses (Admin) =====
// Employees CRUD
export async function addEmployee({ name, role = '', baseSalary = 0, phone = '', email = '', idNumber = '' }) {
  const payload = {
    name: String(name || '').trim(),
    role: String(role || '').trim(),
    baseSalary: Number(baseSalary) || 0,
    phone: String(phone || '').trim(),
    email: String(email || '').trim(),
    idNumber: String(idNumber || '').trim(),
    createdAt: serverTimestamp(),
    active: true,
  };
  const ref = await addDoc(collection(db, 'employees'), payload);
  return ref.id;
}

export async function listEmployees({ take = 500 } = {}) {
  const q = query(collection(db, 'employees'));
  const snap = await getDocs(q);
  const items = [];
  snap.forEach(d => items.push({ id: d.id, ...d.data() }));
  return items.slice(0, take);
}

export async function updateEmployee(id, patch) {
  if (!id) throw new Error('id required');
  const ref = doc(db, 'employees', id);
  await updateDoc(ref, { ...patch, updatedAt: serverTimestamp() });
}

export async function deleteEmployee(id) {
  if (!id) throw new Error('id required');
  await deleteDoc(doc(db, 'employees', id));
}

// Expenses CRUD
// Expense: { amount, category, note, dateISO, dateMs, employeeId?, month: 'YYYY-MM' }
export async function addExpense({ amount, category, note = '', dateISO, employeeId = '' }) {
  const amt = Number(amount) || 0;
  if (amt <= 0) throw new Error('amount must be > 0');
  const iso = dateISO || new Date().toISOString().slice(0,10);
  const ms = new Date(`${iso}T00:00:00`).getTime();
  const month = `${iso.slice(0,7)}`;
  const payload = {
    amount: amt,
    category: String(category || 'other').toLowerCase(),
    note: String(note || ''),
    dateISO: iso,
    dateMs: ms,
    month,
    employeeId: String(employeeId || ''),
    createdAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, 'expenses'), payload);
  return ref.id;
}

export async function listExpenses({ month, take = 1000 } = {}) {
  let qRef = collection(db, 'expenses');
  if (month) {
    qRef = query(qRef, where('month', '==', month));
  }
  const snap = await getDocs(qRef);
  const items = [];
  snap.forEach(d => items.push({ id: d.id, ...d.data() }));
  return items.slice(0, take);
}

export async function updateExpense(id, patch) {
  if (!id) throw new Error('id required');
  const ref = doc(db, 'expenses', id);
  await updateDoc(ref, { ...patch, updatedAt: serverTimestamp() });
}

export async function deleteExpense(id) {
  if (!id) throw new Error('id required');
  await deleteDoc(doc(db, 'expenses', id));
}

export async function getMonthlyExpensesTotal(month) {
  const items = await listExpenses({ month, take: 5000 });
  return items.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
}

export async function setFuelPricePerLitre(price) {
  const ref = doc(db, 'settings', 'fuel');
  await runTransaction(db, async (txn) => {
    const s = await txn.get(ref);
    const payload = { pricePerLitre: Number(price) || 0, updatedAt: serverTimestamp() };
    if (!s.exists()) txn.set(ref, { ...payload, createdAt: serverTimestamp() });
    else txn.update(ref, payload);
  });
}

// Fuel logs collection: fuel_logs
// Each log shape:
// {
//   dateISO: 'YYYY-MM-DD',
//   dateMs: number (midnight millis),
//   vehicleId: string | '',
//   startOdo: number,
//   endOdo: number,
//   distanceKm: number,
//   litres: number,
//   pricePerLitre: number, // resolved effective price (settings or override)
//   fuelCost: number, // litres * pricePerLitre
//   students: [{ id, name }],
//   note: string,
//   createdAt: serverTimestamp()
// }
export async function addFuelLog(log) {
  const colRef = collection(db, 'fuel_logs');
  const start = Number(log.startOdo) || 0;
  const end = Number(log.endOdo) || 0;
  const distanceKm = Math.max(0, end - start);
  const litres = Number(log.litres) || 0;
  let effectivePrice = Number(log.pricePerLitre);
  if (!effectivePrice) {
    const settings = await getFuelSettings();
    effectivePrice = Number(settings.pricePerLitre || 0);
  }
  const fuelCost = Number((litres * effectivePrice).toFixed(2));
  const dateISO = log.dateISO || new Date().toISOString().slice(0, 10);
  const dateMs = log.dateMs || new Date(`${dateISO}T00:00:00`).getTime();
  const payload = {
    type: log.type === 'fueling' ? 'fueling' : 'daily',
    dateISO,
    dateMs,
    vehicleId: log.vehicleId || '',
    startOdo: start,
    endOdo: end,
    distanceKm,
    litres,
    pricePerLitre: effectivePrice,
    fuelCost,
    students: Array.isArray(log.students) ? log.students.map(s => ({ id: s.id, name: s.name })) : [],
    note: log.note || '',
    createdAt: serverTimestamp(),
  };
  await addDoc(colRef, payload);
  return payload;
}

export async function listFuelLogs({ take = 200, month = '', startMs = null, endMs = null, type = '' } = {}) {
  const colRef = collection(db, 'fuel_logs');
  let qParts = [];
  if (type === 'daily' || type === 'fueling') {
    qParts.push(where('type', '==', type));
  }
  // Filter by month (YYYY-MM) or by range
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const start = new Date(`${month}-01T00:00:00`).getTime();
    const endBase = new Date(`${month}-01T00:00:00`);
    const end = new Date(endBase.getFullYear(), endBase.getMonth() + 1, 1).getTime();
    qParts.push(where('dateMs', '>=', start));
    qParts.push(where('dateMs', '<', end));
  } else if (typeof startMs === 'number' && typeof endMs === 'number') {
    qParts.push(where('dateMs', '>=', startMs));
    qParts.push(where('dateMs', '<=', endMs));
  }
  qParts.push(orderBy('dateMs', 'desc'));
  qParts.push(limit(take));
  const qRef = query(colRef, ...qParts);
  const snap = await getDocs(qRef);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ===== Dashboard Helpers =====
function monthRange(monthYYYYMM) {
  // monthYYYYMM: 'YYYY-MM'
  const base = monthYYYYMM ? new Date(`${monthYYYYMM}-01T00:00:00`) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const start = new Date(base.getFullYear(), base.getMonth(), 1);
  const end = new Date(base.getFullYear(), base.getMonth() + 1, 1);
  return { start, end };
}

export async function getCountAdminAdmissions() {
  const qRef = query(collection(db, 'admin_admissions'));
  const snapshot = await getCountFromServer(qRef);
  return snapshot.data().count || 0;
}

export async function getMonthlyEnquiriesCount(month = '') {
  const { start, end } = monthRange(month);
  const qRef = query(collection(db, 'submissions'), where('createdAt', '>=', start), where('createdAt', '<', end));
  const snap = await getDocs(qRef);
  return snap.size;
}

export async function getMonthlyApplicationsCount(month = '') {
  const { start, end } = monthRange(month);
  const qRef = query(collection(db, 'admissions'), where('createdAt', '>=', start), where('createdAt', '<', end));
  const snap = await getDocs(qRef);
  return snap.size;
}

export async function getMonthlyPaymentsTotal(month = '') {
  const { start, end } = monthRange(month);
  // Query all payments across admin_admissions/*/payments via collection group using createdAt range
  const qRef = query(collectionGroup(db, 'payments'), where('createdAt', '>=', start), where('createdAt', '<', end));
  const snap = await getDocs(qRef);
  return snap.docs.reduce((sum, d) => sum + (Number(d.data()?.amount) || 0), 0);
}

export async function getMonthlyFuelCost(month = '') {
  const { start, end } = monthRange(month);
  const qRef = query(
    collection(db, 'fuel_logs'),
    where('type', '==', 'fueling'),
    where('dateMs', '>=', start.getTime()),
    where('dateMs', '<', end.getTime()),
    orderBy('dateMs', 'desc'),
    limit(1000)
  );
  const snap = await getDocs(qRef);
  return snap.docs.reduce((sum, d) => sum + (Number(d.data()?.fuelCost) || 0), 0);
}

// ===== DANGEROUS: Demo Data Wipe =====
// This function is meant for demo/onboarding reset only. It deletes documents in
// common collections and orphaned payments (collection group), and resets counters.
// Ensure Firestore security rules allow the authenticated admin to perform deletions.
export async function dangerousWipeDemoData() {
  // Helper to delete all docs in a collection (no subcollections)
  const wipeCollection = async (colName) => {
    const snap = await getDocs(collection(db, colName));
    const deletions = snap.docs.map((d) => deleteDoc(doc(db, colName, d.id)));
    await Promise.allSettled(deletions);
  };

  // 1) Delete expenses, employees, fuel_logs, submissions, admissions, admin_admissions
  await wipeCollection('expenses').catch(() => {});
  await wipeCollection('employees').catch(() => {});
  await wipeCollection('fuel_logs').catch(() => {});
  await wipeCollection('submissions').catch(() => {});
  await wipeCollection('admissions').catch(() => {});

  // admin_admissions (parent docs only); note: does not delete subcollections automatically
  await wipeCollection('admin_admissions').catch(() => {});

  // 2) Delete orphaned payments across all students via collection group
  try {
    const paySnap = await getDocs(collectionGroup(db, 'payments'));
    const payDeletes = paySnap.docs.map((d) => deleteDoc(d.ref));
    await Promise.allSettled(payDeletes);
  } catch (_) {
    // ignore if rules block collection group deletes
  }

  // 3) Reset counters
  try {
    const countersRef = doc(db, 'counters', 'admin_admissions');
    const s = await getDoc(countersRef);
    if (s.exists()) {
      await updateDoc(countersRef, { lastAdmissionNumber: 0, updatedAt: serverTimestamp() });
    }
  } catch (_) {
    // ignore
  }
}
