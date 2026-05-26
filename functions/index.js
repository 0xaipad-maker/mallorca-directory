const functions = require('firebase-functions/v2');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

const CATEGORY_MAP = {
  restaurante: 'restaurants',
  cafeteria: 'cafes',
  hotel: 'hotels',
  playa: 'beaches',
  parque: 'parks',
  farmacia: 'pharmacies',
  hospital: 'health',
  supermercado: 'supermarkets',
  tienda: 'shopping',
  taller: 'services',
  gasolinera: 'gasstations',
  banco: 'banks',
  correos: 'postoffice',
  policia: 'police',
  veterinario: 'veterinarians',
};

async function fetchOpenDataCAIB() {
  // Open Data Illes Balears API - example endpoints:
  // Pharmacies: https://intranet.caib.es/opendatacataleg/dataset/farmacia
  // Businesses: https://intranet.caib.es/opendatacataleg/dataset/establiments

  const endpoints = [
    'https://intranet.caib.es/opendatacataleg/api/3/action/datastore_search?resource_id=farmacia',
  ];

  const results = [];
  for (const url of endpoints) {
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.result && data.result.records) {
        for (const record of data.result.records) {
          const category = CATEGORY_MAP[record.tipus?.toLowerCase()] || 'services';
          results.push({
            name: record.nom || record.name || 'Unknown',
            address: record.adreca || record.address || '',
            phone: record.telefon || record.phone || '',
            category,
            location: {
              lat: parseFloat(record.latitud || record.lat || 0),
              lng: parseFloat(record.longitud || record.lng || 0),
            },
            source: 'open_data_caib',
            verified: false,
          });
        }
      }
    } catch (e) {
      console.error(`Error fetching ${url}:`, e.message);
    }
  }
  return results;
}

async function importBusinesses(businesses) {
  let count = 0;
  for (const b of businesses) {
    try {
      // Skip if already exists with same name
      const existing = await db.collection('businesses')
        .where('name', '==', b.name)
        .where('source', '==', b.source)
        .get();

      if (existing.empty) {
        await db.collection('businesses').add({
          ...b,
          rating: 0,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        count++;
      }
    } catch (e) {
      console.error(`Error importing "${b.name}":`, e.message);
    }
  }
  return count;
}

exports.autoImportOpenData = functions.scheduler.onSchedule('0 6 * * 1', async () => {
  console.log('Starting auto-import from Open Data CAIB...');
  const businesses = await fetchOpenDataCAIB();
  const count = await importBusinesses(businesses);
  console.log(`Imported ${count} new businesses`);
});

exports.importFromGooglePlaces = functions.https.onCall(async () => {
  // Requires @googlemaps/google-maps-services-js
  // const { Client } = require('@googlemaps/google-maps-services-js');
  // const client = new Client({});
  // const queries = ['supermarket in Mallorca', 'restaurant in Mallorca', ...];
  // for (const q of queries) { ... }
  return { message: 'Google Places import not configured. Add API key in .env' };
});
