// Fetch all Mercadona stores from official Mercadona store locator data
// Source: https://storage.googleapis.com/pro-bucket-wcorp-files/json/data.js
// Usage: node scripts/fetch-mercadona-official.js [--import]

const https = require('https');
const fs = require('fs');
const path = require('path');

const DATA_URL = 'https://storage.googleapis.com/pro-bucket-wcorp-files/json/data.js';

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'MallorcaDirectory/1.0' } }, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try {
          // Strip the "var dataJson = " prefix and trailing semicolon
          const json = body.replace(/^var\s+dataJson\s*=\s*/, '').replace(/;\s*$/, '');
          resolve(JSON.parse(json));
        } catch (e) { reject(new Error('Parse error: ' + e.message)); }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('Fetching Mercadona store data...');
  const data = await fetchJson(DATA_URL);
  const stores = data.tiendasFull || [];
  console.log(`Total stores in dataset: ${stores.length}`);

  // Filter for Mallorca (Balearic Islands)
  const mallorca = stores.filter(s => {
    const pv = (s.pv || '').toLowerCase();
    const cp = (s.cp || '').toString();
    return pv.includes('baleares') || pv.includes('balear') || cp.startsWith('07');
  });

  // Deduplicate by id
  const seen = new Set();
  const unique = [];
  for (const s of mallorca) {
    if (seen.has(s.id)) continue;
    seen.add(s.id);
    unique.push(s);
  }

  console.log(`Mallorca stores: ${unique.length}`);

  // Map to our format
  const mapped = unique.map(s => {
    // Parse hours
    let hours;
    if (s.in && s.fi) {
      const open = s.in.split('#')[0];
      const close = s.fi.split('#')[0];
      if (open && close && open !== 'C' && close !== 'C') {
        hours = { open: open.slice(0, 2) + ':' + open.slice(2), close: close.slice(0, 2) + ':' + close.slice(2) };
      }
    }

    const address = [s.dr, s.lc, 'Illes Balears'].filter(Boolean).join(', ');

    return {
      name: 'Mercadona',
      address,
      area: '',
      category: 'supermarkets',
      subcategory: '',
      rating: 0,
      verified: true,
      location: { lat: s.lt, lng: s.lg },
      phone: s.tf || '',
      hours,
      source: 'mercadona-official',
    };
  });

  for (const m of mapped) {
    const addr = m.address.toLowerCase();
    const areaMap = {
      'palma': ['palma', 'palma de mallorca', 'cala major', 'cala estància', 'can pastilla', 'coll den rabassa', 'es pil·larí', 'son sardina', 'cala gamba', 'cala nova'],
      'calvia': ['calvià', 'calvia', 'santa ponça', 'santa ponsa', 'peguera', 'palmanova', 'son caliu', 'cala viñas', 'cala vinyes', 'el toro', 'portals nous', 'bendinat', 'son ferrer', 'magaluf'],
      'andratx': ['andratx', 'port d\'andratx', 'sant elm', 's\'arracó', 'camp de mar'],
      'pollenca': ['pollença', 'pollenca', 'cala sant vicenç', 'port de pollença'],
      'alcudia': ['alcúdia', 'alcudia', 'can picafort', 'playa de muro', 'port d\'alcúdia'],
      'soller': ['sóller', 'soller', 'port de sóller'],
      'inca': ['inca'],
      'manacor': ['manacor', 'porto cristo', 's\'illot', 'cala anguila'],
      'santanyi': ['santanyí', 'santanyi', 'cala d\'or', 'cala figuera', 'cala llombards'],
      'llucmajor': ['llucmajor', 's\'arenal', 'el arenal', 'platja de palma'],
      'marratxi': ['marratxí', 'marratxi', 'port d\'inca', 'pont d\'inca', 'pla de na toma'],
      'capdepera': ['capdepera', 'cala rajada', 'cala ratjada', 'cala agulla', 'cala mesquida'],
      'arta': ['artà', 'arta'],
      'felanitx': ['felanitx', 'portocolom'],
      'campos': ['campos'],
      'muro': ['muro', 'playa de muro', 'platja de muro'],
      'sa-pobla': ['sa pobla', 'sa pobla'],
      'santa-maria': ['santa maria', 'santa maría'],
      'binissalem': ['binissalem'],
      'ses-salines': ['ses salines', 'colònia de sant jordi'],
      'esporles': ['esporles'],
      'porreres': ['porreres'],
      'son-servera': ['son servera', 'son severa', 'cala millor', 'cala bona', 'costa dels pins'],
      'deia': ['deià', 'deia'],
      'valldemossa': ['valldemossa'],
      'bunyola': ['bunyola'],
      'araro': ['alaró', 'alaro'],
    };
    for (const [id, keywords] of Object.entries(areaMap)) {
      if (keywords.some(k => addr.includes(k))) {
        m.area = id;
        break;
      }
    }
    if (!m.area) {
      // Fallback: find nearest area by coordinates
      const AREA_COORDS = {
        palma:[39.5696,2.6502], calvia:[39.5650,2.5060], andratx:[39.5760,2.4200],
        pollenca:[39.8770,3.0170], alcudia:[39.8530,3.1210], soller:[39.7670,2.7140],
        inca:[39.7210,2.9100], manacor:[39.5690,3.2090], santanyi:[39.3540,3.1280],
        llucmajor:[39.4900,2.8900], marratxi:[39.6420,2.7530], capdepera:[39.7030,3.4350],
        arta:[39.6930,3.3490], felanitx:[39.4700,3.1480], campos:[39.4310,3.0190],
        muro:[39.7350,3.0580], 'sa-pobla':[39.7690,3.0230], 'santa-maria':[39.6510,2.7730],
        binissalem:[39.6860,2.8360], 'ses-salines':[39.3360,3.0510], esporles:[39.6680,2.5790],
        porreres:[39.5160,3.0220], 'son-servera':[39.6210,3.3600],
        deia:[39.7480,2.6490], valldemossa:[39.7100,2.6220],
        bunyola:[39.6960,2.6990], araro:[39.7040,2.7920],
      };
      let best = null, minD = Infinity;
      for (const [id, coords] of Object.entries(AREA_COORDS)) {
        const d = Math.hypot(coords[0]-m.location.lat, coords[1]-m.location.lng);
        if (d < minD) { minD = d; best = id; }
      }
      m.area = best || 'palma';
    }
  }

  console.log('\nMercadona stores in Mallorca:');
  for (const m of mapped) {
    console.log(`  ${m.address} [${m.area}] (${m.location.lat},${m.location.lng})${m.phone ? ' tel:'+m.phone : ''}`);
  }

  const outputPath = path.join(__dirname, '..', 'mercadona-official.json');
  fs.writeFileSync(outputPath, JSON.stringify(mapped, null, 2));
  console.log(`\nSaved to ${outputPath}`);

  if (process.argv.includes('--import')) {
    require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
    const { initializeApp } = require('firebase/app');
    const { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } = require('firebase/firestore');

    const firebaseConfig = {
      apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    };
    const app = initializeApp(firebaseConfig, 'mercadona-importer');
    const db = getFirestore(app);

    // Find existing Mercadona entries to clean up
    const snap = await getDocs(collection(db, 'businesses'));
    const existingMercadona = [];
    const otherDocs = [];
    snap.forEach(d => {
      const data = d.data();
      if ((data.name || '').toLowerCase().startsWith('mercadona')) {
        existingMercadona.push({ id: d.id, ...data });
      } else {
        otherDocs.push(d.id);
      }
    });
    console.log(`Existing Mercadona entries in Firestore: ${existingMercadona.length}`);

    // Delete all existing Mercadona entries
    for (const m of existingMercadona) {
      await deleteDoc(doc(db, 'businesses', m.id));
      console.log(`  Deleted: ${m.name} — ${m.address}`);
    }

    // Add official data
    let added = 0;
    for (const m of mapped) {
      try {
        await addDoc(collection(db, 'businesses'), {
          ...m,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        added++;
      } catch (e) {
        console.error(`Error adding ${m.address}: ${e.message}`);
      }
    }
    console.log(`Added ${added} official Mercadona stores`);
  }

  process.exit(0);
}

main();
