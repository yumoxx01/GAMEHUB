/**
 * auth.js
 * Game Hub — Authentication & User Profile Management
 *
 * Handles:
 * - Email/password registration, login, and sign-out
 * - Google Sign-In with automatic profile creation
 * - Password reset email flow
 * - Firestore users/{uid} document syncing & updates (displayName, bio)
 * - Shared auth state observer
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  Timestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

import { auth, db } from './firebase-config.js';
import { COLLECTIONS, usersConverter } from './firestore-schema.js';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Register a new user with email, password, and display name.
 * Creates Firebase Auth account and initialises Firestore users/{uid} doc with role: 'user'.
 *
 * @param {string} email
 * @param {string} password
 * @param {string} displayName
 * @returns {Promise<{user: import('firebase/auth').User, profile: Object}>}
 */
export async function registerWithEmail(email, password, displayName) {
  const trimmedName = displayName?.trim() || 'Пользователь';
  const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  const user = userCredential.user;

  // Update Auth display name
  try {
    await updateProfile(user, { displayName: trimmedName });
  } catch (err) {
    console.warn('[auth] Could not update Auth profile displayName:', err);
  }

  // Create Firestore document with role forced to 'user'
  const userRef = doc(db, COLLECTIONS.USERS, user.uid).withConverter(usersConverter);
  const profileData = {
    displayName: trimmedName,
    email: user.email,
    role: 'user',
    createdAt: Timestamp.now(),
    photoURL: null,
    bio: '',
  };

  await setDoc(userRef, profileData);

  return { user, profile: { uid: user.uid, ...profileData } };
}

/**
 * Sign in an existing user with email and password.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<import('firebase/auth').UserCredential>}
 */
export async function loginWithEmail(email, password) {
  return await signInWithEmailAndPassword(auth, email.trim(), password);
}

/**
 * Sign in or sign up with Google.
 * If user doc doesn't exist yet, creates it automatically with Google profile info and role: 'user'.
 *
 * @returns {Promise<{user: import('firebase/auth').User, profile: Object}>}
 */
export async function loginWithGoogle() {
  const userCredential = await signInWithPopup(auth, googleProvider);
  const user = userCredential.user;

  const userRef = doc(db, COLLECTIONS.USERS, user.uid).withConverter(usersConverter);
  const snap = await getDoc(userRef);

  let profile;
  if (!snap.exists()) {
    // New user via Google: create document
    profile = {
      displayName: user.displayName || user.email?.split('@')[0] || 'Пользователь',
      email: user.email || '',
      role: 'user',
      createdAt: Timestamp.now(),
      photoURL: user.photoURL || null,
      bio: '',
    };
    await setDoc(userRef, profile);
  } else {
    profile = snap.data();
  }

  return { user, profile };
}

/**
 * Sign out the currently authenticated user.
 * @returns {Promise<void>}
 */
export async function logout() {
  return await signOut(auth);
}

/**
 * Send password reset email.
 * @param {string} email
 * @returns {Promise<void>}
 */
export async function sendResetEmail(email) {
  return await sendPasswordResetEmail(auth, email.trim());
}

/**
 * Fetch a user's Firestore profile by UID.
 * @param {string} uid
 * @returns {Promise<Object|null>}
 */
export async function getUserProfile(uid) {
  if (!uid) return null;
  const userRef = doc(db, COLLECTIONS.USERS, uid).withConverter(usersConverter);
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    return snap.data();
  }
  return null;
}

/**
 * Update editable profile fields (displayName, bio) in Firestore.
 * Role and email are strictly protected.
 *
 * @param {string} uid
 * @param {{displayName?: string, bio?: string}} data
 * @returns {Promise<void>}
 */
export async function updateUserProfile(uid, { displayName, bio }) {
  if (!uid) throw new Error('User UID is required');

  const updates = {};
  if (typeof displayName === 'string') {
    updates.displayName = displayName.trim();
  }
  if (typeof bio === 'string') {
    updates.bio = bio.trim();
  }

  if (Object.keys(updates).length === 0) return;

  const userRef = doc(db, COLLECTIONS.USERS, uid);
  await updateDoc(userRef, updates);

  // Sync displayName to Firebase Auth if updated
  if (auth.currentUser && updates.displayName) {
    try {
      await updateProfile(auth.currentUser, { displayName: updates.displayName });
    } catch (err) {
      console.warn('[auth] Could not sync displayName to Auth:', err);
    }
  }
}

/**
 * Subscribe to authentication state changes with attached Firestore profile data.
 *
 * @param {function({user: import('firebase/auth').User|null, profile: Object|null}): void} callback
 * @returns {import('firebase/auth').Unsubscribe}
 */
export function subscribeToAuth(callback) {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      callback({ user: null, profile: null });
      return;
    }

    try {
      let profile = await getUserProfile(user.uid);
      // Fallback if doc is still being created or failed
      if (!profile) {
        profile = {
          uid: user.uid,
          displayName: user.displayName || user.email?.split('@')[0] || 'Пользователь',
          email: user.email || '',
          role: 'user',
          photoURL: user.photoURL || null,
          bio: '',
        };
      }
      callback({ user, profile });
    } catch (err) {
      console.error('[auth] Error fetching user profile:', err);
      callback({
        user,
        profile: {
          uid: user.uid,
          displayName: user.displayName || 'Пользователь',
          email: user.email || '',
          role: 'user',
          photoURL: user.photoURL || null,
          bio: '',
        },
      });
    }
  });
}
