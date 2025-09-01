# Server README

Run the simple Express server that handles RSVPs and Stripe webhooks.

Prereqs
- Node.js installed
- `npm install` (run in repo root)
- Set environment variables (see `.env.example`)
- For webhook signature verification set `STRIPE_WEBHOOK_SECRET` (from Stripe dashboard)
- For Firebase Admin operations set `GOOGLE_APPLICATION_CREDENTIALS` to the service account JSON path

Start server (development)

PowerShell example:

    npm install
    $env:STRIPE_SECRET_KEY = 'sk_test_...'
    $env:STRIPE_WEBHOOK_SECRET = 'whsec_...'
    $env:GOOGLE_APPLICATION_CREDENTIALS = 'C:\path\to\service-account.json'
    node server/index.js

Notes
- The server mounts `/stripe/create-checkout-session` and `/stripe/webhook`.
- Webhook route expects raw request body for signature verification; use Stripe CLI in dev to forward events.
