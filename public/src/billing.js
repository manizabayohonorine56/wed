import { auth, db } from '../firebase-init.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';

const statusEl = document.getElementById('status');
const actions = document.getElementById('actions');
const checkoutBtn = document.getElementById('checkoutBtn');
const priceInput = document.getElementById('priceId');

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    statusEl.textContent = 'Please log in first.';
    actions.style.display = 'none';
    return;
  }
  statusEl.textContent = `Signed in as ${user.email || user.uid}`;
});

checkoutBtn.addEventListener('click', async () => {
  const priceId = priceInput.value.trim();
  if (!priceId) return alert('Enter a Stripe price ID');

  const user = auth.currentUser;
  // create checkout session with user metadata so webhook can map back
  const body = { priceId, customerEmail: user?.email || null, metadata: { userUid: user?.uid } };
  const res = await fetch('/stripe/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const json = await res.json();
  if (json.error) return alert('Error: ' + json.error);
  // redirect to Stripe hosted checkout
  window.location = json.url;
});
