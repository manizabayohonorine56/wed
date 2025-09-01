// Simple dark mode manager: toggles .dark on documentElement and persists choice
const KEY = 'wed:darkMode';

function _setupDark() {
  const saved = localStorage.getItem(KEY);
  if (saved === '1') document.documentElement.classList.add('dark');

  const buttons = Array.from(document.querySelectorAll('[data-dark-toggle]'));
  if (!buttons.length) return;

  const updatePressed = (isDark) => {
    buttons.forEach(b => b.setAttribute('aria-pressed', isDark ? 'true' : 'false'));
  };

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const isDark = document.documentElement.classList.toggle('dark');
      localStorage.setItem(KEY, isDark ? '1' : '0');
      updatePressed(isDark);
    });
  });

  // initialize pressed state for all toggles
  updatePressed(document.documentElement.classList.contains('dark'));
}

export function initDarkMode() {
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', _setupDark, { once: true });
  } else {
    _setupDark();
  }
}

export function isDark() { return document.documentElement.classList.contains('dark'); }
