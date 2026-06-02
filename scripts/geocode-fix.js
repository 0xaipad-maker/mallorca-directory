// Geocode business addresses via OSM Nominatim to fix coordinates
// Usage: node scripts/geocode-fix.js [--dry-run]
// Rate: 1 req/sec (Nominatim policy)

const https = require('https');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, updateDoc, doc, query, orderBy, limit: fireLimit } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig, 'geocoder');
const db = getFirestore(app);

const DELAY_MS = 1200;
const DRY_RUN = process.argv.includes('--dry-run');

function nominatim(query_str) {
  return new Promise((resolve, reject) => {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query_str)}&format=json&limit=1&accept-language=en`;
    https.get(url, { headers: { 'User-Agent': 'MallorcaDirectory/1.0 (geocode-fix)' } }, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch (e) { reject(new Error('Parse error')); }
      });
    }).on('error', reject);
  });
}

function coordKey(b) {
  return (b.location?.lat || '').toString().slice(0, 6) + ',' + (b.location?.lng || '').toString().slice(0, 6);
}

async function main() {
  const snap = await getDocs(collection(db, 'businesses'));
  const businesses = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  console.log(`Total businesses in Firestore: ${businesses.length}`);

  let fixed = 0, skipped = 0, errors = 0;

  for (let i = 0; i < businesses.length; i++) {
    const b = businesses[i];
    const name = b.name || '';
    const address = (b.address && b.address !== 'Mallorca') ? b.address : '';
    const area = b.area || '';

    // Build geocoding query: prefer address, fallback to name + area
    const query_str = [address, name, area, 'Mallorca'].filter(Boolean).join(', ');
    if (!query_str || query_str === 'Mallorca') { skipped++; continue; }

    process.stdout.write(`[${i + 1}/${businesses.length}] ${name.slice(0, 40).padEnd(42)} `);

    try {
      const results = await nominatim(query_str);
      if (results.length > 0) {
        const newLat = parseFloat(results[0].lat);
        const newLng = parseFloat(results[0].lon);
        const oldKey = coordKey(b);
        const newKey = coordKey({ location: { lat: newLat, lng: newLng } });

        if (oldKey !== newKey) {
          console.log(`📍 ${oldKey} → ${newKey}`);
          if (!DRY_RUN) {
            await updateDoc(doc(db, 'businesses', b.id), {
              location: { lat: Math.round(newLat * 1e6) / 1e6, lng: Math.round(newLng * 1e6) / 1e6 },
              updatedAt: new Date().toISOString(),
            });
          }
          fixed++;
        } else {
          console.log('✓ ok');
        }
      } else {
        console.log('✗ no result');
      }
    } catch (e) {
      console.log(`✗ ${e.message}`);
      errors++;
    }

    await new Promise(r => setTimeout(r, DELAY_MS));
  }

  console.log(`\nDone. Fixed: ${fixed}, Skipped: ${skipped}, Errors: ${errors}`);
  process.exit(0);
}

main();
