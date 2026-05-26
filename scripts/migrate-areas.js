require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc, serverTimestamp } = require('firebase/firestore');

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

const areaByKeyword = [
  { keywords: ['Palma', 'Son Castelló', 'Can Valero', 'Son Tous', 'Son Parera', 'Cala Major', 'Platja de Palma', "s'Arenal"], area: 'Palma' },
  { keywords: ['Inca'], area: 'Inca' },
  { keywords: ['Alcúdia', "Port d'Alcúdia"], area: 'Alcúdia' },
  { keywords: ['Manacor', 'Porto Cristo'], area: 'Manacor' },
  { keywords: ['Calvià', 'Magaluf', 'Santa Ponça', 'Bendinat', 'Son Bugadelles'], area: 'Calvià' },
  { keywords: ['Santanyí', 'Cala d\'Or', 'Cala Figuera', 'Cala Mondragó', 'Cala Llombards'], area: 'Santanyí' },
  { keywords: ['Pollença', 'Port de Pollença'], area: 'Pollença' },
  { keywords: ['Sóller', 'Port de Sóller'], area: 'Sóller' },
  { keywords: ['Deià'], area: 'Deià' },
  { keywords: ['Valldemossa'], area: 'Valldemossa' },
  { keywords: ['Andratx', 'Port d\'Andratx'], area: 'Andratx' },
  { keywords: ['Bunyola'], area: 'Bunyola' },
  { keywords: ['Marratxí'], area: 'Marratxí' },
  { keywords: ['Alaró'], area: 'Alaró' },
  { keywords: ['Muro'], area: 'Muro' },
  { keywords: ['Campos', 'Es Trenc'], area: 'Campos' },
  { keywords: ['Llucmajor'], area: 'Llucmajor' },
  { keywords: ['Sa Pobla'], area: 'Sa Pobla' },
  { keywords: ['Santa Maria del Camí'], area: 'Santa Maria del Camí' },
  { keywords: ['Binissalem'], area: 'Binissalem' },
  { keywords: ['Felanitx'], area: 'Felanitx' },
  { keywords: ['Capdepera', 'Cala Rajada'], area: 'Capdepera' },
  { keywords: ['Artà'], area: 'Artà' },
  { keywords: ['Consell'], area: 'Consell' },
  { keywords: ['Ses Salines'], area: 'Ses Salines' },
];

function detectArea(business) {
  if (business.area) return business.area;
  const searchText = (business.address || '') + ' ' + (business.name || '');
  for (const rule of areaByKeyword) {
    for (const kw of rule.keywords) {
      if (searchText.includes(kw)) return rule.area;
    }
  }
  return 'Palma';
}

async function migrate() {
  const snapshot = await getDocs(collection(db, 'businesses'));
  let updated = 0;
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const area = detectArea(data);
    if (!data.area || data.area !== area) {
      await updateDoc(doc(db, 'businesses', docSnap.id), { area, updatedAt: serverTimestamp() });
      updated++;
    }
  }
  console.log(`Updated ${updated}/${snapshot.docs.length} businesses with area field.`);
  process.exit(0);
}

migrate();
