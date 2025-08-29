Wedding landing page (Tailwind / shadcn-like style)

What I created
- `index.html` — a complete static landing page with hero, about/our story, schedule, gallery, RSVP form, travel, FAQ, and footer.
- `styles.css` — small custom CSS to polish inputs and shadows.

How to view (Vite)
1. Install dependencies:

	npm install

2. Start the dev server:

	npm run dev

3. Open the local URL shown by Vite (usually http://localhost:5173).

Notes: Tailwind now runs via PostCSS + Tailwind in the Vite pipeline. The `index.html` references `/src/main.js` which imports `src/main.css`.

Notes & assumptions
- You asked for a design using "chad cn"; I interpreted that as a shadcn/chadcn-inspired Tailwind aesthetic and implemented a clean Tailwind page with similar visual language.
- The RSVP form is client-side only (no backend). I wired a small handler that logs data and shows a success message.

Next steps I can help with
- Convert this into a React + shadcn UI project (Next.js/Vite) and wire an API for RSVP storage.
- Replace placeholder images with your photos and update copy.
- Add printable directions, calendar invites, or RSVP email notifications.

If you want any of the next steps, tell me which and I'll implement it.
