/**
 * firebase-config.js
 * Game Hub — Firebase initialisation module
 *
 * USAGE: import { db, auth, storage } from './firebase-config.js';
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * HOW TO ADD YOUR REAL PROJECT KEYS
 * 1. Go to https://console.firebase.google.com → your project → Project Settings
 * 2. Under "Your apps", click the web app icon (</>)
 * 3. Copy the firebaseConfig object Firebase shows you
 * 4. Paste it below, replacing the placeholder values between the markers
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── Firebase SDK (CDN ESM bundle, no build step required) ───────────────────
import { initializeApp }       from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore }        from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { getAuth }             from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getStorage }          from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js';

// ─── ⬇⬇⬇  PASTE YOUR REAL CONFIG HERE  ⬇⬇⬇ ──────────────────────────────────
const firebaseConfig = {
  apiKey:            'AIzaSyC1-wdRIA0QsCL86hsAzc_FFwI-dvfz--8',
  authDomain:        'game-hub-c9caa.firebaseapp.com',
  projectId:         'game-hub-c9caa',
  storageBucket:     'game-hub-c9caa.firebasestorage.app',
  messagingSenderId: '992991757147',
  appId:             '1:992991757147:web:7333e70e1d58a83525507e',
  measurementId:     'G-VGSP03447Q'
};
// ─── ⬆⬆⬆  END OF CONFIG SECTION  ⬆⬆⬆ ──────────────────────────────────────

// ─── Initialise Firebase ──────────────────────────────────────────────────────
const app = initializeApp(firebaseConfig);

/** Firestore database instance */
export const db      = getFirestore(app);

/** Firebase Authentication instance */
export const auth    = getAuth(app);

/** Firebase Storage instance */
export const storage = getStorage(app);

export default app;
