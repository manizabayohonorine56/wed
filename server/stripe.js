const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const bodyParser = require('body-parser');

// Lazy init to avoid throwing when env not set during dev
function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY not set');
  return Stripe(process.env.STRIPE_SECRET_KEY);
}

// Create a Checkout Session for subscriptions
router.post('/create-checkout-session', async (req, res) => {
  try {
    const stripe = getStripe();
    const { priceId, customerEmail, metadata } = req.body;
    if (!priceId) return res.status(400).json({ error: 'priceId required' });

    // If metadata contains a userUid, attempt to create or reuse a Stripe Customer and record it
    let customerId = null;
    try {
      const userUid = metadata && metadata.userUid;
      if (userUid) {
        // Try to find existing user record via firebase-admin
        try {
          const { initAdmin, setUserStripeCustomer } = require('./firebase-admin.js');
          const admin = initAdmin();
          const db = admin.firestore();
          const u = await db.collection('users').doc(userUid).get();
          const existing = u.exists && u.data().stripeCustomerId ? u.data().stripeCustomerId : null;
          if (existing) customerId = existing;
          else {
            // create a new Stripe customer
            const c = await stripe.customers.create({ email: customerEmail || undefined, metadata: { userUid } });
            customerId = c.id;
            await setUserStripeCustomer(userUid, customerId);
          }
        } catch (err) {
          console.warn('firebase-admin unavailable or failed to lookup/create customer mapping', err && err.message);
        }
      }
    } catch (err) {
      console.error('customer creation lookup error', err);
    }

    // Log paymentMethod if provided in metadata for auditing in dev
    try {
      if (metadata && metadata.paymentMethod) {
        console.log('Checkout requested with paymentMethod=', metadata.paymentMethod);
      }
    } catch (e) { /* ignore */ }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer: customerId || undefined,
      customer_email: customerEmail,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: (process.env.SUCCESS_URL || 'http://localhost:3000') + '?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: (process.env.CANCEL_URL || 'http://localhost:3000') ,
      metadata: metadata || {}
    });
    res.json({ url: session.url, id: session.id });
  } catch (err) {
    console.error('create-checkout-session error', err);
    res.status(500).json({ error: err.message || 'stripe error' });
  }
});

// Webhook endpoint needs the raw body. Use bodyParser.raw for this route only.
router.post('/webhook', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const stripe = getStripe();
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;
    if (webhookSecret) {
      // req.body is a Buffer when using bodyParser.raw
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      // If no secret provided (dev), parse JSON body
      event = JSON.parse(req.body.toString('utf8'));
    }

    // Handle subscription lifecycle events
    switch (event.type) {
      case 'checkout.session.completed':
      case 'invoice.payment_succeeded':
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        // Forward event to server-side Firebase update helper
        try {
          const { handleStripeEvent } = require('./firebase-admin.js');
          await handleStripeEvent(event);
        } catch (err) {
          console.error('handleStripeEvent error', err);
        }
        break;
      default:
        console.log('Unhandled stripe event', event.type);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('stripe webhook error', err);
    res.status(400).send(`Webhook error: ${err.message}`);
  }
});

module.exports = router;
