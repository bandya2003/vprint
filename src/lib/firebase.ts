
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Temporary log to help verify .env.local setup
if (typeof window === 'undefined') { // Run only on the server-side
  console.log('Attempting to load Firebase Project ID from env:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    console.warn('Firebase Project ID is not loaded. Make sure your .env.local file is set up correctly and you have restarted your Next.js development server.');
  }
}
// You can remove this log (and the warning) once you've confirmed .env.local is working.

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);

export { app, db, storage };
