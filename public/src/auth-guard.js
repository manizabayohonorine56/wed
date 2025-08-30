// Lightweight auth guard for role-protected pages
import { auth, db } from '../firebase-init.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';

export function requireRole(expectedRoles, fallback = '/') {
  // expectedRoles: string or array of strings
  const allowed = Array.isArray(expectedRoles) ? expectedRoles : [expectedRoles];
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      // not signed in
      window.location.href = '/login.html';
      return;
    }
    try {
      const uid = user.uid;
      const snapshot = await getDoc(doc(db, 'users', uid));
      const role = snapshot.exists() ? snapshot.data().role : 'guest';
      if (!allowed.includes(role)) {
        window.location.href = fallback;
      }
      // else allow page to render
    } catch (err) {
      console.error('auth-guard error', err);
      window.location.href = fallback;
    }
  });
}

export async function getUserRole(uid) {
  if (!uid) return null;
  const snapshot = await getDoc(doc(db, 'users', uid));
  return snapshot.exists() ? snapshot.data().role : null;
}
