const admin = require('firebase-admin');
const path = require('path');

// Initialize admin SDK if not already initialized
function initAdmin() {
  if (admin.apps && admin.apps.length) return admin;
  // Use GOOGLE_APPLICATION_CREDENTIALS env or expect default Application Credentials
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  } catch (err) {
    // fallback: try to initialize without explicit credentials (may work in some environments)
    admin.initializeApp();
  }
  return admin;
}

/**
 * Handle Stripe events and update Firestore user/couple subscription state.
 * This is intentionally minimal: it expects relevant customer metadata (user uid or email)
 */
async function handleStripeEvent(event) {
  const adminSdk = initAdmin();
  const db = adminSdk.firestore();

  const type = event.type;
  let obj = event.data && event.data.object ? event.data.object : {};

  // Try to locate a user by metadata.customer_uid or customer_email
  const metadata = obj.metadata || {};
  const customerEmail = obj.customer_email || obj.customer?.email || null;
  const customerUid = metadata.userUid || metadata.uid || null;

  // Determine subscription status
  if (type.includes('subscription') || type.includes('invoice') || type === 'checkout.session.completed') {
    // Get subscription object if present
    const subscription = obj.subscription || obj;
    // If it's a checkout.session.completed, subscription id often lives in obj.subscription
    const subscriptionId = subscription && (subscription.id || subscription.subscription) || obj.subscription || null;

    // Derive status (for invoices/subscriptions)
    const status = obj.status || (subscription && subscription.status) || null;

    // Update user document if we can find uid
    try {
      // If we have uid in metadata, use it directly
      if (customerUid) {
        const uRef = db.collection('users').doc(customerUid);
        await uRef.set({
          stripeCustomerId: obj.customer || obj.customer_id || null,
          subscriptionId: subscriptionId,
          subscriptionStatus: status || 'active',
        }, { merge: true });
        return;
      }

      // Otherwise try to find user by email
      if (customerEmail) {
        const q = await db.collection('users').where('email', '==', customerEmail).limit(1).get();
        if (!q.empty) {
          const doc = q.docs[0];
          await doc.ref.set({
            stripeCustomerId: obj.customer || obj.customer_id || null,
            subscriptionId: subscriptionId,
            subscriptionStatus: status || 'active',
          }, { merge: true });
          return;
        }
      }

      console.log('stripe event received but no matching user found (metadata/email)');
    } catch (err) {
      console.error('handleStripeEvent firestore error', err);
    }
  } else {
    console.log('Unhandled stripe event in firebase-admin handler:', type);
  }
}

async function setUserStripeCustomer(userUid, customerId) {
  try {
    const adminSdk = initAdmin();
    const db = adminSdk.firestore();
    await db.collection('users').doc(userUid).set({ stripeCustomerId: customerId }, { merge: true });
  } catch (err) {
    console.error('setUserStripeCustomer error', err);
  }
}

module.exports = { handleStripeEvent, initAdmin, setUserStripeCustomer };

