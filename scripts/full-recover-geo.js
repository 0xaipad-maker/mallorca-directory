// Full restore: overwrite Firestore coordinates with osm-export.json + seed-data.js originals
// Run: node scripts/full-recover-geo.js

const path = require('path');
const fs = require('fs');

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
const app = initializeApp(firebaseConfig, 'full-recover');
const db = getFirestore(app);

function loadOsmData() {
  const p = path.join(__dirname, '..', 'osm-export.json');
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function parseSeedData() {
  const src = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'seed-data.js'), 'utf8');
  const match = src.match(/const\s+seedBusinesses\s*=\s*(\[[\s\S]*?\]);/);
  if (!match) return [];
  const json = match[1]
    .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3')
    .replace(/'/g, '"')
    .replace(/,\s*([}\]])/g, '$1');
  return JSON.parse(json);
}

async function main() {
  const osmData = loadOsmData();
  let seedData = [];
  try { seedData = parseSeedData(); } catch (e) { console.log('Seed parse error:', e.message); }

  const sourceMap = {};
  for (const b of osmData) sourceMap[(b.name||'')+'|'+(b.category||'')] = b.location;
  for (const b of seedData) sourceMap[(b.name||'')+'|'+(b.category||'')] = b.location;

  console.log(`Source entries: ${Object.keys(sourceMap).length}`);

  const snap = await getDocs(collection(db, 'businesses'));
  const businesses = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  console.log(`Firestore businesses: ${businesses.length}`);

  let restored = 0, skipped = 0;
  for (const b of businesses) {
    const key = (b.name||'') + '|' + (b.category||'');
    const srcLoc = sourceMap[key];
    if (!srcLoc) { skipped++; continue; }

    const cur = b.location || {};
    const curKey = ((cur.lat||0)+'').slice(0,6)+','+((cur.lng||0)+'').slice(0,6);
    const srcKey = (srcLoc.lat+'').slice(0,6)+','+(srcLoc.lng+'').slice(0,6);
    if (curKey === srcKey) { skipped++; continue; }

    await updateDoc(doc(db, 'businesses', b.id), {
      location: { lat: Math.round(srcLoc.lat * 1e6) / 1e6, lng: Math.round(srcLoc.lng * 1e6) / 1e6 },
      updatedAt: new Date().toISOString(),
    });
    console.log(`Restored: ${b.name} (${b.category}): ${curKey} → ${srcKey}`);
    restored++;
  }

  console.log(`\nDone. Restored: ${restored}, Skipped (match/nochange): ${skipped}`);
  process.exit(0);
}

main();
