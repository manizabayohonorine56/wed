const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = process.env.PORT || 4000;

// JSON parser for normal routes. We capture raw body only for the webhook route using bodyParser.raw
app.use(express.json());

// Serve static files from the repo `public` directory (HTML, client JS, CSS)
const PUBLIC_PATH = path.join(__dirname, '..', 'public');
if (fs.existsSync(PUBLIC_PATH)) app.use(express.static(PUBLIC_PATH));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Simple request logger to help debug 404s
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

const DATA_PATH = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_PATH)) fs.mkdirSync(DATA_PATH, { recursive: true });
const RSVP_FILE = path.join(DATA_PATH, 'rsvps.json');
if (!fs.existsSync(RSVP_FILE)) fs.writeFileSync(RSVP_FILE, '[]');

app.post('/api/rsvp', (req, res) => {
  const body = req.body;
  if (!body || !body.name) return res.status(400).json({ error: 'Name is required' });
  try {
    const current = JSON.parse(fs.readFileSync(RSVP_FILE, 'utf8') || '[]');
    const entry = { id: Date.now(), ...body };
    current.push(entry);
    fs.writeFileSync(RSVP_FILE, JSON.stringify(current, null, 2));
    res.json({ ok: true, entry });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save RSVP' });
  }
});

app.get('/api/rsvp', (req, res) => {
  try {
    const current = JSON.parse(fs.readFileSync(RSVP_FILE, 'utf8') || '[]');
    res.json(current);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read RSVPs' });
  }
});

// --- Simple Super Admin API (file-backed) ---------------------------------
const USERS_FILE = path.join(DATA_PATH, 'users.json');
const WEDDINGS_FILE = path.join(DATA_PATH, 'weddings.json');
const SUBS_FILE = path.join(DATA_PATH, 'subscriptions.json');
const TICKETS_FILE = path.join(DATA_PATH, 'tickets.json');
const THEMES_FILE = path.join(DATA_PATH, 'themes.json');
const LOGS_FILE = path.join(DATA_PATH, 'logs.json');

function ensureFile(fpath, initial) {
  if (!fs.existsSync(fpath)) fs.writeFileSync(fpath, JSON.stringify(initial, null, 2));
}

ensureFile(USERS_FILE, [
  { id: 'u1', email: 'couple@example.com', name: 'Couple Account', role: 'couple', status: 'active', createdAt: Date.now() }
]);
ensureFile(WEDDINGS_FILE, [
  { id: 'w1', coupleId: 'u1', title: 'Sample Wedding', theme: 'classic', storageUsedBytes: 1024 * 1024 * 10, events: [] }
]);
ensureFile(SUBS_FILE, [
  { id: 's1', customerId: 'cus_123', planId: 'plan_monthly_1', status: 'active', currentPeriodEnd: Date.now() + 30*24*3600*1000, priceMonthly: 9.99 }
]);
ensureFile(TICKETS_FILE, []);
ensureFile(THEMES_FILE, { default: 'classic', available: ['classic','minimal','floral','luxury'] });
ensureFile(LOGS_FILE, []);

function readJson(filePath) { try { return JSON.parse(fs.readFileSync(filePath, 'utf8') || '[]'); } catch (e) { return null; } }
function writeJson(filePath, data) { fs.writeFileSync(filePath, JSON.stringify(data, null, 2)); }

// Admin overview: aggregates data from the file store
app.get('/api/admin/overview', (req, res) => {
  try {
    const users = readJson(USERS_FILE) || [];
    const weddings = readJson(WEDDINGS_FILE) || [];
    const subs = readJson(SUBS_FILE) || [];
    const rsvps = readJson(RSVP_FILE) || [];
    const storageUsed = weddings.reduce((s, w) => s + (w.storageUsedBytes || 0), 0);
    const rsvpStats = rsvps.reduce((acc, r) => { acc[r.status || 'pending'] = (acc[r.status || 'pending'] || 0) + 1; return acc; }, {});
    res.json({
      totals: { weddings: weddings.length, users: users.length, activeSubscriptions: subs.filter(s=>s.status==='active').length },
      rsvp: rsvpStats,
      storage: { usedBytes: storageUsed },
      subscriptions: subs.slice(0,10)
    });
  } catch (err) { console.error(err); res.status(500).json({ error: 'overview error' }); }
});

// Users listing + simple actions
app.get('/api/admin/users', (req, res) => {
  const users = readJson(USERS_FILE) || [];
  res.json(users);
});

