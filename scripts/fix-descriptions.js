require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc, serverTimestamp } = require('firebase/firestore');

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

const descTemplates = {
  restaurants: 'Mediterranean and international cuisine in a welcoming setting.',
  cafes: 'Relaxing spot for coffee, pastries, and light meals.',
  hotels: 'Comfortable accommodation with excellent service and amenities.',
  beaches: 'Stunning sandy beach with crystal-clear Mediterranean waters.',
  parks: 'Beautiful green space perfect for relaxation and nature walks.',
  activities: 'Fun and exciting experience for all ages.',
  shopping: 'Great selection of shops and products in a convenient location.',
  supermarkets: 'Well-stocked supermarket with fresh produce and daily essentials.',
  services: 'Professional and reliable service you can trust.',
  transport: 'Convenient transport hub connecting you across Mallorca.',
  health: 'Quality healthcare and medical services.',
  pharmacies: 'Full-service pharmacy with professional care.',
  police: 'Dedicated to keeping the community safe.',
  gasstations: 'Convenient fuel station with competitive prices.',
  veterinarians: 'Caring veterinary services for your pets.',
  banks: 'Full banking services for individuals and businesses.',
  postoffice: 'Complete postal and parcel services.',
  industrial: 'Strategic industrial estate with modern facilities for businesses.',
};

async function migrate() {
  const snapshot = await getDocs(collection(db, 'businesses'));
  let updated = 0;
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    if (!data.description) {
      const desc = descTemplates[data.category] || 'Quality service in Mallorca.';
      await updateDoc(doc(db, 'businesses', docSnap.id), { description: desc, updatedAt: serverTimestamp() });
      updated++;
    }
  }
  console.log(`Updated ${updated}/${snapshot.docs.length} businesses with descriptions.`);
  process.exit(0);
}

migrate();
