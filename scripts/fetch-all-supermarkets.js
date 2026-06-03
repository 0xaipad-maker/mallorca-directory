// Fetch ALL supermarkets and convenience stores in Mallorca from OSM
// Usage: node scripts/fetch-all-supermarkets.js [--import]

const https = require('https');
const fs = require('fs');
const path = require('path');

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const MALLORCA_BBOX = '39.2,2.2,40.0,3.5';
const DELAY_MS = 3000;

const QUERIES = [
  { label: 'supermarket-nw', osm: '["shop"="supermarket"]', bbox: '39.2,2.2,40.0,2.8' },
  { label: 'supermarket-sw', osm: '["shop"="supermarket"]', bbox: '39.2,2.8,39.6,3.5' },
  { label: 'supermarket-ne', osm: '["shop"="supermarket"]', bbox: '39.6,2.8,40.0,3.5' },
  { label: 'convenience', osm: '["shop"="convenience"]', bbox: MALLORCA_BBOX },
];

// Area centers for proximity matching (lat, lng)
const AREA_CENTERS = {
  'Palma': [39.5696, 2.6502],
  'Calvià': [39.5650, 2.5060],
  'Andratx': [39.5760, 2.4200],
  'Pollença': [39.8770, 3.0170],
  'Alcúdia': [39.8530, 3.1210],
  'Sóller': [39.7670, 2.7140],
  'Deià': [39.7480, 2.6490],
  'Valldemossa': [39.7100, 2.6220],
  'Inca': [39.7210, 2.9100],
  'Manacor': [39.5690, 3.2090],
  'Santanyí': [39.3540, 3.1280],
  'Llucmajor': [39.4900, 2.8900],
  'Marratxí': [39.6420, 2.7530],
  'Bunyola': [39.6960, 2.6990],
  'Alaró': [39.7040, 2.7920],
  'Capdepera': [39.7030, 3.4350],
  'Artà': [39.6930, 3.3490],
  'Felanitx': [39.4700, 3.1480],
  'Campos': [39.4310, 3.0190],
  'Muro': [39.7350, 3.0580],
  'Sa Pobla': [39.7690, 3.0230],
  'Santa Maria del Camí': [39.6510, 2.7730],
  'Binissalem': [39.6860, 2.8360],
  'Ses Salines': [39.3360, 3.0510],
  'Esporles': [39.6680, 2.5790],
  'Porreres': [39.5160, 3.0220],
  'Son Servera': [39.6210, 3.3600],
  'Santa Margalida': [39.7019, 3.1021],
  'Sineu': [39.6416, 3.0100],
  'Petra': [39.6126, 3.1124],
  'Consell': [39.6680, 2.8150],
  'Sant Llorenç des Cardassar': [39.6090, 3.2852],
  'Selva': [39.7545, 2.9005],
  'Campanet': [39.7736, 2.9670],
  'Algaida': [39.5568, 2.8953],
  'Montuïri': [39.5700, 2.9825],
  'Lloret de Vistalegre': [39.6182, 2.9754],
  'Costitx': [39.6573, 2.9507],
  'Sencelles': [39.6468, 2.8971],
  'Sant Joan': [39.5955, 2.9979],
  'Maria de la Salut': [39.6641, 3.0748],
  'Vilafranca de Bonany': [39.5676, 3.0874],
};

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng/2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function findNearestArea(lat, lng) {
  let nearest = '';
  let minDist = Infinity;
  for (const [name, [al, alng]] of Object.entries(AREA_CENTERS)) {
    const d = haversine(lat, lng, al, alng);
    if (d < minDist) {
      minDist = d;
      nearest = name;
    }
  }
  return minDist <= 20 ? nearest : '';
}