app.post('/api/admin/users/:id/suspend', (req, res) => {
  try {
    const id = req.params.id;
    const users = readJson(USERS_FILE) || [];
    const u = users.find(x => x.id === id);
    if (!u) return res.status(404).json({ error: 'user not found' });
    u.status = u.status === 'suspended' ? 'active' : 'suspended';
    writeJson(USERS_FILE, users);
    writeJson(LOGS_FILE, (readJson(LOGS_FILE)||[]).concat({ actor: 'system', action: 'suspend_toggle', target: id, ts: Date.now() }));
    res.json({ ok: true, user: u });
  } catch (err) { console.error(err); res.status(500).json({ error: 'suspend failed' }); }
});

app.post('/api/admin/users/:id/impersonate', (req, res) => {
  const id = req.params.id;
  // For local testing, return a short-lived fake token
  const token = `impersonate-${id}-${Date.now()}`;
  writeJson(LOGS_FILE, (readJson(LOGS_FILE)||[]).concat({ actor: 'system', action: 'impersonate', target: id, ts: Date.now() }));
  res.json({ ok: true, token, note: 'This is a dev-only impersonation token. Implement secure impersonation in production.' });
});

// Weddings
app.get('/api/admin/weddings', (req, res) => {
  res.json(readJson(WEDDINGS_FILE) || []);
});

app.get('/api/admin/tickets', (req, res) => {
  res.json(readJson(TICKETS_FILE) || []);
});

app.post('/api/admin/weddings/:id/assets/:assetId/delete', (req, res) => {
  try {
    const id = req.params.id; const assetId = req.params.assetId;
    const weddings = readJson(WEDDINGS_FILE) || [];
    const w = weddings.find(x => x.id === id);
    if (!w) return res.status(404).json({ error: 'wedding not found' });
    w.assets = (w.assets || []).filter(a => a.id !== assetId);
    writeJson(WEDDINGS_FILE, weddings);
    writeJson(LOGS_FILE, (readJson(LOGS_FILE)||[]).concat({ actor: 'admin', action: 'delete_asset', target: `${id}/${assetId}`, ts: Date.now() }));
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'delete asset failed' }); }
});

// Subscriptions
app.get('/api/admin/subscriptions', (req, res) => {
  res.json(readJson(SUBS_FILE) || []);
});

// Simple export endpoint - returns CSV text for small datasets
app.post('/api/admin/exports', (req, res) => {
  try {
    const { resource } = req.body || {};
    if (resource === 'users') {
      const users = readJson(USERS_FILE) || [];
      const csv = ['id,email,name,role,status,createdAt', ...users.map(u => `${u.id},${u.email},${u.name},${u.role},${u.status},${u.createdAt}`)].join('\n');
      res.json({ ok: true, csv });
      return;
    }
    res.status(400).json({ error: 'unknown resource' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'export failed' }); }
});


// Protected RSVP endpoint: validates invite code against Firestore and stores RSVP there.
app.post('/api/rsvp-protected', async (req, res) => {
  try {
    const body = req.body;
    if (!body || !body.email || !body.inviteCode) return res.status(400).json({ error: 'email and inviteCode required' });
    // initialize firebase admin
    let adminSdk;
    try { adminSdk = require('./firebase-admin.js'); } catch (err) { return res.status(500).json({ error: 'firebase admin helper missing' }); }
    const admin = require('firebase-admin');
    try { admin.initializeApp(); } catch (e) { /* already initialized */ }
    const db = admin.firestore();

    // Search across couples for a matching invitation code and email
    const couplesRef = db.collection('couples');
    const couples = await couplesRef.get();
    let matched = null;
    for (const c of couples.docs) {
      const invites = await c.ref.collection('invitations').where('code', '==', body.inviteCode).where('email', '==', body.email).limit(1).get();
      if (!invites.empty) { matched = { coupleId: c.id, coupleRef: c.ref }; break; }
    }
    if (!matched) return res.status(403).json({ error: 'Invalid invite code or email' });

    const rsvpRef = await matched.coupleRef.collection('rsvps').add({
      email: body.email,
      guestName: body.guestName || null,
      attending: !!body.attending,
      mealChoice: body.mealChoice || null,
      note: body.note || null,
      inviteCode: body.inviteCode,
      createdAt: Date.now()
    });

    res.json({ ok: true, id: rsvpRef.id });
  } catch (err) {
    console.error('rsvp-protected error', err);
    res.status(500).json({ error: 'rsvp server error' });
  }
});

// Mount stripe routes
try {
  const stripeRouter = require('./stripe.js');
  app.use('/stripe', stripeRouter);
} catch (err) {
  console.warn('Stripe routes not mounted (missing STRIPE_SECRET_KEY?)', err && err.message);
}

app.listen(port, () => console.log(`RSVP API listening on http://localhost:${port}`));

// 404 handler (should be last)
app.use((req, res) => {
  console.warn('404 for path:', req.method, req.url);
  res.status(404).send('Not Found');
});
