// Normalize area field for ALL businesses in Firestore
// Maps city names → lowercase area IDs, fills missing areas by coordinates
// Run: node scripts/normalize-areas.js

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
const app = initializeApp(firebaseConfig, 'norm-areas');
const db = getFirestore(app);

const AREA_IDS = [
  'palma','calvia','andratx','pollenca','alcudia','soller','deia','valldemossa',
  'inca','manacor','santanyi','llucmajor','marratxi','bunyola','araro',
  'capdepera','arta','felanitx','campos','muro','sa-pobla','santa-maria',
  'binissalem','ses-salines','esporles','porreres','son-servera',
];

const AREA_COORDS = {
  palma: [39.5696,2.6502], calvia: [39.5650,2.5060], andratx: [39.5760,2.4200],
  pollenca: [39.8770,3.0170], alcudia: [39.8530,3.1210], soller: [39.7670,2.7140],
  deia: [39.7480,2.6490], valldemossa: [39.7100,2.6220], inca: [39.7210,2.9100],
  manacor: [39.5690,3.2090], santanyi: [39.3540,3.1280], llucmajor: [39.4900,2.8900],
  marratxi: [39.6420,2.7530], bunyola: [39.6960,2.6990], araro: [39.7040,2.7920],
  capdepera: [39.7030,3.4350], arta: [39.6930,3.3490], felanitx: [39.4700,3.1480],
  campos: [39.4310,3.0190], muro: [39.7350,3.0580], 'sa-pobla': [39.7690,3.0230],
  'santa-maria': [39.6510,2.7730], binissalem: [39.6860,2.8360],
  'ses-salines': [39.3360,3.0510], esporles: [39.6680,2.5790],
  porreres: [39.5160,3.0220], 'son-servera': [39.6210,3.3600],
};

