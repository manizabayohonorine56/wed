import { auth, db } from '../firebase-init.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import { doc, getDoc, collection, addDoc, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';

const statusEl = document.getElementById('status');
const guestInput = document.getElementById('guestEmail');
const createBtn = document.getElementById('createInvite');
const listEl = document.getElementById('list');

let currentUser = null;
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    statusEl.textContent = 'Please log in first.';
    return;
  }
  currentUser = user;
  statusEl.textContent = `Signed in as ${user.email || user.uid}`;
  await loadInvites();
});

async function loadInvites() {
  listEl.innerHTML = 'Loading...';
  try {
    // attempt to resolve coupleId from user doc
    const uRef = doc(db, 'users', currentUser.uid);
    const uSnap = await getDoc(uRef);
    const coupleId = uSnap.exists() && uSnap.data().coupleId ? uSnap.data().coupleId : currentUser.uid;
    const q = query(collection(db, `couples/${coupleId}/invitations`));
    const snaps = await getDocs(q);
    listEl.innerHTML = '';
    snaps.forEach(s => {
      const data = s.data();
      const div = document.createElement('div');
      div.textContent = `${data.email} — code: ${data.code} — created: ${new Date(data.created).toLocaleString()}`;
      listEl.appendChild(div);
    });
    if (snaps.empty) listEl.textContent = 'No invites yet.';
  } catch (err) {
    console.error(err);
    listEl.textContent = 'Error loading invites.';
  }
}

createBtn.addEventListener('click', async () => {
  const email = guestInput.value.trim();
  if (!email) return alert('Enter an email');
  try {
    const uRef = doc(db, 'users', currentUser.uid);
    const uSnap = await getDoc(uRef);
    const coupleId = uSnap.exists() && uSnap.data().coupleId ? uSnap.data().coupleId : currentUser.uid;
    const code = Math.random().toString(36).slice(2, 9).toUpperCase();
    await addDoc(collection(db, `couples/${coupleId}/invitations`), {
      email, code, created: Date.now()
    });
    guestInput.value = '';
    await loadInvites();
  } catch (err) {
    console.error(err);
    alert('Error creating invite');
  }
});
