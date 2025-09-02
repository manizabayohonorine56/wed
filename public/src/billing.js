// Billing page client
import { isConfigValid, auth } from '../firebase-init.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(location.search);
  const plan = params.get('plan') || 'starter';
  const statusEl = document.getElementById('status');
  const actions = document.getElementById('actions');
  const signedInEl = document.getElementById('signedIn');

  if (!statusEl || !actions) return;

  function loginUrlFor(plan) {
    const returnUrl = '/pay.html?plan=' + encodeURIComponent(plan);
    return '/login.html?returnUrl=' + encodeURIComponent(returnUrl);
  }

  function showLoginPrompt() {
    statusEl.textContent = 'Please sign in to continue.';
    const url = loginUrlFor(plan);
    actions.innerHTML = `<div class="flex flex-col gap-3"><a href="${url}" class="w-full inline-block text-center py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition">Log in to continue</a><div class="text-sm text-slate-400">You will be returned to the payment page after signing in.</div></div>`;
    if (signedInEl) signedInEl.textContent = 'Not signed in';
  }

  async function proceedToCheckout(email, uid) {
    statusEl.textContent = 'Preparing checkout...';
    actions.innerHTML = `
      <div class="space-y-3">
        <div class="text-sm text-slate-300">Select payment method</div>
        <div class="flex gap-3">
          <label class="flex items-center gap-2 bg-slate-700 p-2 rounded cursor-pointer"><input type="radio" name="pm" value="card" checked /> Card</label>
          <label class="flex items-center gap-2 bg-slate-700 p-2 rounded cursor-pointer"><input type="radio" name="pm" value="paypal" /> PayPal</label>
        </div>
        <div class="mt-2">
          <button id="checkoutBtn" class="w-full py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 transition">Proceed to Checkout</button>
        </div>
      </div>`;
    if (signedInEl) signedInEl.textContent = email || uid || 'Signed in';

    const btn = document.getElementById('checkoutBtn');
    if (!btn) return;
    btn.addEventListener('click', async () => {
      btn.disabled = true; btn.textContent = 'Opening checkout...';
      // price mapping (update with real price IDs in env or server-side mapping)
      const priceMap = { starter: 'price_demo_starter', premium: 'price_demo_premium', personal: 'price_demo_personal' };
      const priceId = priceMap[plan] || priceMap.starter;

      // try server-side creation
      const pm = document.querySelector('input[name="pm"]:checked')?.value || 'card';
      try {
        const res = await fetch('/stripe/create-checkout-session', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ priceId, customerEmail: email || undefined, metadata: { userUid: uid, plan, paymentMethod: pm } })
        });
        if (res.ok) {
          const json = await res.json();
          if (json && json.url) { window.location.href = json.url; return; }
        }
      } catch (err) { console.warn('server checkout error', err && err.message); }

      // fallback
      window.location.href = '/pay.html?plan=' + encodeURIComponent(plan);
    });
  }

  // Use Firebase auth if configured
  if (isConfigValid()) {
    onAuthStateChanged(auth, (user) => {
      if (!user) { showLoginPrompt(); }
      else { proceedToCheckout(user.email, user.uid); }
    });
  } else {
    // fallback to mock localStorage flag
    const mock = localStorage.getItem('mock_user_email');
    if (!mock) showLoginPrompt(); else proceedToCheckout(mock, 'mock');
  }
});
