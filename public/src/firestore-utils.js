// Firestore helper utilities
import { db } from '../firebase-init.js';
import {
  collection,
  addDoc,
  doc,
  setDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';

/**
 * Create or update a user profile document in /users.
 * If uid is provided, writes to /users/{uid} (replace). Otherwise it creates a new doc.
 * Returns the document id (uid or generated id).
 */
export async function createUserProfile(data, dbOverride) {
  const { uid, name, email, phone, attending, guests, role } = data || {};
  // prefer an explicit db passed in, otherwise fall back to imported db
  const firestore = dbOverride || db;
  if (!firestore) {
    throw new Error('Firestore instance is not available. Pass a Firestore instance as the second argument.');
  }
  try {
    const payload = {
      name: name || null,
      email: email || null,
      phone: phone || null,
      attending: attending || null,
      guests: typeof guests === 'number' ? guests : null,
      role: role || 'guest',
      createdAt: serverTimestamp()
    };

    if (uid) {
      await setDoc(doc(firestore, 'users', uid), payload);
      return uid;
    } else {
      const ref = await addDoc(collection(firestore, 'users'), payload);
      return ref.id;
    }
  } catch (err) {
    console.error('createUserProfile error', err);
    throw err;
  }
}
