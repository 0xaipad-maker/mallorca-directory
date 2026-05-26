const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function importFromGooglePlaces() {
  // Требует: npm install @googlemaps/google-maps-services-js
  // const { Client } = require('@googlemaps/google-maps-services-js');
  // const client = new Client({});
  //
  // const queries = [
  //   { query: 'supermarket in Mallorca, Spain', category: 'shopping' },
  //   { query: 'car repair in Mallorca, Spain', category: 'services' },
  //   { query: 'hotel in Mallorca, Spain', category: 'hotels' },
  //   { query: 'restaurant in Mallorca, Spain', category: 'restaurants' },
  // ];
  //
  // for (const q of queries) {
  //   const response = await client.placesNearby({
  //     params: {
  //       query: q.query,
  //       location: { lat: 39.6953, lng: 3.0176 },
  //       radius: 50000,
  //       key: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
  //     },
  //   });
  //   for (const place of response.data.results) {
  //     await addDoc(collection(db, 'businesses'), {
  //       name: place.name,
  //       address: place.vicinity,
  //       rating: place.rating,
  //       category: q.category,
  //       location: { lat: place.geometry.location.lat, lng: place.geometry.location.lng },
  //       source: 'google_places',
  //       verified: false,
  //       createdAt: serverTimestamp(),
  //     });
  //   }
  // }

  console.log('Google Places import requires @googlemaps/google-maps-services-js');
  process.exit(0);
}

importFromGooglePlaces();
