import { getApps, initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  sendEmailVerification as firebaseSendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile
} from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc
} from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js';

// Firebase web configuration is public by design. Access is protected by
// Firebase Authentication plus the firestore.rules file in this project.
const firebaseConfig = {
  apiKey: 'AIzaSyDuXQLGWQCN7Z0bftB-z3apAwQnV7VHXCo',
  authDomain: 'pizzaria-690ad.firebaseapp.com',
  databaseURL: 'https://pizzaria-690ad-default-rtdb.firebaseio.com',
  projectId: 'pizzaria-690ad',
  storageBucket: 'pizzaria-690ad.firebasestorage.app',
  messagingSenderId: '136001011862',
  appId: '1:136001011862:web:fae12d9be49f9a6b0f82b7',
  measurementId: 'G-3DTD37YQ2J'
};

export const ADMIN_EMAIL = 'dudumesquita2004@gmail.com';
export const ORDER_STATUSES = Object.freeze([
  'new',
  'confirmed',
  'preparing',
  'out_for_delivery',
  'delivered',
  'cancelled'
]);

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// The first auth event tells callers that Firebase restored any saved login.
const initialAuthState = new Promise(resolve => {
  let unsubscribe = null;
  let hasResolved = false;
  unsubscribe = firebaseOnAuthStateChanged(auth, user => {
    if (hasResolved) return;
    hasResolved = true;
    if (unsubscribe) unsubscribe();
    resolve(user);
  });
  // Covers an implementation that invokes the callback before returning its
  // unsubscribe function.
  if (hasResolved) unsubscribe();
});

function normalizedEmail(email) {
  return String(email || '').trim().toLowerCase();
}

export function isAdminEmail(email, emailVerified) {
  const isCurrentUser = normalizedEmail(auth.currentUser?.email) === normalizedEmail(email);
  const verified = isCurrentUser ? auth.currentUser?.emailVerified : emailVerified;
  return normalizedEmail(email) === ADMIN_EMAIL && verified === true;
}

function sessionFromUser(user) {
  if (!user) return null;

  const email = normalizedEmail(user.email);
  const isAuthenticated = !user.isAnonymous && Boolean(email);

  return Object.freeze({
    uid: user.uid,
    email,
    displayName: user.displayName || '',
    emailVerified: Boolean(user.emailVerified),
    isAnonymous: Boolean(user.isAnonymous),
    isAuthenticated,
    isAdmin: isAuthenticated && isAdminEmail(email, user.emailVerified),
    providerIds: user.providerData.map(provider => provider.providerId)
  });
}

function authError(message) {
  const error = new Error(message);
  error.code = 'auth/requires-authenticated-user';
  return error;
}

function adminError() {
  const error = new Error('Esta conta nao tem permissao para acessar os pedidos.');
  error.code = 'auth/admin-required';
  return error;
}

function orderError(message) {
  const error = new Error(message);
  error.code = 'orders/invalid-order';
  return error;
}

async function authenticatedUser() {
  await initialAuthState;
  const user = auth.currentUser;

  if (!user || user.isAnonymous || !user.email) {
    throw authError('Entre na sua conta para registrar um pedido.');
  }

  return user;
}

async function adminSession() {
  const user = await authenticatedUser();
  const session = sessionFromUser(user);

  if (!session?.isAdmin) throw adminError();
  return session;
}

function maximum(limitValue) {
  const value = Number(limitValue);
  if (!Number.isInteger(value) || value < 1 || value > 100) return 100;
  return value;
}

function ordersQuery(maximumResults) {
  return query(
    collection(db, 'orders'),
    orderBy('createdAt', 'desc'),
    limit(maximum(maximumResults))
  );
}

function orderFromSnapshot(snapshot) {
  return { id: snapshot.id, ...snapshot.data() };
}

