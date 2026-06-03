// Fix coordinates by matching on address, not just name+category
// This is needed because full-recover-geo.js collapsed duplicate names to single coords
// Run: node scripts/fix-geo-address-match.js

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
const app = initializeApp(firebaseConfig, 'fix-geo-addr');
const db = getFirestore(app);

function loadOsmData() {
  return JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'osm-export.json'), 'utf8'));
}

function normalize(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function isInMallorca(lat, lng) {
  return lat >= 38.8 && lat <= 40.2 && lng >= 1.0 && lng <= 4.5;
}

async function main() {
  const osmData = loadOsmData();

  // Build address-based lookup: key = normalized(name|category) -> array of {normalized address, location}
  const osmLookup = {};
  for (const b of osmData) {
    const key = normalize((b.name||'') + '|' + (b.category||''));
    if (!osmLookup[key]) osmLookup[key] = [];
    osmLookup[key].push({
      normalizedAddr: normalize(b.address||''),
      location: b.location,
    });
  }

  console.log(`OSM entries: ${osmData.length}, Unique keys: ${Object.keys(osmLookup).length}`);

  const snap = await getDocs(collection(db, 'businesses'));
  const businesses = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  console.log(`Firestore businesses: ${businesses.length}`);

  let fixed = 0, skippedNoMatch = 0, skippedSame = 0, skippedUnique = 0;

  for (const b of businesses) {
    const key = normalize((b.name||'') + '|' + (b.category||''));
    const candidates = osmLookup[key];
    if (!candidates || candidates.length <= 1) {
      skippedUnique++;
      continue;
    }

    // Multiple candidates - need to match by address
    const fbAddr = normalize(b.address||'');
    if (!fbAddr) { skippedNoMatch++; continue; }

    // Try exact address match first
    let best = candidates.find(c => c.normalizedAddr === fbAddr);

    if (!best) {
      // Try partial match: find candidate whose address is contained in fbAddr or vice versa
      let bestScore = 0;
      for (const c of candidates) {
        if (!c.normalizedAddr) continue;
        const longer = fbAddr.length >= c.normalizedAddr.length ? fbAddr : c.normalizedAddr;
        const shorter = fbAddr.length >= c.normalizedAddr.length ? c.normalizedAddr : fbAddr;
        if (longer.includes(shorter) && shorter.length > 5) {
          const score = shorter.length / longer.length;
          if (score > bestScore) { bestScore = score; best = c; }
        }
      }
    }

    if (!best) {
      // Try matching on first few characters of address
      const addrPrefix = fbAddr.substring(0, 15);
      for (const c of candidates) {
        if (c.normalizedAddr && c.normalizedAddr.startsWith(addrPrefix)) {
          best = c;
          break;
        }
      }
    }

    if (!best) { skippedNoMatch++; continue; }

    const curLoc = b.location || {};
    const curKey = (curLoc.lat||0).toFixed(4) + ',' + (curLoc.lng||0).toFixed(4);
    const srcKey = (best.location.lat||0).toFixed(4) + ',' + (best.location.lng||0).toFixed(4);

    if (curKey === srcKey) { skippedSame++; continue; }

    // Verify new coords are within Mallorca/Islands bounds
    if (!isInMallorca(best.location.lat, best.location.lng)) { skippedNoMatch++; continue; }

    await updateDoc(doc(db, 'businesses', b.id), {
      location: { lat: Math.round(best.location.lat * 1e6) / 1e6, lng: Math.round(best.location.lng * 1e6) / 1e6 },
      updatedAt: new Date().toISOString(),
    });
    console.log(`FIXED: ${b.name} (${b.category}): ${curKey} -> ${srcKey} (addr: ${(b.address||'').substring(0,40)})`);
    fixed++;
  }

  console.log(`\nDone. Fixed: ${fixed}, Skipped(same): ${skippedSame}, Skipped(nomatch): ${skippedNoMatch}, Skipped(unique): ${skippedUnique}`);
  process.exit(0);
}

main();
