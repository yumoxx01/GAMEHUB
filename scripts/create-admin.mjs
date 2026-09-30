/**
 * create-admin.mjs
 * Creates an admin account in Firebase Auth and sets role: 'admin' in Firestore.
 */

const PROJECT_ID = 'game-hub-c9caa';
const API_KEY    = 'AIzaSyC1-wdRIA0QsCL86hsAzc_FFwI-dvfz--8';
const BASE_URL   = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

const ADMIN_EMAIL    = 'admin@gamehub.kz';
const ADMIN_PASSWORD = 'Admin123!';
const ADMIN_NAME     = 'Администратор';

async function getOrCreateAuthUser() {
  // Try sign-up
  const signUpRes = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD, returnSecureToken: true }),
    }
  );
  const signUpData = await signUpRes.json();

  if (!signUpData.error) {
    console.log(`✓ Created new Firebase Auth user: ${signUpData.localId}`);
    return signUpData;
  }

  if (signUpData.error.message === 'EMAIL_EXISTS') {
    console.log('⚠ Auth user already exists, signing in...');
    const signInRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD, returnSecureToken: true }),
      }
    );
    const signInData = await signInRes.json();
    if (signInData.error) throw new Error(signInData.error.message);
    console.log(`✓ Signed in as existing user: ${signInData.localId}`);
    return signInData;
  }

  throw new Error(signUpData.error.message);
}

async function setAdminFirestoreDoc(uid, idToken) {
  const url = `${BASE_URL}/users/${uid}?key=${API_KEY}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      fields: {
        displayName: { stringValue: ADMIN_NAME },
        email:       { stringValue: ADMIN_EMAIL },
        role:        { stringValue: 'admin' },
        bio:         { stringValue: 'Администратор Game Hub' },
        photoURL:    { nullValue: null },
        createdAt:   { timestampValue: new Date().toISOString() },
      },
    }),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json.error));
  return json;
}

async function main() {
  console.log('🔧 Setting up admin account...\n');
  const authData = await getOrCreateAuthUser();
  await setAdminFirestoreDoc(authData.localId, authData.idToken);
  console.log('✓ Firestore users document set with role: admin\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Admin credentials:');
  console.log(`  Email:    ${ADMIN_EMAIL}`);
  console.log(`  Password: ${ADMIN_PASSWORD}`);
  console.log(`  UID:      ${authData.localId}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main().catch(err => console.error('Error:', err.message));
