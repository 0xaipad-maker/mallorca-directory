const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore');

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

// Пример данных — заменить на парсинг CSV с https://intranet.caib.es/opendatacataleg/dataset/farmacia
const pharmacies = [
  { name: 'Farmacia Martínez', address: 'Carrer del Sol, 5, Palma', phone: '+34 971 123 456', category: 'pharmacies', location: { lat: 39.5696, lng: 2.6502 } },
  { name: 'Farmacia Central', address: 'Avinguda de l\'Argentina, 10, Palma', phone: '+34 971 654 321', category: 'pharmacies', location: { lat: 39.5715, lng: 2.6479 } },
  { name: 'Farmacia Llevant', address: 'Carrer dels Socors, 22, Palma', phone: '+34 971 789 012', category: 'pharmacies', location: { lat: 39.5678, lng: 2.6550 } },
];

async function importPharmacies() {
  const batch = pharmacies.map((p) =>
    addDoc(collection(db, 'businesses'), { ...p, verified: false, rating: 0, source: 'open_data_caib', createdAt: serverTimestamp() })
  );
  await Promise.all(batch);
  console.log(`Imported ${pharmacies.length} pharmacies`);
  process.exit(0);
}

importPharmacies().catch(console.error);
