require('dotenv').config();
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc, doc } = require('firebase/firestore');

const cfg = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(cfg, 'remove-extra');
const db = getFirestore(app);

(async () => {
  const snap = await getDocs(collection(db, 'businesses'));
  let deleted = 0;
  let kept = 0;

  for (const d of snap.docs) {
    const data = d.data();
    if ((data.name || '').toLowerCase().startsWith('mercadona') && data.name !== 'Mercadona') {
      await deleteDoc(doc(db, 'businesses', d.id));
      console.log('DELETED:', data.name + ' — ' + data.address);
      deleted++;
    } else {
      kept++;
    }
  }

  console.log(`\nDone. Deleted: ${deleted}, Kept: ${kept}`);
  process.exit(0);
})();
