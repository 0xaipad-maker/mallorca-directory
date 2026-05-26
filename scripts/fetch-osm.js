// Fetches business data from OpenStreetMap via Overpass API
// Usage: node scripts/fetch-osm.js [--import]

const https = require('https');
const fs = require('fs');
const path = require('path');

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const MALLORCA_BBOX = '39.2,2.2,40.0,3.5';
const DELAY_MS = 3000;

const CATEGORY_MAP = [
  { id: 'restaurants', osm: ['["amenity"="restaurant"]', '["amenity"="fast_food"]'] },
  { id: 'cafes', osm: ['["amenity"="cafe"]'] },
  { id: 'hotels', osm: ['["tourism"="hotel"]', '["tourism"="guest_house"]', '["tourism"="hostel"]', '["tourism"="apartment"]'] },
  { id: 'beaches', osm: ['["natural"="beach"]', '["leisure"="beach_resort"]'] },
  { id: 'parks', osm: ['["leisure"="park"]', '["leisure"="garden"]'] },
  { id: 'activities', osm: ['["leisure"="water_park"]', '["tourism"="attraction"]', '["leisure"="miniature_golf"]', '["sport"="diving"]', '["sport"="golf"]'] },
  { id: 'shopping', osm: ['["shop"="mall"]', '["shop"="clothes"]', '["shop"="gift"]', '["shop"="electronics"]'] },
  { id: 'supermarkets', osm: ['["shop"="supermarket"]', '["shop"="convenience"]', '["shop"="wholesale"]'] },
  { id: 'services', osm: ['["shop"="car_repair"]', '["shop"="laundry"]', '["shop"="dry_cleaning"]', '["shop"="hairdresser"]', '["shop"="beauty"]'] },
  { id: 'transport', osm: ['["amenity"="bus_station"]', '["amenity"="ferry_terminal"]', '["highway"="bus_stop"]'] },
  { id: 'health', osm: ['["amenity"="hospital"]', '["amenity"="clinic"]', '["amenity"="doctor"]', '["amenity"="dentist"]'] },
  { id: 'pharmacies', osm: ['["amenity"="pharmacy"]'] },
  { id: 'police', osm: ['["amenity"="police"]'] },
  { id: 'gasstations', osm: ['["amenity"="fuel"]'] },
  { id: 'veterinarians', osm: ['["amenity"="veterinary"]'] },
  { id: 'banks', osm: ['["amenity"="bank"]', '["amenity"="atm"]'] },
  { id: 'postoffice', osm: ['["amenity"="post_office"]'] },
  { id: 'industrial', osm: ['["landuse"="industrial"]', '["industrial"="estate"]'] },
];

function queryOverpass(query) {
  return new Promise((resolve, reject) => {
    const data = 'data=' + encodeURIComponent(query);
    const req = https.request(OVERPASS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(data) },
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 429) {
          reject(new Error('Rate limited'));
        } else if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${body.slice(0, 200)}`));
        } else {
          try { resolve(JSON.parse(body)); } catch (e) { reject(new Error('Parse error')); }
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function buildQuery(tags) {
  const filters = tags.map(t => `node${t}(${MALLORCA_BBOX});way${t}(${MALLORCA_BBOX});`).join('');
  return `[out:json][timeout:120];(${filters});out center 50;`;
}

function extractBusiness(element, category) {
  const tags = element.tags || {};
  const name = tags.name || tags['name:en'] || tags['name:es'] || '';
  if (!name) return null;

  const lat = element.type === 'node' ? element.lat : (element.center ? element.center.lat : null);
  const lng = element.type === 'node' ? element.lon : (element.center ? element.center.lon : null);
  if (!lat || !lng) return null;

  const address = [
    tags['addr:housenumber'] || '',
    tags['addr:street'] || '',
  ].filter(Boolean).join(', ') || tags['addr:city'] || '';

  const area = tags['addr:city'] || tags['addr:suburb'] || tags['addr:town'] || '';

  const phone = tags['phone'] || tags['contact:phone'] || '';
  const website = tags['website'] || tags['contact:website'] || '';
  const rating = 0;

  const hours = tags['opening_hours'] ? { open: tags['opening_hours'].slice(0, 5), close: '' } : undefined;

  return {
    name,
    area,
    address: address || area || 'Mallorca',
    phone,
    website,
    category,
    rating,
    verified: false,
    location: { lat: Math.round(lat * 1e6) / 1e6, lng: Math.round(lng * 1e6) / 1e6 },
    hours: hours?.open ? hours : undefined,
  };
}

async function fetchAll() {
  const all = [];

  for (const cat of CATEGORY_MAP) {
    const q = buildQuery(cat.osm);
    process.stdout.write(`Fetching ${cat.id}... `);
    try {
      const result = await queryOverpass(q);
      const elements = result.elements || [];
      const businesses = elements.map(e => extractBusiness(e, cat.id)).filter(Boolean);
      all.push(...businesses);
      console.log(`${businesses.length} businesses`);
    } catch (e) {
      console.log(`Error: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, DELAY_MS));
  }

  console.log(`\nTotal fetched: ${all.length} businesses`);
  return all;
}

(async () => {
  const businesses = await fetchAll();

  const outputPath = path.join(__dirname, '..', 'osm-export.json');
  fs.writeFileSync(outputPath, JSON.stringify(businesses, null, 2));
  console.log(`Saved to ${outputPath}`);

  if (process.argv.includes('--import')) {
    // Import directly to Firestore
    require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
    const { initializeApp } = require('firebase/app');
    const { getFirestore, collection, addDoc, getDocs, updateDoc, doc, deleteDoc, serverTimestamp } = require('firebase/firestore');

    const firebaseConfig = {
      apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    };

    const app = initializeApp(firebaseConfig, 'osm-importer');
    const db = getFirestore(app);

    const existing = await getDocs(collection(db, 'businesses'));
    const existingMap = {};
    existing.forEach(snap => {
      const d = snap.data();
      existingMap[(d.name || '') + '|' + (d.category || '')] = snap.id;
    });
    console.log(`Found ${existing.size} existing docs in Firestore`);

    let added = 0, updated = 0;
    for (const b of businesses) {
      const key = b.name + '|' + b.category;
      const payload = { ...b, updatedAt: serverTimestamp() };
      try {
        if (existingMap[key]) {
          await updateDoc(doc(db, 'businesses', existingMap[key]), payload);
          updated++;
        } else {
          await addDoc(collection(db, 'businesses'), { ...payload, source: 'osm', createdAt: serverTimestamp() });
          added++;
        }
      } catch (e) {
        console.error(`Error: "${b.name}": ${e.message}`);
      }
    }
    console.log(`Imported: ${added} added, ${updated} updated`);
  }

  process.exit(0);
})();
