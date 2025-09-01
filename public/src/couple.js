import { auth, db } from '../firebase-init.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import { doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';

const statusEl = document.getElementById('status');
const partnerA = document.getElementById('partnerA');
const partnerB = document.getElementById('partnerB');
const dateInput = document.getElementById('date');
const about = document.getElementById('about');
const saveBtn = document.getElementById('saveBtn');

let currentUser = null;
onAuthStateChanged(auth, async (user) => {
  if (!user) { statusEl.textContent = 'Please log in first.'; return; }
  currentUser = user;
  statusEl.textContent = `Signed in as ${user.email || user.uid}`;
  await loadData();
});

async function loadData() {
  const uRef = doc(db, 'users', currentUser.uid);
  const uSnap = await getDoc(uRef);
  const coupleId = uSnap.exists() && uSnap.data().coupleId ? uSnap.data().coupleId : currentUser.uid;
  const cRef = doc(db, 'couples', coupleId);
  const cSnap = await getDoc(cRef);
  if (cSnap.exists()) {
    const d = cSnap.data();
    partnerA.value = d.names?.partnerA || '';
    partnerB.value = d.names?.partnerB || '';
    dateInput.value = d.date || '';
    about.value = d.siteData?.about || '';
  }
}

saveBtn.addEventListener('click', async () => {
  const uRef = doc(db, 'users', currentUser.uid);
  const uSnap = await getDoc(uRef);
  const coupleId = uSnap.exists() && uSnap.data().coupleId ? uSnap.data().coupleId : currentUser.uid;
  const cRef = doc(db, 'couples', coupleId);
  await setDoc(cRef, {
    ownerUid: currentUser.uid,
    names: { partnerA: partnerA.value, partnerB: partnerB.value },
    date: dateInput.value,
    siteData: { about: about.value },
    updatedAt: Date.now()
  }, { merge: true });
  alert('Saved');
});
