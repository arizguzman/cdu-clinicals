// storage.js — Firebase Firestore-backed key/value store
// Mirrors the window.storage API used by the Claude artifact, so App.jsx
// can stay nearly identical to the prototype version.

import { initializeApp } from 'firebase/app';
import {
  getFirestore, doc, getDoc, setDoc, deleteDoc,
  collection, getDocs, query, orderBy, startAt, endAt,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  // eslint-disable-next-line no-console
  console.error(
    'Missing Firebase env vars. Create a .env file (see .env.example) and fill in all six VITE_FIREBASE_* values from your Firebase project config.'
  );
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const COLLECTION = 'kv_store';

export const storage = {
  async get(key /*, shared */) {
    const snap = await getDoc(doc(db, COLLECTION, key));
    if (!snap.exists()) throw new Error(`Key not found: ${key}`);
    return { key, value: snap.data().value, shared: true };
  },

  async set(key, value /*, shared */) {
    await setDoc(doc(db, COLLECTION, key), {
      value,
      updatedAt: new Date().toISOString(),
    });
    return { key, value, shared: true };
  },

  async delete(key /*, shared */) {
    await deleteDoc(doc(db, COLLECTION, key));
    return { key, deleted: true, shared: true };
  },

  async list(prefix /*, shared */) {
    const col = collection(db, COLLECTION);
    let q;
    if (prefix) {
      // Firestore prefix query trick: orderBy doc id, then startAt/endAt
      q = query(col, orderBy('__name__'), startAt(prefix), endAt(prefix + '\uf8ff'));
    } else {
      q = col;
    }
    const snap = await getDocs(q);
    return { keys: snap.docs.map((d) => d.id), prefix, shared: true };
  },
};
