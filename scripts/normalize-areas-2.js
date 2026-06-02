// Normalize remaining area values (Alcúdia → alcudia, Palma de Mallorca → palma, etc.)
// Run: node scripts/normalize-areas-2.js

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
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
const app = initializeApp(firebaseConfig, 'norm2');
const db = getFirestore(app);

const AREA_IDS = [
  'palma','calvia','andratx','pollenca','alcudia','soller','deia','valldemossa',
  'inca','manacor','santanyi','llucmajor','marratxi','bunyola','araro',
  'capdepera','arta','felanitx','campos','muro','sa-pobla','santa-maria',
  'binissalem','ses-salines','esporles','porreres','son-servera',
  'selva','escorca','ariany','consell',
];

// Manual mapping of known bad area values → correct ID
const MANUAL_MAP = {
  'alcúdia': 'alcudia', 'alcudia': 'alcudia',
  'palma': 'palma', 'palma de mallorca': 'palma',
  'calvià': 'calvia',
  'sóller': 'soller',
  'marratxí': 'marratxi',
  'pollença': 'pollenca', 'pollenca': 'pollenca',
  'deià': 'deia',
  'alaró': 'araro', 'alaro': 'araro',
  'artà': 'arta', 'arta': 'arta',
  'felanitx': 'felanitx', 'felanich': 'felanitx',
  'santanyí': 'santanyi', 'santanyi': 'santanyi', 'santanyí, mallorca': 'santanyi',
  'llucmajor': 'llucmajor', 'lucmajor': 'llucmajor',
  'capdepera': 'capdepera',
  'binissalem': 'binissalem',
  'porreres': 'porreres',
  'valldemossa': 'valldemossa',
  'bunyola': 'bunyola',
  'esporles': 'esporles',
  'campos': 'campos',
  'muro': 'muro',
  'sa pobla': 'sa-pobla',
  'santa maria del camí': 'santa-maria',
  'ses salines': 'ses-salines',
  'son-servera': 'son-servera', 'son servera': 'son-servera', 'son severa': 'son-servera',
  // Place names that should be mapped to parent municipality
  'can pastilla': 'palma', 'cala major': 'palma', 'coll d\'en rabassa': 'palma',
  'cala gamba': 'palma', 'cala nova': 'palma',
  'palmanova': 'calvia', 'santa ponça': 'calvia', 'santa ponsa': 'calvia',
  'peguera': 'calvia', 'paguera': 'calvia', 'pagüera': 'calvia',
  'son caliu': 'calvia', 'cala viñas': 'calvia', 'cala vinyes': 'calvia',
  'el toro': 'calvia', 'portals nous': 'calvia',
  'bendinat': 'calvia', 'cas català': 'calvia',
  'son ferrer': 'calvia', 'torrenova': 'calvia',
  'son bugadelles': 'calvia',
  'cala d\'or': 'santanyi', 'cala d‘or': 'santanyi', "cala d'or": 'santanyi',
  'cala bona': 'son-servera', 'cala millor': 'son-servera',
  'cala ratjada': 'capdepera', 'cala rajada': 'capdepera',
  'canyamel': 'capdepera',
  'cala agulla': 'capdepera', 'cala mesquida': 'capdepera',
  'cala figuera': 'santanyi', 'cala llombards': 'santanyi',
  'cala mondragó': 'santanyi',
  'cala anguila': 'manacor', 'cala magraner': 'manacor',
  'cala morlanda': 'manacor', 'cala domingos': 'manacor',
  'cala romana': 'manacor', 'cala murada': 'manacor',
  'cala varques': 'manacor',
  'cale falcó': 'calvia',
  'port d\'andratx': 'andratx',
  'port d\'alcúdia': 'alcudia', 'puerto de alcudia': 'alcudia',
  'porto cristo': 'manacor', 'port de cristo': 'manacor', 'portocristo': 'manacor',
  'portocolom': 'felanitx',
  'colònia de sant jordi': 'ses-salines', 'colonia de sant jordi': 'ses-salines',
  'porto pollenca': 'pollenca', 'puerto pollensa': 'pollenca',
  'cala sant vicenç': 'pollenca',
  'port de sóller': 'soller',
  'fornalutx': 'soller',
  'can picafort': 'alcudia',
  'playa de palma': 'llucmajor', 'platja de palma': 'llucmajor',
  's\'arenal': 'llucmajor', 'el arenal': 'llucmajor',
  'son oliva': 'palma',
  'caimari': 'inca',
  'son macià': 'manacor',
  'costa dels pins': 'son-servera',
  'ponte d\'inca': 'marratxi', 'pont d\'inca': 'marratxi',
  'pla de na toma': 'marratxi',
  'coll den rabassa': 'palma', 'coll d\'en rabassa': 'palma',
  'can pastilla': 'palma',
  'cala bona': 'son-servera',
  'cala millor': 'son-servera',
  'es pil·larí': 'palma',
  'cala estància': 'palma',
  'cala blava': 'palma',
  'cala pi': 'palma',
};

async function main() {
  const snap = await getDocs(collection(db, 'businesses'));
  const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  console.log(`Total: ${all.length}`);

  // Group by unique area values
  const groups = {};
  for (const b of all) {
    const a = b.area || '';
    if (!groups[a]) groups[a] = [];
    groups[a].push(b.id);
  }

  let fixed = 0;
  for (const [raw, ids] of Object.entries(groups)) {
    if (!raw) continue;
    // Check if already a valid lowercase ID
    if (AREA_IDS.includes(raw)) continue;

    // Try manual mapping first
    const lookup = raw.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const mapped = MANUAL_MAP[lookup] || MANUAL_MAP[raw.toLowerCase().trim()];

    if (mapped && mapped !== raw) {
      console.log(`"${raw}" (${ids.length} entries) → "${mapped}"`);
      for (const id of ids) {
        await updateDoc(doc(db, 'businesses', id), { area: mapped });
      }
      fixed += ids.length;
    } else if (!mapped) {
      console.log(`Unmapped: "${raw}" (${ids.length} entries) — e.g. ${all.find(b => b.area === raw)?.name}`);
    }
  }

  console.log(`\nFixed: ${fixed}`);

  // Show remaining
  const remaining = {};
  for (const b of all) {
    const a = b.area || 'Other';
    remaining[a] = (remaining[a]||0) + 1;
  }
  console.log('\nRemaining areas:');
  Object.entries(remaining).sort().forEach(([a,c]) => console.log(`  ${a}: ${c}`));

  process.exit(0);
}

main();
