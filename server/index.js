const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
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

app.listen(port, () => console.log(`RSVP API listening on http://localhost:${port}`));
