// Geocode remaining businesses by name + area via Nominatim (OSM free geocoder)
// 1 req/sec rate limit. Run: node scripts/geocode-nominatim.js

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, updateDoc, doc } = require('firebase/firestore');
const https = require('https');

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};
const app = initializeApp(firebaseConfig, 'nominatim');
const db = getFirestore(app);

const AREA_COORDS = {
  palma: [39.5696, 2.6502], calvia: [39.5650, 2.5060], andratx: [39.5760, 2.4200],
  pollenca: [39.8770, 3.0170], alcudia: [39.8530, 3.1210], soller: [39.7670, 2.7140],
  inca: [39.7210, 2.9100], manacor: [39.5690, 3.2090], santanyi: [39.3540, 3.1280],
  llucmajor: [39.4900, 2.8900], marratxi: [39.6420, 2.7530], capdepera: [39.7030, 3.4350],
  arta: [39.6930, 3.3490], felanitx: [39.4700, 3.1480], campos: [39.4310, 3.0190],
  muro: [39.7350, 3.0580], 'sa-pobla': [39.7690, 3.0230], 'santa-maria': [39.6510, 2.7730],
  binissalem: [39.6860, 2.8360], 'ses-salines': [39.3360, 3.0510], esporles: [39.6680, 2.5790],
  porreres: [39.5160, 3.0220], 'son-servera': [39.6210, 3.3600],
  deia: [39.7480, 2.6490], valldemossa: [39.7100, 2.6220],
  bunyola: [39.6960, 2.6990], araro: [39.7040, 2.7920],
};

const AREA_NAMES = {
  palma: 'Palma', calvia: 'Calvià', andratx: 'Andratx', pollenca: 'Pollença',
  alcudia: 'Alcúdia', soller: 'Sóller', inca: 'Inca', manacor: 'Manacor',
  santanyi: 'Santanyí', llucmajor: 'Llucmajor', marratxi: 'Marratxí',
  capdepera: 'Capdepera', arta: 'Artà', felanitx: 'Felanitx', campos: 'Campos',
  muro: 'Muro', 'sa-pobla': 'Sa Pobla', 'santa-maria': 'Santa Maria del Camí',
  binissalem: 'Binissalem', 'ses-salines': 'Ses Salines', esporles: 'Esporles',
  porreres: 'Porreres', 'son-servera': 'Son Servera',
  deia: 'Deià', valldemossa: 'Valldemossa', bunyola: 'Bunyola', araro: 'Alaró',
};

function nominatimSearch(query) {
  return new Promise(resolve => {
    const url = 'https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(query) + '&limit=1&countrycodes=es';
    https.get(url, { headers: { 'User-Agent': 'MallorcaDirectory/1.0' } }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); } catch { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const snap = await getDocs(collection(db, 'businesses'));

  // Find businesses with collapsed coords: same name|category, same location
  const groups = {};
  for (const d of snap.docs) {
    const b = d.data();
    const key = (b.name || '') + '|' + (b.category || '');
    if (!groups[key]) groups[key] = [];
    groups[key].push({ id: d.id, ...b });
  }

  const fixCandidates = [];
  for (const [key, entries] of Object.entries(groups)) {
    if (entries.length <= 1) continue;
    const locs = entries.map(e => (e.location?.lat || 0).toFixed(4) + ',' + (e.location?.lng || 0).toFixed(4));
    const unique = [...new Set(locs)];
    if (unique.length === 1) fixCandidates.push(...entries);
  }

  console.log(`Businesses with collapsed coords: ${fixCandidates.length}`);

  let fixed = 0, failed = 0;
  for (let i = 0; i < fixCandidates.length; i++) {
    const b = fixCandidates[i];
    const areaName = AREA_NAMES[b.area] || b.area || 'Mallorca';
    const query = `${b.name} ${areaName} Mallorca`;
    const result = await nominatimSearch(query);
    await sleep(1100); // 1 req/sec rate limit

    if (result && result.length > 0) {
      const lat = parseFloat(result[0].lat);
      const lng = parseFloat(result[0].lon);
      if (lat >= 39 && lat <= 40 && lng >= 2 && lng <= 4) {
        await updateDoc(doc(db, 'businesses', b.id), {
          location: { lat: Math.round(lat * 1e6) / 1e6, lng: Math.round(lng * 1e6) / 1e6 },
          updatedAt: new Date().toISOString(),
        });
        console.log(`${i+1}/${fixCandidates.length} FIXED: ${b.name} (${b.area}): ${lat},${lng}`);
        fixed++;
      } else {
        console.log(`${i+1}/${fixCandidates.length} SKIP (outside): ${b.name} -> ${lat},${lng}`);
        failed++;
      }
    } else {
      console.log(`${i+1}/${fixCandidates.length} FAIL: ${b.name} in ${areaName}`);
      failed++;
    }
  }

  console.log(`\nDone. Fixed: ${fixed}, Failed: ${failed}`);
  process.exit(0);
}

main();
