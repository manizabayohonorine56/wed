import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-analytics.js";
import { firebaseConfig } from './firebase-config.js';

// Initialize app and clients
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let analytics = null;
try {
  analytics = getAnalytics(app);
} catch (err) {
  analytics = null;
}

export { app, auth, db, analytics };

// Helper: shallow check that config was set
export function isConfigValid() {
  return firebaseConfig && firebaseConfig.apiKey && !firebaseConfig.apiKey.includes('REPLACE_ME');
}