const AREA_ALIASES = {
  'palma de mallorca': 'Palma',
  'palma': 'Palma',
  'ciutat de mallorca': 'Palma',
  'calvia': 'Calvià',
  'calvià': 'Calvià',
  'santa ponça': 'Calvià',
  'santa ponsa': 'Calvià',
  'magaluf': 'Calvià',
  'paguera': 'Calvià',
  'palmanova': 'Calvià',
  'camp de mar': 'Calvià',
  'cala blava': 'Calvià',
  'cala vinyes': 'Calvià',
  'port d\'andratx': 'Andratx',
  'andratx': 'Andratx',
  'pollenca': 'Pollença',
  'pollença': 'Pollença',
  'port de pollença': 'Pollença',
  'cala sant vicenç': 'Pollença',
  'alcudia': 'Alcúdia',
  'alcúdia': 'Alcúdia',
  'port d\'alcúdia': 'Alcúdia',
  'puerto de alcudia': 'Alcúdia',
  'soller': 'Sóller',
  'sóller': 'Sóller',
  'port de sóller': 'Sóller',
  'deia': 'Deià',
  'deià': 'Deià',
  'valldemossa': 'Valldemossa',
  'inca': 'Inca',
  'manacor': 'Manacor',
  'porto cristo': 'Manacor',
  'cala millor': 'Santanyí',
  'santanyi': 'Santanyí',
  'santanyí': 'Santanyí',
  'cala d\'or': 'Santanyí',
  'cala figuera': 'Santanyí',
  'cala llombards': 'Santanyí',
  'cala mondragó': 'Santanyí',
  'portopetro': 'Santanyí',
  's\'arenal': 'Llucmajor',
  'llucmajor': 'Llucmajor',
  'playa de palma': 'Llucmajor',
  'coll d\'en rabassa': 'Llucmajor',
  'can pastilla': 'Llucmajor',
  'marratxi': 'Marratxí',
  'marratxí': 'Marratxí',
  'bunyola': 'Bunyola',
  'araro': 'Alaró',
  'alaró': 'Alaró',
  'capdepera': 'Capdepera',
  'cala ratjada': 'Capdepera',
  'cala agulla': 'Capdepera',
  'cala mesquida': 'Capdepera',
  'font de sa cala': 'Capdepera',
  'son moll': 'Capdepera',
  'canyamel': 'Capdepera',
  'arta': 'Artà',
  'artà': 'Artà',
  'betlem': 'Artà',
  'felanitx': 'Felanitx',
  'calonge': 'Santanyí',
  'portocolom': 'Felanitx',
  'campos': 'Campos',
  'colònia de sant jordi': 'Campos',
  'muro': 'Muro',
  'sa pobla': 'Sa Pobla',
  'santa maria del camí': 'Santa Maria del Camí',
  'santa maria': 'Santa Maria del Camí',
  'binissalem': 'Binissalem',
  'ses salines': 'Ses Salines',
  'esporles': 'Esporles',
  'porreres': 'Porreres',
  'son servera': 'Son Servera',
  'consell': 'Consell',
  'sineu': 'Sineu',
  'petra': 'Petra',
  'vilafranca de bonany': 'Vilafranca de Bonany',
  'montuiri': 'Montuïri',
  'montuïri': 'Montuïri',
  'sant llorenç des cardassar': 'Sant Llorenç des Cardassar',
  'sant llorenc': 'Sant Llorenç des Cardassar',
  'sant llorenç': 'Sant Llorenç des Cardassar',
  'sant joan': 'Sant Joan',
  'lloret de vistalegre': 'Lloret de Vistalegre',
  'sencelles': 'Sencelles',
  'costitx': 'Costitx',
  'maria de la salut': 'Maria de la Salut',
  'santa margalida': 'Santa Margalida',
  'can picafort': 'Santa Margalida',
  'selva': 'Selva',
  'campanet': 'Campanet',
  'algaida': 'Algaida',
  'provensals': 'Llucmajor',
};

