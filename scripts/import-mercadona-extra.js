require('dotenv').config();
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs, query, where } = require('firebase/firestore');

const cfg = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const newStores = [
  // Palma new stores
  {name:'Mercadona', sub:'Joan Miró 236', address:'Avda. Joan Miró, 236, 07015, Palma', area:'palma', lat:39.5524, lng:2.6147, tel:'971455213'},
  {name:'Mercadona', sub:'Aragón 231', address:'C/ Aragón, 231, 07006, Palma', area:'palma', lat:39.5904, lng:2.6783, tel:''},
  {name:'Mercadona', sub:'Son Puig', address:'C/ Son Puig, 5, 07015, Palma', area:'palma', lat:39.5657, lng:2.6427, tel:''},
  {name:'Mercadona', sub:'Andrea Doria', address:'C/ Andrea Doria, 66, 07014, Palma', area:'palma', lat:39.5718, lng:2.6228, tel:'971736249'},
  {name:'Mercadona', sub:'Mercapalma', address:'Lugar Mercapalma, S/N, 07007, Palma', area:'palma', lat:39.5543, lng:2.7120, tel:'971408295'},
  {name:'Mercadona', sub:'Camí Can Domenge', address:'Camí Can Domenge, 4, 07015, Palma', area:'palma', lat:39.5527, lng:2.6139, tel:'971400286'},
  // Inca
  {name:'Mercadona', sub:'Inca Gran Via', address:'C/ Gran Via de Colom, 28, 07300, Inca', area:'inca', lat:39.7205, lng:2.9127, tel:'971881236'},
  // Calvià
  {name:'Mercadona', sub:'Calvià Llorer', address:'C/ Llorer, S/N, 07184, Calvià', area:'calvia', lat:39.5683, lng:2.5063, tel:''},
  {name:'Mercadona', sub:'Calvià Palma Nova', address:'Ctra. Andratx (Palma Nova), S/N, 07181, Calvià', area:'calvia', lat:39.5340, lng:2.5357, tel:'971682233'},
  {name:'Mercadona', sub:'Calvià Son Bacardí', address:'C/ Son Bacardí, S/N, 07184, Calvià', area:'calvia', lat:39.5640, lng:2.5023, tel:'971682233'},
  // Sa Pobla
  {name:'Mercadona', sub:'Sa Pobla Rector', address:'C/ Rector Tomàs Serra, S/N, 07420, Sa Pobla', area:'inca', lat:39.7633, lng:3.0238, tel:'971541999'},
  // Sant Llorenç
  {name:'Mercadona', sub:'Sant Llorenç Colom', address:'C/ Cristòfol Colom, S/N, 07540, Sant Llorenç des Cardassar', area:'son-servera', lat:39.6133, lng:3.3398, tel:''},
  // Marratxí
  {name:'Mercadona', sub:'Marratxí Sant Marçal', address:'Urbanització Sant Marçal, S/N, 07141, Marratxí', area:'marratxi', lat:39.6325, lng:2.7321, tel:''},
];

const app = initializeApp(cfg, 'mercadona-import');
const db = getFirestore(app);

(async()=>{
  // Check for duplicates
  const existing = await getDocs(collection(db, 'businesses'));
  const existingNames = new Set();
  existing.docs.forEach(d => {
    const data = d.data();
    if (data.name === 'Mercadona') {
      existingNames.add(data.address?.substring(0, 30));
    }
  });
  
  let added = 0, skipped = 0;
  
  for (const store of newStores) {
    const nameKey = store.name + (store.sub ? ' ' + store.sub : '');
    const displayName = store.sub ? `${store.name} ${store.sub}` : store.name;
    
    // Check if already exists
    const prefix = store.address.substring(0, 25);
    const isDupe = [...existingNames].some(e => e && e.includes(prefix.substring(0, 15)));
    
    if (isDupe) {
      console.log('SKIP (dupe):', displayName);
      skipped++;
      continue;
    }
    
    const doc = {
      name: displayName,
      category: 'supermarkets',
      subcategory: 'supermercado',
      description: {
        en: 'Mercadona supermarket in Mallorca. Fresh produce, groceries, and household essentials.',
        es: 'Supermercado Mercadona en Mallorca. Productos frescos, comestibles y artículos básicos para el hogar.',
        de: 'Mercadona Supermarkt auf Mallorca. Frische Produkte, Lebensmittel und Haushaltsartikel.',
        ru: 'Супермаркет Mercadona на Майорке. Свежие продукты, бакалея и товары для дома.'
      },
      address: store.address,
      area: store.area,
      location: { lat: store.lat, lng: store.lng },
      phone: store.tel || '',
      website: 'https://www.mercadona.es',
      hours: {
        mon: '09:00-21:00', tue: '09:00-21:00', wed: '09:00-21:00',
        thu: '09:00-21:00', fri: '09:00-21:00', sat: '09:00-21:00', sun: 'Closed'
      },
      tags: ['supermarket', 'groceries', 'fresh-produce', 'spanish'],
      rating: 0,
      reviewCount: 0,
      featured: false,
      premium: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: 'mercadona-official',
    };
    
    await addDoc(collection(db, 'businesses'), doc);
    added++;
    console.log('ADDED:', displayName, `[${store.area}]`, store.lat, store.lng);
  }
  
  console.log(`\nDone! Added: ${added}, Skipped: ${skipped}`);
  process.exit(0);
})();
