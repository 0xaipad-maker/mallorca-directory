// Fetch all Mercadona, Lidl, Eroski, Aldi in Mallorca from OSM
// Usage: node scripts/fetch-supermarkets.js [--import]

const https = require('https');
const fs = require('fs');
const path = require('path');

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const MALLORCA_BBOX = '39.2,2.2,40.0,3.5';
const DELAY_MS = 1500;

const CHAINS = {
  mercadona: { brand: 'Mercadona', osm: '["name"="Mercadona"]' },
  lidl: { brand: 'Lidl', osm: '["name"="Lidl"]["shop"="supermarket"]' },
  eroski: { brand: 'Eroski', osm: '["name"="Eroski"]' },
  aldi: { brand: 'Aldi', osm: '["name"="Aldi"]' },
};

function queryOverpass(query) {
  return new Promise((resolve, reject) => {
    const req = https.request(OVERPASS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'Content-Length': Buffer.byteLength(query),
        'User-Agent': 'MallorcaDirectory/1.0',
      },
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 429) return reject(new Error('Rate limited'));
        if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}: ${body.slice(0,200)}`));
        try { resolve(JSON.parse(body)); } catch (e) { reject(new Error('Parse error')); }
      });
    });
    req.on('error', reject);
    req.write(query);
    req.end();
  });
}

function buildQuery(filter) {
  return `[out:json][timeout:60];(node${filter}(${MALLORCA_BBOX});way${filter}(${MALLORCA_BBOX}););out center 50;`;
}

function extract(element, catId) {
  const tags = element.tags || {};
  const name = tags.name || tags['name:en'] || tags['name:es'] || '';
  const brand = tags.brand || tags['brand:en'] || tags['brand:es'] || catId.charAt(0).toUpperCase() + catId.slice(1);
  const displayName = name || brand;

  const lat = element.type === 'node' ? element.lat : (element.center ? element.center.lat : null);
  const lng = element.type === 'node' ? element.lon : (element.center ? element.center.lon : null);
  if (!lat || !lng) return null;

  const addrParts = [tags['addr:housenumber'] || '', tags['addr:street'] || ''].filter(Boolean).join(', ');
  const city = tags['addr:city'] || tags['addr:suburb'] || tags['addr:town'] || '';
  const address = addrParts ? (addrParts + (city ? ', ' + city : '')) : (city || 'Mallorca');

  const area = city || '';
  const phone = tags.phone || tags['contact:phone'] || '';
  const website = tags.website || tags['contact:website'] || '';
  const hours = tags.opening_hours ? { open: tags.opening_hours.slice(0,5), close: '' } : undefined;

  const result = {
    name: displayName,
    address,
    area,
    category: 'supermarkets',
    rating: 0,
    verified: false,
    location: { lat: Math.round(lat * 1e6) / 1e6, lng: Math.round(lng * 1e6) / 1e6 },
  };
  if (phone) result.phone = phone;
  if (website) result.website = website;
  if (hours?.open) result.hours = hours;
  return result;
}

async function main() {
  const all = [];

  for (const [catId, chain] of Object.entries(CHAINS)) {
    const q = buildQuery(chain.osm);
    process.stdout.write(`Fetching ${chain.brand}... `);
    try {
      const result = await queryOverpass(q);
      const elements = result.elements || [];
      const businesses = elements.map(e => extract(e, catId)).filter(Boolean);
      all.push(...businesses);
      console.log(`${businesses.length} found`);
    } catch (e) {
      console.log(`Error: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, DELAY_MS));
  }

  // Deduplicate by name+address (same store listed as node+way)
  const seen = new Set();
  const unique = [];
  for (const b of all) {
    const key = b.name + '|' + b.address;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(b);
  }

  console.log(`\nTotal unique: ${unique.length}`);
  for (const b of unique) {
    console.log(`  ${b.name} — ${b.address} (${b.location.lat},${b.location.lng})`);
  }

  const outputPath = path.join(__dirname, '..', 'supermarkets-export.json');
  fs.writeFileSync(outputPath, JSON.stringify(unique, null, 2));
  console.log(`\nSaved to ${outputPath}`);

  if (process.argv.includes('--import')) {
    require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
    const { initializeApp } = require('firebase/app');
    const { getFirestore, collection, getDocs, addDoc, updateDoc, doc, serverTimestamp } = require('firebase/firestore');

    const firebaseConfig = {
      apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    };
    const app = initializeApp(firebaseConfig, 'supermarket-importer');
    const db = getFirestore(app);

    const existing = await getDocs(collection(db, 'businesses'));
    const existingMap = {};
    existing.forEach(snap => {
      const d = snap.data();
      existingMap[(d.name||'') + '|' + (d.address||'').toLowerCase().trim()] = snap.id;
    });
    console.log(`Existing docs in Firestore: ${existing.size}`);

    function clean(obj) {
      return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined && v !== null));
    }

    let added = 0, updated = 0;
    for (const b of unique) {
      const key = b.name + '|' + b.address.toLowerCase().trim();
      const payload = { ...clean(b), updatedAt: serverTimestamp() };
      try {
        if (existingMap[key]) {
          const snap = await getDocs(collection(db, 'businesses'));
          // simple update by id
        }
        // Always use addDoc for new entries
        const exists = existingMap[key];
        if (exists) {
          await updateDoc(doc(db, 'businesses', exists), payload);
          updated++;
        } else {
          await addDoc(collection(db, 'businesses'), { ...payload, source: 'osm-supermarkets', createdAt: serverTimestamp() });
          added++;
        }
      } catch (e) {
        console.error(`Error "${b.name}": ${e.message}`);
      }
    }
    console.log(`Imported: ${added} added, ${updated} updated`);
  }

  process.exit(0);
}

main();