function orderDataFor(user, orderRequest) {
  if (!orderRequest || typeof orderRequest !== 'object') {
    throw orderError('Os dados do pedido sao obrigatorios.');
  }

  // Whitelist only the fields customers are allowed to submit. UID, email,
  // timestamps and status are always created by this module.
  return {
    customerUid: user.uid,
    customerEmail: user.email,
    customer: orderRequest.customer,
    delivery: orderRequest.delivery,
    items: orderRequest.items,
    subtotalCents: orderRequest.subtotalCents,
    deliveryFeeCents: orderRequest.deliveryFeeCents,
    totalCents: orderRequest.totalCents,
    checkoutRoute: orderRequest.checkoutRoute,
    paymentMethod: orderRequest.paymentMethod,
    status: 'new',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
}

export { auth, db };

// Authentication and session helpers -------------------------------------------------

export function getCurrentSession() {
  return sessionFromUser(auth.currentUser);
}

export async function waitForSession() {
  await initialAuthState;
  return getCurrentSession();
}

export function onSessionChange(callback) {
  if (typeof callback !== 'function') {
    throw new TypeError('onSessionChange precisa receber uma funcao.');
  }

  return firebaseOnAuthStateChanged(auth, user => callback(sessionFromUser(user)));
}

// Compatibility helpers for the admin page and any future plain Firebase UI.
export function getCurrentUser() {
  return auth.currentUser;
}

export function onAuthStateChanged(callback) {
  if (typeof callback !== 'function') {
    throw new TypeError('onAuthStateChanged precisa receber uma funcao.');
  }

  return firebaseOnAuthStateChanged(auth, callback);
}

export async function signUpWithEmail(email, password, displayName = '') {
  const credential = await createUserWithEmailAndPassword(
    auth,
    String(email || '').trim(),
    password
  );

  if (String(displayName || '').trim()) {
    await updateProfile(credential.user, { displayName: String(displayName).trim() });
  }

  // Email verification is important for the owner account to receive admin access.
  await firebaseSendEmailVerification(credential.user);
  return sessionFromUser(credential.user);
}

export async function signInWithEmail(email, password) {
  const credential = await signInWithEmailAndPassword(
    auth,
    String(email || '').trim(),
    password
  );

  return sessionFromUser(credential.user);
}

export async function signInWithGoogle() {
  const credential = await signInWithPopup(auth, googleProvider);
  return sessionFromUser(credential.user);
}

export async function sendVerificationEmail() {
  const user = await authenticatedUser();
  await firebaseSendEmailVerification(user);
}

export const sendVerification = sendVerificationEmail;

export async function refreshSession() {
  const user = auth.currentUser;
  if (!user) return null;

  await user.reload();
  await user.getIdToken(true);
  return sessionFromUser(auth.currentUser);
}

export async function signOutUser() {
  await firebaseSignOut(auth);
}

export const signOut = signOutUser;

// Order helpers ----------------------------------------------------------------------

export async function saveOrder(orderRequest) {
  const user = await authenticatedUser();
  const reference = await addDoc(collection(db, 'orders'), orderDataFor(user, orderRequest));
  return { id: reference.id, uid: user.uid, email: user.email };
}

// Kept as an alias so the existing checkout can be upgraded without breaking imports.
export const saveOrderRequest = saveOrder;

export async function getMyOrder(orderId) {
  const user = await authenticatedUser();
  const snapshot = await getDoc(doc(db, 'orders', String(orderId || '')));

  if (!snapshot.exists()) return null;

  const order = orderFromSnapshot(snapshot);
  if (!getCurrentSession()?.isAdmin && order.customerUid !== user.uid) {
    throw adminError();
  }

  return order;
}

export async function getAdminOrders(maximumResults = 100) {
  await adminSession();
  const snapshot = await getDocs(ordersQuery(maximumResults));
  return snapshot.docs.map(orderFromSnapshot);
}

export const listAdminOrders = getAdminOrders;

export async function subscribeToAdminOrders(onOrders, onError, maximumResults = 100) {
  if (typeof onOrders !== 'function') {
    throw new TypeError('subscribeToAdminOrders precisa receber uma funcao.');
  }

  await adminSession();
  return onSnapshot(
    ordersQuery(maximumResults),
    snapshot => onOrders(snapshot.docs.map(orderFromSnapshot)),
    onError
  );
}

export async function updateOrderStatus(orderId, status) {
  await adminSession();

  const statusAliases = {
    novo: 'new',
    confirmado: 'confirmed',
    preparo: 'preparing',
    saiu_entrega: 'out_for_delivery',
    concluido: 'delivered',
    cancelado: 'cancelled',
    completed: 'delivered'
  };
  const normalizedStatus = statusAliases[String(status || '').trim().toLowerCase()] || status;

  if (!ORDER_STATUSES.includes(normalizedStatus)) {
    throw orderError('Status de pedido invalido.');
  }

  await updateDoc(doc(db, 'orders', String(orderId || '')), {
    status: normalizedStatus,
    updatedAt: serverTimestamp()
  });
}
