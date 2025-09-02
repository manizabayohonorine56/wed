// Mobile menu
const mobileToggle = document.getElementById('mobileToggle');
const mobileMenu = document.getElementById('mobileMenu');
if (mobileToggle) mobileToggle.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));

// RSVP
const rsvpForm = document.getElementById('rsvpForm');
const rsvpMsg = document.getElementById('rsvpMsg');
if (rsvpForm) rsvpForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(rsvpForm).entries());
  try {
    const res = await fetch('http://localhost:4000/api/rsvp', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('network');
    const json = await res.json();
    console.log('RSVP saved', json);
    if (rsvpMsg) {
      rsvpMsg.textContent = 'Thanks — we received your RSVP.';
      rsvpMsg.classList.remove('hidden');
    }
    rsvpForm.reset();
  } catch (err) {
    console.error(err);
    if (rsvpMsg) {
      rsvpMsg.textContent = 'Unable to send RSVP. Please email hello@example.com';
      rsvpMsg.classList.remove('hidden');
    }
  }
});

// Reveal on scroll (simple)
const revealElems = document.querySelectorAll('[data-reveal]');
const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('reveal-visible');
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });
revealElems.forEach(el => io.observe(el));

// subtle hover micro-interactions for gallery
document.querySelectorAll('.gallery-img').forEach(img => {
  img.addEventListener('mouseenter', () => img.classList.add('scale-105', 'shadow-soft'));
  img.addEventListener('mouseleave', () => img.classList.remove('scale-105', 'shadow-soft'));
});

// --- Admin floating panel (dev-only) -------------------------------------
const adminToggle = document.getElementById('adminToggle');
const adminPanel = document.getElementById('adminPanel');
const adminClose = document.getElementById('adminClose');
const adminSave = document.getElementById('adminSave');
const adminClear = document.getElementById('adminClear');
const adminToken = document.getElementById('adminToken');
const adminUsers = document.getElementById('adminUsers');

function showAdminPanel() { if (adminPanel) adminPanel.classList.remove('hidden'); }
function hideAdminPanel() { if (adminPanel) adminPanel.classList.add('hidden'); }

if (adminToggle) adminToggle.addEventListener('click', () => { showAdminPanel(); const t = localStorage.getItem('dev:adminToken'); if (adminToken) adminToken.value = t || ''; loadAdminUsers(); });
if (adminClose) adminClose.addEventListener('click', hideAdminPanel);
if (adminClear) adminClear.addEventListener('click', () => { localStorage.removeItem('dev:adminToken'); if (adminToken) adminToken.value = ''; adminUsers.textContent = 'Cleared'; });
if (adminSave) adminSave.addEventListener('click', () => { if (!adminToken) return; localStorage.setItem('dev:adminToken', adminToken.value); loadAdminUsers(); });

async function loadAdminUsers() {
  try {
    const token = localStorage.getItem('dev:adminToken');
    const headers = token ? { 'x-admin-token': token } : {};
    const res = await fetch('http://127.0.0.1:4000/api/admin/users', { headers });
    if (!res.ok) throw new Error('failed');
    const users = await res.json();
    if (adminUsers) {
      adminUsers.innerHTML = users.map(u => {
        const status = u.status || 'active';
        return `
          <div class="py-2 border-b flex items-center justify-between gap-3">
            <div>
              <div class="font-medium">${escapeHtml(u.name || u.email || '—')}</div>
              <div class="text-xs text-slate-500">${u.email || ''} • ${u.role || 'guest'} • <span class="status-${status}">${status}</span></div>
            </div>
            <div class="flex items-center gap-2">
              <button data-action="impersonate" data-id="${u.id}" class="px-2 py-1 text-xs bg-slate-100 rounded">Impersonate</button>
              <button data-action="suspend" data-id="${u.id}" class="px-2 py-1 text-xs bg-rose-500 text-white rounded">${status === 'suspended' ? 'Unsuspend' : 'Suspend'}</button>
            </div>
          </div>`;
      }).join('');
    }
  } catch (err) {
    console.error('loadAdminUsers', err);
    if (adminUsers) adminUsers.textContent = 'Unable to load users (make sure API server is running)';
  }
}

// Simple HTML escaper for safety in innerHTML
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Handle admin actions via event delegation
if (adminUsers) {
  adminUsers.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const action = btn.getAttribute('data-action');
    const id = btn.getAttribute('data-id');
    const token = localStorage.getItem('dev:adminToken');
    const headers = token ? { 'x-admin-token': token, 'content-type': 'application/json' } : { 'content-type': 'application/json' };

    try {
      if (action === 'suspend') {
        btn.disabled = true;
        const res = await fetch(`http://127.0.0.1:4000/api/admin/users/${encodeURIComponent(id)}/suspend`, { method: 'POST', headers });
        if (!res.ok) throw new Error('suspend failed');
        const body = await res.json();
        btn.textContent = body.status === 'suspended' ? 'Unsuspend' : 'Suspend';
        await loadAdminUsers();
      }

      if (action === 'impersonate') {
        btn.disabled = true;
        const res = await fetch(`http://127.0.0.1:4000/api/admin/users/${encodeURIComponent(id)}/impersonate`, { method: 'POST', headers });
        if (!res.ok) throw new Error('impersonate failed');
        const data = await res.json();
        // store dev impersonation token for quick testing
        if (data && data.token) localStorage.setItem('dev:impersonationToken', data.token);
        alert('Impersonation token saved to localStorage (dev). Use key: dev:impersonationToken');
        btn.disabled = false;
      }
    } catch (err) {
      console.error('admin action error', err);
      alert('Action failed — see console for details');
      btn.disabled = false;
    }
  });
}

// Billing toggle behavior (dark billing section)
function setBillingMode(mode) {
  document.querySelectorAll('#billing .price').forEach(el => {
    const m = el.getAttribute('data-monthly');
    const a = el.getAttribute('data-annual');
    let txt = '';
    if (mode === 'annual') txt = a === '0' ? 'Free' : `$${a}`;
    else txt = m === '0' ? 'Free' : `$${m}`;
    el.textContent = txt;
  });
  document.querySelectorAll('#billing .period').forEach(el => el.textContent = mode === 'annual' ? 'year' : 'month');
}

const bm = document.getElementById('billingMonthly');
const ba = document.getElementById('billingAnnual');
if (bm && ba) {
  bm.addEventListener('click', () => { setBillingMode('monthly'); bm.classList.add('bg-slate-700'); ba.classList.remove('bg-slate-700'); });
  ba.addEventListener('click', () => { setBillingMode('annual'); ba.classList.add('bg-slate-700'); bm.classList.remove('bg-slate-700'); });
  // initialize
  setBillingMode('monthly');
  bm.classList.add('bg-slate-700');
}

