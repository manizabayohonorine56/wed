// styles handled via CDN Tailwind + styles.css

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
