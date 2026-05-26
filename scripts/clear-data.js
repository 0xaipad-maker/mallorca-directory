require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function clearData() {
  const snapshot = await getDocs(collection(db, 'businesses'));
  console.log(`Deleting ${snapshot.size} businesses...`);
  let count = 0;
  for (const doc of snapshot.docs) {
    await deleteDoc(doc.ref);
    count++;
    if (count % 20 === 0) console.log(`  ${count}/${snapshot.size} deleted`);
  }
  console.log(`✅ Cleared ${count} businesses`);
  process.exit(0);
}

clearData().catch(console.error);
