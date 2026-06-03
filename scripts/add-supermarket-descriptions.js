require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, updateDoc, doc } = require('firebase/firestore');

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

const descTemplate = {
  en: 'Well-stocked supermarket with fresh produce and daily essentials.',
  es: 'Supermercado bien surtido con productos frescos y esenciales diarios.',
  de: 'Gut sortierter Supermarkt mit frischen Produkten und täglichen Bedarfsartikeln.',
  ru: 'Хорошо снабжённый супермаркет со свежими продуктами и товарами первой необходимости.',
};

async function main() {
  const snap = await getDocs(collection(db, 'businesses'));
  let updated = 0;
  for (const docSnap of snap.docs) {
    const d = docSnap.data();
    if (d.category === 'supermarkets' && !d.description) {
      await updateDoc(doc(db, 'businesses', docSnap.id), { description: descTemplate });
      updated++;
    }
  }
  console.log(`Added descriptions to ${updated} supermarkets`);
  process.exit(0);
}

main();
