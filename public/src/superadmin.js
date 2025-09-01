// Super Admin dashboard client (talks to /api/admin/* endpoints)
// Use the local API server where Express listens by default (port 4000)
const API_BASE = (location.protocol + '//' + location.hostname + ':4000');

const refreshBtn = document.getElementById('refreshBtn');
const exportBtn = document.getElementById('exportBtn');
const cardWeddings = document.getElementById('cardWeddings');
const cardGuests = document.getElementById('cardGuests');
const cardSubs = document.getElementById('cardSubs');
const cardCountries = document.getElementById('cardCountries');
const ticketsListEl = document.getElementById('ticketsList');
const upcomingList = document.getElementById('upcomingList');
const storageWidget = document.getElementById('storageWidget');
const rsvpCanvas = document.getElementById('rsvpChartCanvas');
const revenueCanvas = document.getElementById('revenueChartCanvas');
const audienceCanvas = document.getElementById('audienceCanvas');

let rsvpChartObj = null, revenueChartObj = null, audienceChartObj = null;

// DOM safety: if core elements are missing, avoid throwing; this allows the script
// to be loaded from other pages without breaking.
if (!totalUsersEl && !totalWeddings && !usersTbody) {
  console.warn('superadmin: core DOM elements not found; aborting init');
}

async function fetchJson(path, opts) {
  const res = await fetch(API_BASE + path, opts);
  if (!res.ok) throw new Error('Network error');
  return res.json();
}

async function loadOverview() {
  try {
  const data = await fetchJson('/api/admin/overview');
  if (cardWeddings) cardWeddings.textContent = data.totals.weddings;
  if (cardGuests) cardGuests.textContent = (data.totals.guests || '—');
  if (cardSubs) cardSubs.textContent = data.totals.activeSubscriptions;
  if (cardCountries) cardCountries.textContent = (data.totals.topCountries ? data.totals.topCountries.join(', ') : '—');
  if (storageWidget) storageWidget.textContent = ((data.storage.usedBytes||0)/1024/1024).toFixed(2) + ' MB';
    // rsvp simple render
    if (rsvpChart) rsvpChart.textContent = '';
    const entries = Object.entries(data.rsvp || {});
    if (rsvpChart) {
      if (entries.length === 0) rsvpChart.textContent = 'No RSVPs';
      else {
        const ul = document.createElement('ul'); ul.className = 'space-y-2';
        entries.forEach(([k,v]) => { const li = document.createElement('li'); li.textContent = `${k}: ${v}`; ul.appendChild(li); });
        rsvpChart.appendChild(ul);
      }
    }
  // recent signups -> use weddings/users endpoints
  const users = await fetchJson('/api/admin/users');
  if (upcomingList) upcomingList.innerHTML = (users.slice(0,5).map(u=>`<li>${u.name||u.email}</li>`)).join('') || '<li class="text-slate-500">No recent users</li>';
  // tickets
  const tickets = await fetchJson('/api/admin/tickets').catch(()=>[]);
  if (ticketsListEl) ticketsListEl.innerHTML = (tickets.slice(0,8).map(t=>`<li>${t.subject||'Ticket'} — ${t.status||'open'}</li>`)).join('') || '<li class="text-slate-500">No tickets</li>';

  // charts: RSVP/Revenue/Audience
  const rsvpData = buildRsvpTimeseries(data.rsvp || {});
  if (rsvpCanvas) renderRsvpChart(rsvpCanvas, rsvpData);
  if (revenueCanvas) renderRevenueChart(revenueCanvas, data.revenue || {});
  if (audienceCanvas) renderAudienceChart(audienceCanvas, data.audience || {});
  } catch (err) {
    console.error('loadOverview error', err);
  }
}

async function loadUsers() {
  try {
  // For this dashboard scaffold we don't render a full table; users endpoint is used for data only
  const users = await fetchJson('/api/admin/users');
  // update simple upcoming list
  if (upcomingList) upcomingList.innerHTML = users.slice(0,6).map(u=>`<li>${u.name||u.email}</li>`).join('');
  return users;

  } catch (err) { console.error('loadUsers error', err); }
}

function escapeHtml(s){ return String(s).replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

refreshBtn && refreshBtn.addEventListener('click', () => { loadOverview(); loadUsers(); });
exportBtn && exportBtn.addEventListener('click', async () => {
  try {
    const res = await fetch(API_BASE + '/api/admin/exports', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ resource: 'users' }) });
    const data = await res.json();
    if (data.csv) {
      const blob = new Blob([data.csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'users.csv'; a.click(); URL.revokeObjectURL(url);
    }
  } catch (err) { console.error(err); alert('Export failed'); }
});

// charts renderers
function buildRsvpTimeseries(rsvpObj) {
  // rsvpObj may be counts by status; mock a timeseries for demo
  const labels = Array.from({length:30}, (_,i)=>`${i+1}`);
  return { labels, yes: labels.map(()=>Math.floor(Math.random()*20)+5), no: labels.map(()=>Math.floor(Math.random()*5)), pending: labels.map(()=>Math.floor(Math.random()*6)) };
}

function renderRsvpChart(canvas, series) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (rsvpChartObj) rsvpChartObj.destroy();
  rsvpChartObj = new Chart(ctx, {
    type: 'line', data: { labels: series.labels, datasets: [
      { label: 'Yes', data: series.yes, borderColor: 'rgba(124,58,237,0.9)', backgroundColor: 'rgba(124,58,237,0.12)', tension: .3 },
      { label: 'No', data: series.no, borderColor: 'rgba(100,116,139,0.9)', backgroundColor: 'rgba(100,116,139,0.06)', tension: .3 },
      { label: 'Pending', data: series.pending, borderColor: 'rgba(6,182,212,0.9)', backgroundColor: 'rgba(6,182,212,0.06)', tension: .3 }
    ] }, options: { responsive:true, plugins:{ legend:{ labels:{ color: 'rgba(230,238,248,0.9)' } } }, scales:{ x:{ ticks:{ color: '#9fb3d6' } }, y:{ ticks:{ color:'#9fb3d6' } } } }
  });
}

function renderRevenueChart(canvas, revenue) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (revenueChartObj) revenueChartObj.destroy();
  const labels = Array.from({length:12}, (_,i)=>`M${i+1}`);
  const data = labels.map(()=>Math.floor(Math.random()*2000)+500);
  revenueChartObj = new Chart(ctx, { type:'bar', data:{ labels, datasets:[{ label: 'Monthly', data, backgroundColor: 'rgba(124,58,237,0.8)' }] }, options:{ responsive:true, plugins:{ legend:{ display:false } }, scales:{ x:{ ticks:{ color:'#9fb3d6' } }, y:{ ticks:{ color:'#9fb3d6' } } } } });
}

function renderAudienceChart(canvas, audience) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (audienceChartObj) audienceChartObj.destroy();
  const data = [Math.floor(Math.random()*70)+30, Math.floor(Math.random()*20)+5];
  audienceChartObj = new Chart(ctx, { type:'doughnut', data:{ labels:['Guests','Couples'], datasets:[{ data, backgroundColor:['rgba(6,182,212,0.9)','rgba(124,58,237,0.9)'] }] }, options:{ responsive:true, plugins:{ legend:{ labels:{ color:'#9fb3d6' } } } } });
}

// initial load
loadOverview(); loadUsers();

// expose for console
window.__admin = { loadOverview, loadUsers };
