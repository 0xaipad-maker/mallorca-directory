require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

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

const businesses = [
  // ===== RESTAURANTS =====
  { name: "Ca'n Joan de s'Aigo", address: 'Carrer del Baró de Santa Maria del Sepulcre, 10, Palma', phone: '+34 971 71 07 59', category: 'restaurants', rating: 4.5, verified: true, location: { lat: 39.5705, lng: 2.6480 }, hours: { open: '08:00', close: '23:00' }, description: 'Traditional Mallorcan bakery and café since 1700. Famous for ensaimadas and hot chocolate.' },
  { name: 'El Camino Restaurant', address: 'Plaça de la Llotja, 4, Palma', phone: '+34 971 72 08 16', website: 'https://elcaminopalma.com', category: 'restaurants', rating: 4.7, verified: true, location: { lat: 39.5685, lng: 2.6455 }, hours: { open: '13:00', close: '23:00' }, description: 'Modern Mediterranean cuisine in the heart of Palma.' },
  { name: 'Adriano', address: 'Calle del Mar, 9, Cala d\'Or', phone: '+34 971 64 01 50', category: 'restaurants', rating: 4.3, verified: true, location: { lat: 39.3790, lng: 3.2330 }, hours: { open: '12:00', close: '22:30' }, description: 'Italian restaurant with sea views.' },
  { name: "Restaurant Es Racó d'es Teix", address: 'Carretera de Deià, s/n, Deià', phone: '+34 971 63 90 61', category: 'restaurants', rating: 4.8, verified: true, location: { lat: 39.7480, lng: 2.6490 }, hours: { open: '19:00', close: '22:00' }, description: 'Michelin-starred restaurant in the Tramuntana mountains.' },
  { name: 'La Parada del Mar', address: 'Passeig Marítim, 42, Palma', phone: '+34 971 45 67 89', category: 'restaurants', rating: 4.2, verified: false, location: { lat: 39.5630, lng: 2.6340 }, hours: { open: '12:00', close: '23:00' } },
  { name: 'Béns d\'Avall', address: 'Carretera de Sóller, km 13, Bunyola', phone: '+34 971 61 72 08', category: 'restaurants', rating: 4.6, verified: true, location: { lat: 39.6890, lng: 2.6840 }, hours: { open: '13:30', close: '22:00' } },

  // ===== HOTELS =====
  { name: 'Hotel Victoria Gran Meliá', address: 'Avinguda de Gabriel Roca, 29, Palma', phone: '+34 971 73 25 42', website: 'https://www.melia.com', category: 'hotels', rating: 4.6, verified: true, location: { lat: 39.5640, lng: 2.6270 }, hours: { open: '00:00', close: '23:59' } },
  { name: 'Iberostar Selection Llaut Palma', address: 'Passeig de Mallorca, 40, Palma', phone: '+34 971 72 72 72', website: 'https://www.iberostar.com', category: 'hotels', rating: 4.5, verified: true, location: { lat: 39.5710, lng: 2.6490 } },
  { name: 'Hotel Palacio Ca Sa Galesa', address: 'Carrer de Miramar, 8, Palma', phone: '+34 971 71 40 60', category: 'hotels', rating: 4.8, verified: true, location: { lat: 39.5695, lng: 2.6460 } },
  { name: 'Hoposa Uyal', address: 'Carrer de Bellavista, 5, Port de Pollença', phone: '+34 971 86 58 00', category: 'hotels', rating: 4.3, verified: true, location: { lat: 39.9080, lng: 3.0800 } },
  { name: 'Zafiro Palace Alcudia', address: 'Carretera d\'Artà, 2, Alcúdia', phone: '+34 971 89 22 11', category: 'hotels', rating: 4.7, verified: true, location: { lat: 39.8520, lng: 3.1210 } },

  // ===== BEACHES =====
  { name: 'Cala Mondragó', address: 'Parque Natural de Mondragó, Santanyí', category: 'beaches', rating: 4.7, verified: true, location: { lat: 39.3490, lng: 3.1850 }, description: 'Beautiful natural beach in a protected park.' },
  { name: 'Playa de Muro', address: 'Platja de Muro, Alcúdia', category: 'beaches', rating: 4.5, verified: true, location: { lat: 39.8030, lng: 3.1180 }, description: 'Long sandy beach with crystal clear water.' },
  { name: 'Cala Figuera', address: 'Cala Figuera, Santanyí', category: 'beaches', rating: 4.4, verified: true, location: { lat: 39.3270, lng: 3.1690 } },
  { name: 'Es Trenc', address: 'Es Trenc, Campos', category: 'beaches', rating: 4.8, verified: true, location: { lat: 39.3330, lng: 2.9870 }, description: 'One of the last unspoiled beaches in Mallorca.' },
  { name: 'Cala Deià', address: 'Cala Deià, Deià', category: 'beaches', rating: 4.6, verified: true, location: { lat: 39.7510, lng: 2.6430 } },

  // ===== ACTIVITIES =====
  { name: 'Katmandu Park', address: 'Avinguda de l\'Olivera, s/n, Magaluf', phone: '+34 971 13 15 00', website: 'https://www.katmandupark.com', category: 'activities', rating: 4.2, verified: true, location: { lat: 39.5090, lng: 2.5350 }, hours: { open: '10:00', close: '18:00' } },
  { name: 'Palma Aquarium', address: 'Carrer de Manuela de los Herreros, 21, Palma', phone: '+34 971 74 61 61', website: 'https://www.palmaaquarium.com', category: 'activities', rating: 4.4, verified: true, location: { lat: 39.5480, lng: 2.6240 }, hours: { open: '09:30', close: '17:30' } },
  { name: 'Western Water Park', address: 'Cala Figuera, s/n, Magaluf', phone: '+34 971 13 12 00', category: 'activities', rating: 4.1, verified: true, location: { lat: 39.5070, lng: 2.5330 }, hours: { open: '10:00', close: '17:00' } },
  { name: 'Hidropark Alcúdia', address: 'Carretera d\'Artà, s/n, Alcúdia', phone: '+34 971 89 12 94', category: 'activities', rating: 4.0, verified: false, location: { lat: 39.84106306472599, lng: 3.1147297263688416 } },

  // ===== SHOPPING =====
  { name: 'Mercat de l\'Olivar', address: 'Plaza de l\'Olivar, s/n, Palma', category: 'shopping', rating: 4.5, verified: true, location: { lat: 39.5715, lng: 2.6500 }, hours: { open: '07:00', close: '14:30' }, description: 'Main market in Palma with fresh produce and local delicacies.' },
  { name: 'Portal de l\'Àngel', address: 'Portal de l\'Àngel, Palma', category: 'shopping', rating: 4.3, verified: true, location: { lat: 39.5700, lng: 2.6470 }, description: 'Main shopping street in Palma city center.' },
  { name: 'Festival Park', address: 'Ctra. de Manacor, km 31, Alaró', phone: '+34 971 51 89 02', category: 'shopping', rating: 4.1, verified: true, location: { lat: 39.6240, lng: 2.7890 }, hours: { open: '10:00', close: '21:00' } },
  { name: 'Fan Mallorca Shopping', address: 'Calle de les Cendrassos, 20, Marratxí', phone: '+34 971 44 11 50', category: 'shopping', rating: 4.0, verified: true, location: { lat: 39.6100, lng: 2.7240 }, hours: { open: '10:00', close: '21:00' } },

  // ===== SERVICES =====
  { name: 'Mallorca Car Service', address: 'Carrer de la Tècnica, 12, Palma', phone: '+34 971 20 30 40', website: 'https://mallorcacarservice.com', category: 'services', rating: 4.4, verified: true, location: { lat: 39.5820, lng: 2.6610 }, hours: { open: '08:00', close: '18:00' } },
  { name: 'Auto Taller Pérez', address: 'Avinguda de l\'Argentina, 45, Palma', phone: '+34 971 25 67 89', category: 'services', rating: 4.0, verified: true, location: { lat: 39.5740, lng: 2.6550 }, hours: { open: '09:00', close: '17:00' } },
  { name: 'Tech Repair Mallorca', address: 'Carrer de Sant Miquel, 33, Palma', phone: '+34 971 71 00 11', category: 'services', rating: 4.2, verified: false, location: { lat: 39.5725, lng: 2.6490 } },
  { name: 'Mestre Rafel Plomero', address: 'Carrer de l\'Hospital, 7, Inca', phone: '+34 971 50 12 34', category: 'services', rating: 4.6, verified: true, location: { lat: 39.7200, lng: 2.9110 } },

  // ===== TRANSPORT =====
  { name: 'Estació Intermodal de Palma', address: 'Plaça d\'Espanya, s/n, Palma', phone: '+34 971 75 99 99', category: 'transport', rating: 4.0, verified: true, location: { lat: 39.5730, lng: 2.6540 }, description: 'Main bus and train station in Palma.' },
  { name: 'Aeroport de Palma', address: 'Carretera de l\'Aeroport, s/n, Palma', phone: '+34 913 21 10 00', website: 'https://www.aena.es', category: 'transport', rating: 4.1, verified: true, location: { lat: 39.5517, lng: 2.7380 } },
  { name: 'Port de Palma', address: 'Moll Vell, s/n, Palma', phone: '+34 971 22 81 50', category: 'transport', rating: 4.2, verified: true, location: { lat: 39.5670, lng: 2.6410 } },
  { name: 'Alquiler de Coches Palma', address: 'Carrer de l\'Argenteria, 5, Palma', phone: '+34 971 72 34 56', category: 'transport', rating: 4.0, verified: true, location: { lat: 39.5690, lng: 2.6440 } },
  { name: 'Taxi Palma Radio', address: 'Carrer de Manacor, 18, Palma', phone: '+34 971 40 14 14', category: 'transport', rating: 3.8, verified: true, location: { lat: 39.5750, lng: 2.6600 } },

  // ===== HEALTH =====
  { name: 'Hospital Universitari Son Espases', address: 'Carretera de Valldemossa, 79, Palma', phone: '+34 871 20 50 00', website: 'https://www.hospitalsonespases.es', category: 'health', rating: 4.0, verified: true, location: { lat: 39.5940, lng: 2.6410 } },
  { name: 'Clínica Juaneda', address: 'Carrer del General Riera, 89, Palma', phone: '+34 971 72 21 00', category: 'health', rating: 4.2, verified: true, location: { lat: 39.5750, lng: 2.6540 } },
  { name: 'Hospital de Inca', address: 'Carrer del General Luque, 171, Inca', phone: '+34 971 88 85 00', category: 'health', rating: 3.9, verified: true, location: { lat: 39.7180, lng: 2.9080 } },
  { name: 'Centre de Salut Manacor', address: 'Carrer de l\'Hospital, s/n, Manacor', phone: '+34 971 55 44 00', category: 'health', rating: 3.8, verified: true, location: { lat: 39.5710, lng: 3.2070 } },

  // ===== PHARMACIES =====
  { name: 'Farmacia Martínez', address: 'Carrer del Sol, 5, Palma', phone: '+34 971 12 34 56', category: 'pharmacies', rating: 4.3, verified: true, location: { lat: 39.5696, lng: 2.6502 }, hours: { open: '09:00', close: '21:00' } },
  { name: 'Farmacia Central', address: 'Avinguda de l\'Argentina, 10, Palma', phone: '+34 971 65 43 21', category: 'pharmacies', rating: 4.1, verified: true, location: { lat: 39.5715, lng: 2.6479 } },
  { name: 'Farmacia Llevant', address: 'Carrer dels Socors, 22, Palma', phone: '+34 971 78 90 12', category: 'pharmacies', rating: 4.0, verified: true, location: { lat: 39.5678, lng: 2.6550 } },
  { name: 'Farmacia Alcúdia', address: 'Carrer del Comerç, 12, Alcúdia', phone: '+34 971 54 67 89', category: 'pharmacies', rating: 4.2, verified: true, location: { lat: 39.8530, lng: 3.1200 } },

  // ===== POLICE & EMERGENCY =====
  { name: 'Policia Nacional - Comissaria de Palma', address: 'Carrer de l\'Uruguai, s/n, Palma', phone: '+34 971 22 55 00', category: 'police', verified: true, location: { lat: 39.5750, lng: 2.6580 } },
  { name: 'Policia Local de Palma', address: 'Carrer de la Germanor, 18, Palma', phone: '+34 971 22 55 55', category: 'police', verified: true, location: { lat: 39.5730, lng: 2.6520 } },
  { name: 'Guardia Civil - Comandancia de Palma', address: 'Avinguda de Jaume III, 26, Palma', phone: '+34 971 22 50 00', category: 'police', verified: true, location: { lat: 39.5690, lng: 2.6440 } },
  { name: 'Protecció Civil Mallorca', address: 'Carrer de la Reina Esclaramunda, 2, Palma', phone: '+34 971 21 60 00', category: 'police', verified: true, location: { lat: 39.5720, lng: 2.6490 } },

  // ===== GAS STATIONS =====
  { name: 'Repsol - Plaça d\'Espanya', address: 'Plaça d\'Espanya, 1, Palma', phone: '+34 971 72 10 10', category: 'gasstations', rating: 4.0, verified: true, location: { lat: 39.5735, lng: 2.6545 } },
  { name: 'Cepsa - Avinguda de Mallorca', address: 'Avinguda de Mallorca, 55, Palma', phone: '+34 971 71 50 20', category: 'gasstations', rating: 3.9, verified: true, location: { lat: 39.5760, lng: 2.6560 } },
  { name: 'BP - Inca', address: 'Carretera de Palma, 103, Inca', phone: '+34 971 50 00 30', category: 'gasstations', rating: 4.1, verified: true, location: { lat: 39.7160, lng: 2.9100 } },
  { name: 'Galp - Autopista de Llevant, Manacor', address: 'Autopista de Llevant, km 45, Manacor', category: 'gasstations', rating: 4.0, verified: false, location: { lat: 39.5730, lng: 3.2100 } },

  // ===== VETERINARIANS =====
  { name: 'Clínica Veterinària Palma', address: 'Carrer de l\'Om, 15, Palma', phone: '+34 971 71 80 80', category: 'veterinarians', rating: 4.5, verified: true, location: { lat: 39.5700, lng: 2.6480 }, hours: { open: '09:00', close: '19:00' } },
  { name: 'VetMallorca Hospital', address: 'Carrer de la Verge del Miracle, 8, Palma', phone: '+34 971 45 78 90', category: 'veterinarians', rating: 4.3, verified: true, location: { lat: 39.5760, lng: 2.6600 } },
  { name: 'Centre Veterinari d\'Inca', address: 'Passeig de les Roques, 22, Inca', phone: '+34 971 88 22 33', category: 'veterinarians', rating: 4.4, verified: true, location: { lat: 39.7190, lng: 2.9090 } },
  { name: 'Veterinària Alcúdia', address: 'Carrer de l\'Església, 5, Alcúdia', phone: '+34 971 89 13 21', category: 'veterinarians', rating: 4.2, verified: true, location: { lat: 39.8510, lng: 3.1220 } },

  // ===== CAFES =====
  { name: "Ca'n Joan de s'Aigo", address: 'Carrer del Baró de Santa Maria del Sepulcre, 10, Palma', phone: '+34 971 71 07 59', category: 'cafes', rating: 4.5, verified: true, location: { lat: 39.5705, lng: 2.6480 }, hours: { open: '08:00', close: '23:00' }, description: 'Traditional Mallorcan bakery and café since 1700.' },
  { name: 'Café Europeo', address: "Plaça de la Reina, 3, Palma", phone: '+34 971 71 75 90', category: 'cafes', rating: 4.3, verified: true, location: { lat: 39.5690, lng: 2.6465 }, hours: { open: '07:00', close: '22:00' } },
  { name: 'Cappuccino Café', address: 'Passeig del Born, 20, Palma', phone: '+34 971 72 99 99', category: 'cafes', rating: 4.1, verified: true, location: { lat: 39.5688, lng: 2.6440 }, hours: { open: '08:00', close: '21:00' } },
  { name: 'Café de la Mar', address: 'Carrer de la Marina, 3, Port de Pollença', phone: '+34 971 86 54 32', category: 'cafes', rating: 4.4, verified: true, location: { lat: 39.9085, lng: 3.0810 } },

  // ===== PARKS & GARDENS =====
  { name: 'Parc de la Mar', address: 'Avinguda de Gabriel Roca, s/n, Palma', category: 'parks', rating: 4.5, verified: true, location: { lat: 39.5650, lng: 2.6420 }, description: 'Beautiful park by the sea beneath Palma Cathedral.' },
  { name: "Jardí Botànic de Sóller", address: 'Carretera de Palma, s/n, Sóller', phone: '+34 971 63 43 45', category: 'parks', rating: 4.3, verified: true, location: { lat: 39.7660, lng: 2.7050 }, hours: { open: '10:00', close: '18:00' } },
  { name: 'Parc de Sa Riera', address: 'Carrer de Sa Riera, 2, Palma', category: 'parks', rating: 4.2, verified: true, location: { lat: 39.5710, lng: 2.6540 } },
  { name: 'Sa Bassa Blanca Park', address: "Carretera d'Alcúdia, km 2, Port d'Alcúdia", category: 'parks', rating: 4.4, verified: true, location: { lat: 39.8350, lng: 3.1300 } },
  { name: "Parc Natural de s'Albufera", address: "Carretera d'Artà, km 6, Muro", phone: '+34 971 89 22 55', category: 'parks', rating: 4.6, verified: true, location: { lat: 39.7800, lng: 3.1100 }, description: 'Protected wetland nature reserve.' },

  // ===== SUPERMARKETS =====
  { name: 'Mercadona - Palma Centre', address: 'Avinguda de Joan Miró, 120, Palma', phone: '+34 971 73 21 00', category: 'supermarkets', rating: 4.1, verified: true, location: { lat: 39.5620, lng: 2.6310 }, hours: { open: '09:00', close: '21:30' } },
  { name: 'Carrefour - Porto Pi', address: 'Centre Comercial Porto Pi, Palma', phone: '+34 971 40 44 00', category: 'supermarkets', rating: 4.0, verified: true, location: { lat: 39.5580, lng: 2.6280 }, hours: { open: '09:00', close: '21:00' } },
  { name: 'Lidl - Inca', address: 'Carrer de la Lluna, 5, Inca', phone: '+34 971 88 11 22', category: 'supermarkets', rating: 4.2, verified: true, location: { lat: 39.7170, lng: 2.9120 }, hours: { open: '08:30', close: '21:30' } },
  { name: 'Aldi - Manacor', address: 'Avinguda del Torrent, 33, Manacor', category: 'supermarkets', rating: 4.0, verified: true, location: { lat: 39.5720, lng: 3.2050 }, hours: { open: '09:00', close: '21:00' } },
  { name: 'Eroski - Alcúdia', address: "Carretera d'Artà, 45, Alcúdia", phone: '+34 971 89 45 67', category: 'supermarkets', rating: 3.9, verified: true, location: { lat: 39.8500, lng: 3.1240 }, hours: { open: '08:30', close: '21:30' } },

  // ===== BANKS & ATMS =====
  { name: 'Banco Santander - Palma Centre', address: 'Plaça de Cort, 1, Palma', phone: '+34 971 72 90 10', category: 'banks', rating: 3.8, verified: true, location: { lat: 39.5698, lng: 2.6485 }, hours: { open: '08:15', close: '14:00' } },
  { name: 'CaixaBank - Avinguda Argentina', address: 'Avinguda de l\'Argentina, 30, Palma', phone: '+34 971 22 30 40', category: 'banks', verified: true, location: { lat: 39.5725, lng: 2.6510 }, hours: { open: '08:30', close: '14:15' } },
  { name: 'BBVA - Inca', address: "Plaça d'Espanya, 7, Inca", phone: '+34 971 50 10 20', category: 'banks', verified: true, location: { lat: 39.7200, lng: 2.9100 }, hours: { open: '08:30', close: '14:00' } },
  { name: 'Sabadell - Manacor', address: 'Carrer dels Ferrers, 12, Manacor', phone: '+34 971 55 77 88', category: 'banks', verified: true, location: { lat: 39.5700, lng: 3.2080 } },

  // ===== POST OFFICE =====
  { name: 'Correos - Palma Central', address: 'Carrer de la Germanor, 21, Palma', phone: '+34 971 22 11 33', category: 'postoffice', rating: 3.7, verified: true, location: { lat: 39.5730, lng: 2.6530 }, hours: { open: '08:30', close: '20:30' } },
  { name: 'Correos - Inca', address: 'Carrer del General Luque, 50, Inca', phone: '+34 971 50 20 30', category: 'postoffice', verified: true, location: { lat: 39.7180, lng: 2.9090 }, hours: { open: '08:30', close: '14:30' } },
  { name: 'Correos - Manacor', address: "Carrer de l'Hospital, 2, Manacor", phone: '+34 971 55 33 44', category: 'postoffice', verified: true, location: { lat: 39.5715, lng: 3.2060 }, hours: { open: '08:30', close: '14:30' } },
  { name: 'Correos - Alcúdia', address: 'Carrer del Comerç, 5, Alcúdia', phone: '+34 971 89 00 11', category: 'postoffice', verified: true, location: { lat: 39.8530, lng: 3.1210 }, hours: { open: '09:00', close: '13:00' } },
];

async function seedDatabase() {
  console.log(`Seeding ${businesses.length} businesses...`);
  let count = 0;
  for (const b of businesses) {
    try {
      await addDoc(collection(db, 'businesses'), {
        ...b,
        source: 'seed',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      count++;
      if (count % 10 === 0) console.log(`  ${count}/${businesses.length} done`);
    } catch (e) {
      console.error(`  Error adding "${b.name}":`, e.message);
    }
  }
  console.log(`✅ Done! ${count}/${businesses.length} businesses imported.`);
  process.exit(0);
}

seedDatabase();
