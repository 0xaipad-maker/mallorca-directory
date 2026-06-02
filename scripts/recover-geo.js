// Restore original coordinates from osm-export.json and seed-data.js
// Run: node scripts/recover-geo.js

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

const app = initializeApp(firebaseConfig, 'recover');
const db = getFirestore(app);

function loadSeedData() {
  // Parse seed-data.js manually
  const src = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'seed-data.js'), 'utf8');
  const match = src.match(/const\s+seedBusinesses\s*=\s*(\[[\s\S]*?\]);/);
  if (!match) return [];
  try {
    return JSON.parse(match[1].replace(/(\w+):/g, '"$1":').replace(/'/g, '"').replace(/,\s*([}\]])/g, '$1'));
  } catch { return []; }
}

function loadOsmData() {
  const p = path.join(__dirname, '..', 'osm-export.json');
  if (!fs.existsSync(p)) return [];
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function isInMallorca(lat, lng) {
  return lat >= 39.2 && lat <= 40.0 && lng >= 2.2 && lng <= 3.5;
}

async function main() {
  const osmData = loadOsmData();
  const seedData = [];
  try { seedData.push(...loadSeedData()); } catch (e) { console.log('Seed parse error:', e.message); }

  // Build lookup by name+category key
  const sourceMap = {};
  for (const b of osmData) {
    sourceMap[(b.name || '') + '|' + (b.category || '')] = b.location;
  }
  for (const b of seedData) {
    sourceMap[(b.name || '') + '|' + (b.category || '')] = b.location;
  }

  const snap = await getDocs(collection(db, 'businesses'));
  const businesses = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  console.log(`Total in Firestore: ${businesses.length}`);

  let restored = 0;
  for (const b of businesses) {
    const key = (b.name || '') + '|' + (b.category || '');
    const srcLoc = sourceMap[key];
    if (!srcLoc) continue;

    const currentKey = (b.location?.lat || '').toString().slice(0, 6) + ',' + (b.location?.lng || '').toString().slice(0, 6);
    const srcKey = srcLoc.lat.toString().slice(0, 6) + ',' + srcLoc.lng.toString().slice(0, 6);
    if (currentKey === srcKey) continue;

    // Only restore if current is outside Mallorca (the geocode-fix sent many outside)
    // OR if source is within Mallorca and current is not from osm/seed
    if (!isInMallorca(b.location?.lat || 0, b.location?.lng || 0) || !sourceMap[key]) {
      await updateDoc(doc(db, 'businesses', b.id), {
        location: { lat: Math.round(srcLoc.lat * 1e6) / 1e6, lng: Math.round(srcLoc.lng * 1e6) / 1e6 },
        updatedAt: new Date().toISOString(),
      });
      console.log(`Restored ${b.name} → ${srcLoc.lat},${srcLoc.lng} (was ${b.location?.lat},${b.location?.lng})`);
      restored++;
    }
  }

  console.log(`\nRestored ${restored} businesses`);
  process.exit(0);
}

main();