// Map of all known city name variants → lowercase area ID
const NAME_MAP = {
  // Palma
  'palma': 'palma', 'palma de mallorca': 'palma', 'palma de majorca': 'palma',
  'palmanova': 'calvia', 'cala major': 'palma', 'cala estància': 'palma',
  'can pastilla': 'palma', 'coll d\'en rabassa': 'palma', 'plaça de palma': 'palma',
  'es pil·larí': 'palma', 'son sardina': 'palma',
  // Calvià
  'calvià': 'calvia', 'calvia': 'calvia',
  'santa ponça': 'calvia', 'santa ponsa': 'calvia',
  'peguera': 'calvia', 'pagüera': 'calvia',
  'palmanova': 'calvia', 'son caliu': 'calvia',
  'cala viñas': 'calvia', 'cala vinyes': 'calvia',
  'el toro': 'calvia', 'portals nous': 'calvia',
  'bendinat': 'calvia', 'cas català': 'calvia',
  'son ferrer': 'calvia',
  // Andratx
  'andratx': 'andratx', 'andratch': 'andratx',
  'port d\'andratx': 'andratx', 'puerto de andratx': 'andratx',
  'sant elm': 'andratx', 'sant elmo': 'andratx',
  's\'arracó': 'andratx', 'camp de mar': 'andratx',
  // Pollença
  'pollença': 'pollenca', 'pollenca': 'pollenca', 'pollensa': 'pollenca',
  'cala sant vicenç': 'pollenca', 'cala san vicente': 'pollenca',
  'puerto pollensa': 'pollenca', 'port de pollença': 'pollenca',
  // Alcúdia
  'alcúdia': 'alcudia', 'alcudia': 'alcudia',
  'can picafort': 'alcudia', 'platja de muro': 'muro',
  'cala rajada': 'capdepera',
  'puerto de alcúdia': 'alcudia', 'port d\'alcúdia': 'alcudia',
  'playa de muro': 'muro', 'platja dels pins': 'alcudia',
  'cala barques': 'alcudia',
  // Sóller
  'sóller': 'soller', 'soller': 'soller',
  'port de sóller': 'soller', 'puerto de sóller': 'soller',
  'fornalutx': 'soller',
  // Deià
  'deià': 'deia', 'deia': 'deia',
  // Valldemossa
  'valldemossa': 'valldemossa',
  // Inca
  'inca': 'inca',
  // Manacor
  'manacor': 'manacor',
  'cala millor': 'son-servera', 'cala bona': 'son-servera',
  'cala anguila': 'manacor', 'cala magraner': 'manacor',
  's\'illot': 'manacor', 'porto cristo': 'manacor', 'port de cristo': 'manacor',
  'son macià': 'manacor',
  // Santanyí
  'santanyí': 'santanyi', 'santanyi': 'santanyi', 'santany': 'santanyi',
  'cala figuera': 'santanyi', 'cala llombards': 'santanyi',
  'cala d\'or': 'santanyi', 'cala gran': 'santanyi',
  'cala sa nau': 'santanyi', 'portopetro': 'santanyi',
  'cala santañí': 'santanyi',
  'colònia de sant jordi': 'ses-salines', 'colonia de sant jordi': 'ses-salines',
  'es trenc': 'campos', 'ses salines': 'ses-salines',
  // Llucmajor
  'llucmajor': 'llucmajor', 'lucmajor': 'llucmajor',
  's\'arenal': 'llucmajor', 's\'arenals': 'llucmajor',
  'el arenal': 'llucmajor', 'arenal de llucmajor': 'llucmajor',
  'platja de palma': 'llucmajor', 'santa maria': 'santa-maria',
  // Marratxí
  'marratxí': 'marratxi', 'marratxi': 'marratxi',
  'es pla de na toma': 'marratxi',
  'ponte d\'inca': 'marratxi', 'pont d\'inca': 'marratxi',
  'son oliva': 'marratxi', 'sa cabana': 'marratxi',
  'son amengual': 'marratxi',
  // Bunyola
  'bunyola': 'bunyola',
  // Alaró
  'alaró': 'araro', 'alaro': 'araro',
  // Capdepera
  'capdepera': 'capdepera',
  'cala rajada': 'capdepera', 'cala ratjada': 'capdepera',
  'cala mesquida': 'capdepera', 'cala agulla': 'capdepera',
  'font de sa cala': 'capdepera',
  // Artà
  'artà': 'arta', 'arta': 'arta',
  'colònia d\'artà': 'arta', 'colonia d\'arta': 'arta',
  'bétera': 'arta',
  // Felanitx
  'felanitx': 'felanitx', 'felanich': 'felanitx',
  'portocolom': 'felanitx', 'cala felip': 'felanitx',
  'cala martina': 'felanitx',
  // Campos
  'campos': 'campos',
  // Muro
  'muro': 'muro', 'playa de muro': 'muro', 'platja de muro': 'muro',
  // Sa Pobla
  'sa pobla': 'sa-pobla', 'sa pobla': 'sa-pobla',
  // Santa Maria del Camí
  'santa maria del camí': 'santa-maria', 'santa maria del cami': 'santa-maria',
  'santa maría del camí': 'santa-maria',
  // Binissalem
  'binissalem': 'binissalem',
  // Ses Salines
  'ses salines': 'ses-salines', 'ses salines': 'ses-salines',
  // Esporles
  'esporles': 'esporles',
  // Porreres
  'porreres': 'porreres',
  // Son Servera
  'son servera': 'son-servera', 'son severa': 'son-servera',
  'cala millor': 'son-servera', 'cala bona': 'son-servera',
  'costa dels pins': 'son-servera',
};

function normalizeArea(raw) {
  if (!raw) return null;
  const key = raw.toLowerCase().trim();
  if (NAME_MAP[key]) return NAME_MAP[key];
  // Try partial match
  for (const [variant, id] of Object.entries(NAME_MAP)) {
    if (key.includes(variant) || variant.includes(key)) return id;
  }
  return null;
}

function nearestAreaId(lat, lng) {
  let best = null, minD = Infinity;
  for (const [id, coords] of Object.entries(AREA_COORDS)) {
    const d = Math.hypot(coords[0]-lat, coords[1]-lng);
    if (d < minD) { minD = d; best = id; }
  }
  return best;
}

async function main() {
  const snap = await getDocs(collection(db, 'businesses'));
  const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  console.log(`Total: ${all.length}`);

  let fixed = 0;
  for (const b of all) {
    const rawArea = (b.area || '').trim();
    const currentId = normalizeArea(rawArea);
    const loc = b.location || {};

    let newArea;

    if (rawArea && currentId && currentId !== normalizeArea(b.area)) {
      // Normalize: e.g., "Alcúdia" → "alcudia"
      newArea = currentId;
    } else if (!rawArea && loc.lat && loc.lng) {
      // Missing area: determine from coordinates
      newArea = nearestAreaId(loc.lat, loc.lng);
    }

    if (newArea && newArea !== (b.area || '').toLowerCase()) {
      await updateDoc(doc(db, 'businesses', b.id), { area: newArea });
      console.log(`${b.name || '?'}: "${b.area || ''}" → "${newArea}"`);
      fixed++;
    }
  }

  console.log(`\nFixed: ${fixed}`);
  process.exit(0);
}

main();