function queryOverpass(query) {
  return new Promise((resolve, reject) => {
    const req = https.request(OVERPASS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'Content-Length': Buffer.byteLength(query),
        'User-Agent': 'MallorcaDirectory/2.0',
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

function buildQuery(filter, bbox) {
  return `[out:json][timeout:180];(node${filter}(${bbox});way${filter}(${bbox}););out center;`;
}

function normalizeArea(city, lat, lng) {
  if (!city) return findNearestArea(lat, lng);
  const key = city.toLowerCase().trim();
  if (AREA_ALIASES[key]) return AREA_ALIASES[key];
  const r = findNearestArea(lat, lng);
  return r || city;
}

function extract(element) {
  const tags = element.tags || {};
  let name = tags.name || tags['name:en'] || tags['name:es'] || '';
  const brand = tags.brand || '';
  if (!name && brand) name = brand;
  if (!name) {
    const shop = tags.shop || '';
    if (shop === 'supermarket') name = 'Supermarket';
    else if (shop === 'convenience') name = 'Convenience Store';
    else name = 'Shop';
    const city = tags['addr:city'] || tags['addr:suburb'] || tags['addr:town'] || '';
    if (city) name = name + ' (' + city + ')';
  }

  const lat = element.type === 'node' ? element.lat : (element.center ? element.center.lat : null);
  const lng = element.type === 'node' ? element.lon : (element.center ? element.center.lon : null);
  if (!lat || !lng) return null;

  const addrParts = [tags['addr:housenumber'] || '', tags['addr:street'] || ''].filter(Boolean).join(', ');
  const city = tags['addr:city'] || tags['addr:suburb'] || tags['addr:town'] || '';
  const address = addrParts ? (addrParts + (city ? ', ' + city : '')) : (city || 'Mallorca');

  const area = normalizeArea(city, lat, lng);
  const phone = tags.phone || tags['contact:phone'] || '';
  const website = tags.website || tags['contact:website'] || '';
  const hours = tags.opening_hours ? { open: tags.opening_hours, close: '' } : undefined;

  const result = {
    name,
    address,
    area,
    category: 'supermarkets',
    rating: 0,
    verified: false,
    location: { lat: Math.round(lat * 1e6) / 1e6, lng: Math.round(lng * 1e6) / 1e6 },
  };
  if (phone) result.phone = phone;
  if (website) result.website = website;
  if (hours) result.hours = hours;
  return result;
}

async function main() {
  const all = [];

  for (const q of QUERIES) {
    const query = buildQuery(q.osm, q.bbox);
    process.stdout.write(`Fetching ${q.label}... `);
    try {
      const result = await queryOverpass(query);
      const elements = result.elements || [];
      const businesses = elements.map(e => extract(e)).filter(Boolean);
      all.push(...businesses);
      console.log(`${businesses.length} found`);
    } catch (e) {
      console.log(`Error: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, DELAY_MS));
  }

  const seen = new Set();
  const unique = [];
  for (const b of all) {
    const key = (b.name + '|' + b.address + '|' + b.location.lat + '|' + b.location.lng).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(b);
  }

  console.log(`\nTotal unique: ${unique.length}`);

  const byArea = {};
  for (const b of unique) {
    const a = b.area || '(no area)';
    byArea[a] = (byArea[a] || 0) + 1;
  }
  for (const [area, count] of Object.entries(byArea).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${area}: ${count}`);
  }

  const byName = {};
  for (const b of unique) {
    let base = b.name.split(' - ')[0].split(' (')[0].trim();
    byName[base] = (byName[base] || 0) + 1;
  }
  console.log('\nBy chain:');
  for (const [name, count] of Object.entries(byName).sort((a, b) => b[1] - a[1]).slice(0, 20)) {
    console.log(`  ${name}: ${count}`);
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
      existingMap[(d.name||'') + '|' + (d.address||'').toLowerCase().trim() + '|' + (d.category||'')] = snap.id;
    });
    console.log(`Existing docs in Firestore: ${existing.size}`);

    function clean(obj) {
      return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined && v !== null));
    }

    let added = 0, updated = 0, skipped = 0;
    for (const b of unique) {
      const key = b.name + '|' + b.address.toLowerCase().trim() + '|' + b.category;
      const payload = { ...clean(b), updatedAt: serverTimestamp() };
      try {
        if (existingMap[key]) {
          const id = existingMap[key];
          const existingDoc = await getDocs(collection(db, 'businesses'));
          let shouldUpdate = true;
          existingDoc.forEach(snap => {
            if (snap.id === id) {
              const d = snap.data();
              if (d.source === 'seed') shouldUpdate = false;
            }
          });
          if (shouldUpdate) {
            await updateDoc(doc(db, 'businesses', id), payload);
            updated++;
          } else {
            skipped++;
          }
        } else {
          await addDoc(collection(db, 'businesses'), { ...payload, source: 'osm-all-supermarkets', createdAt: serverTimestamp() });
          added++;
        }
      } catch (e) {
        console.error(`Error "${b.name}": ${e.message}`);
      }
    }
    console.log(`Imported: ${added} added, ${updated} updated, ${skipped} skipped (seed data)`);
  }

  process.exit(0);
}

main();
