// Smart restore v2: match by address for duplicate names, skip ambiguous
// Run: node scripts/smart-recover-geo.js

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
const app = initializeApp(firebaseConfig, 'smart-recover');
const db = getFirestore(app);

function loadOsmData() {
  return JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'osm-export.json'), 'utf8'));
}

function parseSeedData() {
  const src = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'seed-data.js'), 'utf8');
  const match = src.match(/const\s+seedBusinesses\s*=\s*(\[[\s\S]*?\]);/);
  if (!match) return [];
  return JSON.parse(match[1]
    .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3')
    .replace(/'/g, '"')
    .replace(/,\s*([}\]])/g, '$1'));
}

async function main() {
  const sources = [...loadOsmData()];
  try { sources.push(...parseSeedData()); } catch (e) { console.log('Seed parse err:', e.message); }

  // Build map: key (name|category) → [{location, address}]  (preserve order from sources)
  const sourceMulti = {};
  for (const b of sources) {
    const key = (b.name||'') + '|' + (b.category||'');
    if (!sourceMulti[key]) sourceMulti[key] = [];
    sourceMulti[key].push({
      location: b.location,
      address: ((b.address||'')).toLowerCase().trim(),
    });
  }

  const snap = await getDocs(collection(db, 'businesses'));
  const businesses = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  console.log(`Firestore: ${businesses.length}, Unique keys in source: ${Object.keys(sourceMulti).length}`);

  // Count duplicates in source
  let multiKeys = 0;
  for (const [k, v] of Object.entries(sourceMulti)) {
    if (v.length > 1) multiKeys++;
  }
  console.log(`Keys with duplicates in source: ${multiKeys}`);

  // For tracking which candidates are assigned (for round-robin fallback)
  const assigned = {};

  let restored = 0, skipped = 0, ambiguous = 0;

  for (const b of businesses) {
    const key = (b.name||'') + '|' + (b.category||'');
    const candidates = sourceMulti[key];
    if (!candidates || candidates.length === 0) { skipped++; continue; }

    const curLoc = b.location || {};
    const curAddr = ((b.address||'')).toLowerCase().trim();
    const curKey = ((curLoc.lat||0)+'').slice(0,6)+','+((curLoc.lng||0)+'').slice(0,6);

    let best;

    if (candidates.length === 1) {
      best = candidates[0];
    } else {
      // Multiple candidates — match by meaningful address first
      const addrMatch = candidates.filter(c =>
        c.address && c.address !== 'mallorca' && c.address === curAddr
      );
      if (addrMatch.length === 1) {
        best = addrMatch[0];
      } else if (addrMatch.length > 1) {
        // Multiple same-address candidates (unlikely) — pick closest coord
        let minD = Infinity;
        for (const c of addrMatch) {
          const d = Math.hypot((c.location.lat||0)-(curLoc.lat||0), (c.location.lng||0)-(curLoc.lng||0));
          if (d < minD) { minD = d; best = c; }
        }
      } else {
        // No address match — try round-robin: assign next unused candidate
        if (!assigned[key]) assigned[key] = 0;
        const idx = assigned[key] % candidates.length;
        best = candidates[idx];
        assigned[key]++;
        ambiguous++;
      }
    }

    if (!best) { skipped++; continue; }

    const srcKey = ((best.location.lat||0)+'').slice(0,6)+','+((best.location.lng||0)+'').slice(0,6);
    if (curKey === srcKey) { skipped++; continue; }

    await updateDoc(doc(db, 'businesses', b.id), {
      location: { lat: Math.round(best.location.lat * 1e6) / 1e6, lng: Math.round(best.location.lng * 1e6) / 1e6 },
      updatedAt: new Date().toISOString(),
    });
    console.log(`Restored: ${b.name} (${b.category}): ${curKey} → ${srcKey}`);
    restored++;
  }

  console.log(`\nDone. Restored: ${restored}, Skipped (same/match): ${skipped}, Ambiguous (round-robin): ${ambiguous}`);
  process.exit(0);
}

main();
