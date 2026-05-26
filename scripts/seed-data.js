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
  // ==========================================
  // RESTAURANTS
  // ==========================================
  { name: "Ca'n Joan de s'Aigo", area: 'Palma', address: 'Carrer del Baró de Santa Maria del Sepulcre, 10, Palma', phone: '+34 971 71 07 59', category: 'restaurants', rating: 4.5, verified: true, location: { lat: 39.5705, lng: 2.6480 }, hours: { open: '08:00', close: '23:00' }, description: 'Traditional Mallorcan bakery and café since 1700. Famous for ensaimadas and hot chocolate.' },
  { name: 'El Camino Restaurant', area: 'Palma', address: 'Plaça de la Llotja, 4, Palma', phone: '+34 971 72 08 16', website: 'https://elcaminopalma.com', category: 'restaurants', rating: 4.7, verified: true, location: { lat: 39.5685, lng: 2.6455 }, hours: { open: '13:00', close: '23:00' }, description: 'Modern Mediterranean cuisine in the heart of Palma.' },
  { name: 'Adriano', area: 'Santanyí', address: 'Calle del Mar, 9, Cala d\'Or', phone: '+34 971 64 01 50', category: 'restaurants', rating: 4.3, verified: true, location: { lat: 39.3790, lng: 3.2330 }, hours: { open: '12:00', close: '22:30' }, description: 'Italian restaurant with sea views.' },
  { name: "Restaurant Es Racó d'es Teix", area: 'Deià', address: 'Carretera de Deià, s/n, Deià', phone: '+34 971 63 90 61', category: 'restaurants', rating: 4.8, verified: true, location: { lat: 39.7480, lng: 2.6490 }, hours: { open: '19:00', close: '22:00' }, description: 'Michelin-starred restaurant in the Tramuntana mountains.' },
  { name: 'La Parada del Mar', area: 'Palma', address: 'Passeig Marítim, 42, Palma', phone: '+34 971 45 67 89', category: 'restaurants', rating: 4.2, verified: false, location: { lat: 39.5630, lng: 2.6340 }, hours: { open: '12:00', close: '23:00' } },
  { name: 'Béns d\'Avall', area: 'Bunyola', address: 'Carretera de Sóller, km 13, Bunyola', phone: '+34 971 61 72 08', category: 'restaurants', rating: 4.6, verified: true, location: { lat: 39.6890, lng: 2.6840 }, hours: { open: '13:30', close: '22:00' } },
  { name: 'Tristán', area: 'Port d\'Andratx', address: 'Carrer del Port, s/n, Port d\'Andratx', phone: '+34 971 67 20 12', category: 'restaurants', rating: 4.7, verified: true, location: { lat: 39.5440, lng: 2.3880 }, hours: { open: '13:00', close: '22:30' }, description: 'Michelin-starred seaside restaurant.' },
  { name: 'Restaurant Ca Na Toneta', area: 'Santa Maria del Camí', address: 'Carrer de la Llibertat, 11, Santa Maria del Camí', phone: '+34 971 62 61 00', category: 'restaurants', rating: 4.6, verified: true, location: { lat: 39.6510, lng: 2.7700 }, hours: { open: '13:30', close: '21:30' }, description: 'Farm-to-table traditional Mallorcan cuisine.' },
  { name: 'Foravila', area: 'Palma', address: 'Carrer de Can Sales, 18, Palma', phone: '+34 971 72 39 92', category: 'restaurants', rating: 4.4, verified: true, location: { lat: 39.5700, lng: 2.6460 }, hours: { open: '13:00', close: '23:00' } },
  { name: 'Merkat 1930', area: 'Palma', address: 'Carrer de la Unió, 6, Palma', phone: '+34 871 53 53 30', category: 'restaurants', rating: 4.3, verified: true, location: { lat: 39.5690, lng: 2.6475 }, hours: { open: '12:00', close: '00:00' }, description: 'Gourmet food market with multiple tapas stalls.' },
  { name: 'Pizzeria La Casita', area: 'Santa Ponsa', address: 'Carrer de les Gavines, 3, Santa Ponça', phone: '+34 971 69 45 00', category: 'restaurants', rating: 4.1, verified: true, location: { lat: 39.5180, lng: 2.4770 }, hours: { open: '12:00', close: '23:00' } },
  { name: 'Sa Foradada', area: 'Deià', address: 'Carretera de Valldemossa a Deià, s/n, Deià', phone: '+34 971 63 93 13', category: 'restaurants', rating: 4.5, verified: true, location: { lat: 39.7550, lng: 2.6380 }, hours: { open: '13:00', close: '17:00' } },

  // ==========================================
  // CAFES
  // ==========================================
  { name: "Ca'n Joan de s'Aigo", area: 'Palma', address: 'Carrer del Baró de Santa Maria del Sepulcre, 10, Palma', phone: '+34 971 71 07 59', category: 'cafes', rating: 4.5, verified: true, location: { lat: 39.5705, lng: 2.6480 }, hours: { open: '08:00', close: '23:00' }, description: 'Traditional Mallorcan bakery and café since 1700.' },
  { name: 'Café Europeo', area: 'Palma', address: "Plaça de la Reina, 3, Palma", phone: '+34 971 71 75 90', category: 'cafes', rating: 4.3, verified: true, location: { lat: 39.5690, lng: 2.6465 }, hours: { open: '07:00', close: '22:00' } },
  { name: 'Cappuccino Café', area: 'Palma', address: 'Passeig del Born, 20, Palma', phone: '+34 971 72 99 99', category: 'cafes', rating: 4.1, verified: true, location: { lat: 39.5688, lng: 2.6440 }, hours: { open: '08:00', close: '21:00' } },
  { name: 'Café de la Mar', area: 'Pollença', address: 'Carrer de la Marina, 3, Port de Pollença', phone: '+34 971 86 54 32', category: 'cafes', rating: 4.4, verified: true, location: { lat: 39.9085, lng: 3.0810 } },
  { name: 'Café Milano', area: 'Santa Ponsa', address: 'Avinguda de Santa Ponça, 25, Santa Ponça', phone: '+34 971 69 00 11', category: 'cafes', rating: 4.0, verified: true, location: { lat: 39.5150, lng: 2.4750 } },
  { name: 'Café Sóller', area: 'Sóller', address: 'Plaça de la Constitució, 10, Sóller', phone: '+34 971 63 00 88', category: 'cafes', rating: 4.2, verified: true, location: { lat: 39.7670, lng: 2.7140 }, hours: { open: '08:00', close: '20:00' } },
  { name: 'Sa Teulera Cafe', area: 'Inca', address: 'Plaça d\'Espanya, 2, Inca', phone: '+34 971 50 55 66', category: 'cafes', rating: 4.1, verified: true, location: { lat: 39.7190, lng: 2.9110 } },

  // ==========================================
  // HOTELS
  // ==========================================
  { name: 'Hotel Victoria Gran Meliá', area: 'Palma', address: 'Avinguda de Gabriel Roca, 29, Palma', phone: '+34 971 73 25 42', website: 'https://www.melia.com', category: 'hotels', rating: 4.6, verified: true, location: { lat: 39.5640, lng: 2.6270 } },
  { name: 'Iberostar Selection Llaut Palma', area: 'Palma', address: 'Passeig de Mallorca, 40, Palma', phone: '+34 971 72 72 72', website: 'https://www.iberostar.com', category: 'hotels', rating: 4.5, verified: true, location: { lat: 39.5710, lng: 2.6490 } },
  { name: 'Hotel Palacio Ca Sa Galesa', area: 'Palma', address: 'Carrer de Miramar, 8, Palma', phone: '+34 971 71 40 60', category: 'hotels', rating: 4.8, verified: true, location: { lat: 39.5695, lng: 2.6460 } },
  { name: 'Hoposa Uyal', area: 'Pollença', address: 'Carrer de Bellavista, 5, Port de Pollença', phone: '+34 971 86 58 00', category: 'hotels', rating: 4.3, verified: true, location: { lat: 39.9080, lng: 3.0800 } },
  { name: 'Zafiro Palace Alcudia', area: 'Alcúdia', address: 'Carretera d\'Artà, 2, Alcúdia', phone: '+34 971 89 22 11', category: 'hotels', rating: 4.7, verified: true, location: { lat: 39.8520, lng: 3.1210 } },
  { name: 'Hotel Valldemossa', area: 'Valldemossa', address: 'Plaça de la Cartoixa, 7, Valldemossa', phone: '+34 971 61 23 06', category: 'hotels', rating: 4.4, verified: true, location: { lat: 39.7100, lng: 2.6230 } },
  { name: 'Cap Rocat', area: 'Palma', address: 'Carretera d\'Andratx, s/n, Cala Blava', phone: '+34 971 74 77 77', website: 'https://www.caprocat.com', category: 'hotels', rating: 4.9, verified: true, location: { lat: 39.5250, lng: 2.5680 }, description: 'Luxury hotel in a former military fortress.' },
  { name: 'Jumeirah Port Soller', area: 'Sóller', address: 'Carrer de la Marina, 1, Port de Sóller', phone: '+34 971 63 79 00', category: 'hotels', rating: 4.6, verified: true, location: { lat: 39.7980, lng: 2.6880 } },
  { name: 'Hotel Bendinat', area: 'Calvià', address: 'Carrer de Bendinat, 1, Bendinat', phone: '+34 971 40 25 00', category: 'hotels', rating: 4.5, verified: true, location: { lat: 39.5530, lng: 2.5920 } },

  // ==========================================
  // BEACHES
  // ==========================================
  { name: 'Cala Mondragó', area: 'Santanyí', address: 'Parque Natural de Mondragó, Santanyí', category: 'beaches', rating: 4.7, verified: true, location: { lat: 39.3490, lng: 3.1850 }, description: 'Beautiful natural beach in a protected park.' },
  { name: 'Playa de Muro', area: 'Muro', address: 'Platja de Muro, Alcúdia', category: 'beaches', rating: 4.5, verified: true, location: { lat: 39.8030, lng: 3.1180 } },
  { name: 'Cala Figuera', area: 'Santanyí', address: 'Cala Figuera, Santanyí', category: 'beaches', rating: 4.4, verified: true, location: { lat: 39.3270, lng: 3.1690 } },
  { name: 'Es Trenc', area: 'Campos', address: 'Es Trenc, Campos', category: 'beaches', rating: 4.8, verified: true, location: { lat: 39.3330, lng: 2.9870 }, description: 'One of the last unspoiled beaches in Mallorca.' },
  { name: 'Cala Deià', area: 'Deià', address: 'Cala Deià, Deià', category: 'beaches', rating: 4.6, verified: true, location: { lat: 39.7510, lng: 2.6430 } },
  { name: 'Cala Llombards', area: 'Santanyí', address: 'Cala Llombards, Santanyí', category: 'beaches', rating: 4.5, verified: true, location: { lat: 39.3150, lng: 3.1220 } },
  { name: 'Platja de Ses Illetes', area: 'Ses Salines', address: 'Platja de Ses Illetes, Ses Salines', category: 'beaches', rating: 4.7, verified: true, location: { lat: 39.2940, lng: 2.9370 }, description: 'Caribbean-style white sand beach on Formentera.' },
  { name: 'Cala Major', area: 'Palma', address: 'Cala Major, Palma', category: 'beaches', rating: 4.0, verified: true, location: { lat: 39.5460, lng: 2.6100 } },
  { name: 'Platja de Palma', area: 'Palma', address: 'Platja de Palma, s\'Arenal', category: 'beaches', rating: 4.1, verified: true, location: { lat: 39.5300, lng: 2.7100 } },
  { name: 'Cala Agulla', area: 'Capdepera', address: 'Cala Agulla, Capdepera', category: 'beaches', rating: 4.6, verified: true, location: { lat: 39.7100, lng: 3.4650 } },
  { name: 'Cala Mesquida', area: 'Capdepera', address: 'Cala Mesquida, Capdepera', category: 'beaches', rating: 4.5, verified: true, location: { lat: 39.7180, lng: 3.4250 } },
  { name: 'Cala Varques', area: 'Manacor', address: 'Cala Varques, Manacor', category: 'beaches', rating: 4.6, verified: true, location: { lat: 39.4750, lng: 3.2830 }, description: 'Secluded virgin beach accessible by foot.' },
  { name: 'Port de Cristo', area: 'Manacor', address: 'Port de Cristo, Manacor', category: 'beaches', rating: 4.3, verified: true, location: { lat: 39.5400, lng: 3.3300 } },

  // ==========================================
  // ACTIVITIES
  // ==========================================
  { name: 'Katmandu Park', area: 'Calvià', address: 'Avinguda de l\'Olivera, s/n, Magaluf', phone: '+34 971 13 15 00', website: 'https://www.katmandupark.com', category: 'activities', rating: 4.2, verified: true, location: { lat: 39.5090, lng: 2.5350 }, hours: { open: '10:00', close: '18:00' } },
  { name: 'Palma Aquarium', area: 'Palma', address: 'Carrer de Manuela de los Herreros, 21, Palma', phone: '+34 971 74 61 61', website: 'https://www.palmaaquarium.com', category: 'activities', rating: 4.4, verified: true, location: { lat: 39.5480, lng: 2.6240 }, hours: { open: '09:30', close: '17:30' } },
  { name: 'Western Water Park', area: 'Calvià', address: 'Cala Figuera, s/n, Magaluf', phone: '+34 971 13 12 00', category: 'activities', rating: 4.1, verified: true, location: { lat: 39.5070, lng: 2.5330 }, hours: { open: '10:00', close: '17:00' } },
  { name: 'Hidropark Alcúdia', area: 'Alcúdia', address: 'Carretera d\'Artà, s/n, Alcúdia', phone: '+34 971 89 12 94', category: 'activities', rating: 4.0, verified: false, location: { lat: 39.8411, lng: 3.1147 } },
  { name: 'Golf Son Vida', area: 'Palma', address: 'Camí de Son Vida, s/n, Palma', phone: '+34 971 79 07 80', category: 'activities', rating: 4.5, verified: true, location: { lat: 39.5900, lng: 2.6000 }, description: 'One of the oldest golf courses in Spain.' },
  { name: 'La Reserva Club', area: 'Calvià', address: 'Ctra. Ma-10, km 10, Calvià', phone: '+34 971 49 99 00', category: 'activities', rating: 4.6, verified: true, location: { lat: 39.5600, lng: 2.5000 } },
  { name: 'Cuevas del Drach', area: 'Manacor', address: 'Carretera de les Coves, s/n, Porto Cristo', phone: '+34 971 82 07 53', website: 'https://www.cuevasdeldrach.com', category: 'activities', rating: 4.3, verified: true, location: { lat: 39.5440, lng: 3.3340 }, description: 'Famous underground caves with underground lake.' },
  { name: 'Cuevas de Artà', area: 'Capdepera', address: 'Carretera de Cuevas, s/n, Capdepera', phone: '+34 971 84 12 93', category: 'activities', rating: 4.4, verified: true, location: { lat: 39.7000, lng: 3.4480 } },

  // ==========================================
  // SHOPPING
  // ==========================================
  { name: 'Mercat de l\'Olivar', area: 'Palma', address: 'Plaza de l\'Olivar, s/n, Palma', category: 'shopping', rating: 4.5, verified: true, location: { lat: 39.5715, lng: 2.6500 }, hours: { open: '07:00', close: '14:30' }, description: 'Main market in Palma with fresh produce and local delicacies.' },
  { name: 'Portal de l\'Àngel', area: 'Palma', address: 'Portal de l\'Àngel, Palma', category: 'shopping', rating: 4.3, verified: true, location: { lat: 39.5700, lng: 2.6470 }, description: 'Main shopping street in Palma city center.' },
  { name: 'Festival Park', area: 'Alaró', address: 'Ctra. de Manacor, km 31, Alaró', phone: '+34 971 51 89 02', category: 'shopping', rating: 4.1, verified: true, location: { lat: 39.6240, lng: 2.7890 }, hours: { open: '10:00', close: '21:00' } },
  { name: 'Fan Mallorca Shopping', area: 'Marratxí', address: 'Calle de les Cendrassos, 20, Marratxí', phone: '+34 971 44 11 50', category: 'shopping', rating: 4.0, verified: true, location: { lat: 39.6100, lng: 2.7240 }, hours: { open: '10:00', close: '21:00' } },
  { name: 'Porto Pi Centro Comercial', area: 'Palma', address: 'Avinguda de Gabriel Roca, 54, Palma', phone: '+34 971 40 44 00', category: 'shopping', rating: 4.0, verified: true, location: { lat: 39.5580, lng: 2.6280 }, hours: { open: '09:30', close: '21:30' } },
  { name: 'Mercat de Santa Catalina', area: 'Palma', address: 'Plaça de la Navegació, s/n, Palma', category: 'shopping', rating: 4.4, verified: true, location: { lat: 39.5695, lng: 2.6410 }, hours: { open: '07:00', close: '15:00' } },

  // ==========================================
  // SUPERMARKETS
  // ==========================================
  { name: 'Mercadona - Palma Centre', area: 'Palma', address: 'Avinguda de Joan Miró, 120, Palma', phone: '+34 971 73 21 00', category: 'supermarkets', rating: 4.1, verified: true, location: { lat: 39.5620, lng: 2.6310 }, hours: { open: '09:00', close: '21:30' } },
  { name: 'Carrefour - Porto Pi', area: 'Palma', address: 'Centre Comercial Porto Pi, Palma', phone: '+34 971 40 44 00', category: 'supermarkets', rating: 4.0, verified: true, location: { lat: 39.5580, lng: 2.6280 }, hours: { open: '09:00', close: '21:00' } },
  { name: 'Lidl - Inca', area: 'Inca', address: 'Carrer de la Lluna, 5, Inca', phone: '+34 971 88 11 22', category: 'supermarkets', rating: 4.2, verified: true, location: { lat: 39.7170, lng: 2.9120 }, hours: { open: '08:30', close: '21:30' } },
  { name: 'Aldi - Manacor', area: 'Manacor', address: 'Avinguda del Torrent, 33, Manacor', category: 'supermarkets', rating: 4.0, verified: true, location: { lat: 39.5720, lng: 3.2050 }, hours: { open: '09:00', close: '21:00' } },
  { name: 'Eroski - Alcúdia', area: 'Alcúdia', address: "Carretera d'Artà, 45, Alcúdia", phone: '+34 971 89 45 67', category: 'supermarkets', rating: 3.9, verified: true, location: { lat: 39.8500, lng: 3.1240 }, hours: { open: '08:30', close: '21:30' } },
  { name: 'Mercadona - Calvià', area: 'Calvià', address: 'Avinguda de Calvià, 45, Calvià', phone: '+34 971 67 89 00', category: 'supermarkets', rating: 4.0, verified: true, location: { lat: 39.5480, lng: 2.5200 }, hours: { open: '09:00', close: '21:30' } },
  { name: 'Lidl - Alcúdia', area: 'Alcúdia', address: 'Carrer de l\'Església, 10, Alcúdia', phone: '+34 971 89 99 88', category: 'supermarkets', rating: 4.1, verified: true, location: { lat: 39.8520, lng: 3.1230 }, hours: { open: '09:00', close: '21:30' } },

  // ==========================================
  // SERVICES
  // ==========================================
  { name: 'Mallorca Car Service', area: 'Palma', address: 'Carrer de la Tècnica, 12, Palma', phone: '+34 971 20 30 40', website: 'https://mallorcacarservice.com', category: 'services', rating: 4.4, verified: true, location: { lat: 39.5820, lng: 2.6610 }, hours: { open: '08:00', close: '18:00' } },
  { name: 'Auto Taller Pérez', area: 'Palma', address: 'Avinguda de l\'Argentina, 45, Palma', phone: '+34 971 25 67 89', category: 'services', rating: 4.0, verified: true, location: { lat: 39.5740, lng: 2.6550 }, hours: { open: '09:00', close: '17:00' } },
  { name: 'Tech Repair Mallorca', area: 'Palma', address: 'Carrer de Sant Miquel, 33, Palma', phone: '+34 971 71 00 11', category: 'services', rating: 4.2, verified: false, location: { lat: 39.5725, lng: 2.6490 } },
  { name: 'Mestre Rafel Plomero', area: 'Inca', address: 'Carrer de l\'Hospital, 7, Inca', phone: '+34 971 50 12 34', category: 'services', rating: 4.6, verified: true, location: { lat: 39.7200, lng: 2.9110 } },
  { name: 'Rent a Car Manacor', area: 'Manacor', address: 'Avinguda del Torrent, 12, Manacor', phone: '+34 971 55 22 33', category: 'services', rating: 4.0, verified: true, location: { lat: 39.5730, lng: 3.2060 } },
  { name: 'Lavandería Palma', area: 'Palma', address: 'Carrer de l\'Om, 22, Palma', phone: '+34 971 72 11 22', category: 'services', rating: 4.0, verified: true, location: { lat: 39.5710, lng: 2.6490 } },
  { name: 'Talleres Alcúdia', area: 'Alcúdia', address: 'Carretera d\'Artà, 32, Alcúdia', phone: '+34 971 89 11 22', category: 'services', rating: 4.1, verified: true, location: { lat: 39.8490, lng: 3.1270 } },

  // ==========================================
  // TRANSPORT
  // ==========================================
  { name: 'Estació Intermodal de Palma', area: 'Palma', address: 'Plaça d\'Espanya, s/n, Palma', phone: '+34 971 75 99 99', category: 'transport', rating: 4.0, verified: true, location: { lat: 39.5730, lng: 2.6540 }, description: 'Main bus and train station in Palma.' },
  { name: 'Aeroport de Palma', area: 'Palma', address: 'Carretera de l\'Aeroport, s/n, Palma', phone: '+34 913 21 10 00', website: 'https://www.aena.es', category: 'transport', rating: 4.1, verified: true, location: { lat: 39.5517, lng: 2.7380 }, description: 'Palma de Mallorca International Airport (PMI).' },
  { name: 'Port de Palma', area: 'Palma', address: 'Moll Vell, s/n, Palma', phone: '+34 971 22 81 50', category: 'transport', rating: 4.2, verified: true, location: { lat: 39.5670, lng: 2.6410 } },
  { name: 'Alquiler de Coches Palma', area: 'Palma', address: 'Carrer de l\'Argenteria, 5, Palma', phone: '+34 971 72 34 56', category: 'transport', rating: 4.0, verified: true, location: { lat: 39.5690, lng: 2.6440 } },
  { name: 'Taxi Palma Radio', area: 'Palma', address: 'Carrer de Manacor, 18, Palma', phone: '+34 971 40 14 14', category: 'transport', rating: 3.8, verified: true, location: { lat: 39.5750, lng: 2.6600 } },
  { name: 'Estació de Tren de Inca', area: 'Inca', address: 'Carrer de l\'Estació, 1, Inca', phone: '+34 971 50 20 00', category: 'transport', rating: 3.8, verified: true, location: { lat: 39.7190, lng: 2.9110 } },
  { name: 'Port d\'Alcúdia', area: 'Alcúdia', address: 'Moll Comercial, s/n, Port d\'Alcúdia', phone: '+34 971 54 71 00', category: 'transport', rating: 4.0, verified: true, location: { lat: 39.8370, lng: 3.1320 } },

  // ==========================================
  // HOSPITALS & CLINICS
  // ==========================================
  { name: 'Hospital Universitari Son Espases', area: 'Palma', address: 'Carretera de Valldemossa, 79, Palma', phone: '+34 871 20 50 00', website: 'https://www.hospitalsonespases.es', category: 'health', rating: 4.0, verified: true, location: { lat: 39.5940, lng: 2.6410 } },
  { name: 'Clínica Juaneda', area: 'Palma', address: 'Carrer del General Riera, 89, Palma', phone: '+34 971 72 21 00', category: 'health', rating: 4.2, verified: true, location: { lat: 39.5750, lng: 2.6540 } },
  { name: 'Hospital de Inca', area: 'Inca', address: 'Carrer del General Luque, 171, Inca', phone: '+34 971 88 85 00', category: 'health', rating: 3.9, verified: true, location: { lat: 39.7180, lng: 2.9080 } },
  { name: 'Centre de Salut Manacor', area: 'Manacor', address: 'Carrer de l\'Hospital, s/n, Manacor', phone: '+34 971 55 44 00', category: 'health', rating: 3.8, verified: true, location: { lat: 39.5710, lng: 3.2070 } },
  { name: 'Hospital de Manacor', area: 'Manacor', address: 'Carretera Palma-Manacor, s/n, Manacor', phone: '+34 971 84 71 00', category: 'health', rating: 4.1, verified: true, location: { lat: 39.5700, lng: 3.2050 } },
  { name: 'Clínica Rotger', area: 'Palma', address: 'Carrer del General Vives, 16, Palma', phone: '+34 971 72 00 00', category: 'health', rating: 4.0, verified: true, location: { lat: 39.5730, lng: 2.6510 } },

  // ==========================================
  // PHARMACIES
  // ==========================================
  { name: 'Farmacia Martínez', area: 'Palma', address: 'Carrer del Sol, 5, Palma', phone: '+34 971 12 34 56', category: 'pharmacies', rating: 4.3, verified: true, location: { lat: 39.5696, lng: 2.6502 }, hours: { open: '09:00', close: '21:00' } },
  { name: 'Farmacia Central', area: 'Palma', address: 'Avinguda de l\'Argentina, 10, Palma', phone: '+34 971 65 43 21', category: 'pharmacies', rating: 4.1, verified: true, location: { lat: 39.5715, lng: 2.6479 } },
  { name: 'Farmacia Llevant', area: 'Palma', address: 'Carrer dels Socors, 22, Palma', phone: '+34 971 78 90 12', category: 'pharmacies', rating: 4.0, verified: true, location: { lat: 39.5678, lng: 2.6550 } },
  { name: 'Farmacia Alcúdia', area: 'Alcúdia', address: 'Carrer del Comerç, 12, Alcúdia', phone: '+34 971 54 67 89', category: 'pharmacies', rating: 4.2, verified: true, location: { lat: 39.8530, lng: 3.1200 } },
  { name: 'Farmacia Inca', area: 'Inca', address: 'Plaça d\'Espanya, 5, Inca', phone: '+34 971 88 00 11', category: 'pharmacies', rating: 4.0, verified: true, location: { lat: 39.7180, lng: 2.9100 } },
  { name: 'Farmacia Calvià', area: 'Calvià', address: 'Carrer de la Porrassa, 3, Calvià', phone: '+34 971 67 12 34', category: 'pharmacies', rating: 4.1, verified: true, location: { lat: 39.5470, lng: 2.5180 } },
  { name: 'Farmacia Manacor', area: 'Manacor', address: 'Carrer dels Ferrers, 5, Manacor', phone: '+34 971 55 00 11', category: 'pharmacies', rating: 4.1, verified: true, location: { lat: 39.5695, lng: 3.2075 } },

  // ==========================================
  // POLICE & EMERGENCY
  // ==========================================
  { name: 'Policia Nacional - Comissaria de Palma', area: 'Palma', address: 'Carrer de l\'Uruguai, s/n, Palma', phone: '+34 971 22 55 00', category: 'police', verified: true, location: { lat: 39.5750, lng: 2.6580 } },
  { name: 'Policia Local de Palma', area: 'Palma', address: 'Carrer de la Germanor, 18, Palma', phone: '+34 971 22 55 55', category: 'police', verified: true, location: { lat: 39.5730, lng: 2.6520 } },
  { name: 'Guardia Civil - Comandancia de Palma', area: 'Palma', address: 'Avinguda de Jaume III, 26, Palma', phone: '+34 971 22 50 00', category: 'police', verified: true, location: { lat: 39.5690, lng: 2.6440 } },
  { name: 'Protecció Civil Mallorca', area: 'Palma', address: 'Carrer de la Reina Esclaramunda, 2, Palma', phone: '+34 971 21 60 00', category: 'police', verified: true, location: { lat: 39.5720, lng: 2.6490 } },
  { name: 'Policia Local d\'Inca', area: 'Inca', address: 'Carrer del General Luque, 180, Inca', phone: '+34 971 88 55 22', category: 'police', verified: true, location: { lat: 39.7180, lng: 2.9080 } },
  { name: 'Guardia Civil - Inca', area: 'Inca', address: 'Avinguda del General Luque, s/n, Inca', phone: '+34 971 50 40 00', category: 'police', verified: true, location: { lat: 39.7170, lng: 2.9090 } },

  // ==========================================
  // GAS STATIONS
  // ==========================================
  { name: 'Repsol - Plaça d\'Espanya', area: 'Palma', address: 'Plaça d\'Espanya, 1, Palma', phone: '+34 971 72 10 10', category: 'gasstations', rating: 4.0, verified: true, location: { lat: 39.5735, lng: 2.6545 } },
  { name: 'Cepsa - Avinguda de Mallorca', area: 'Palma', address: 'Avinguda de Mallorca, 55, Palma', phone: '+34 971 71 50 20', category: 'gasstations', rating: 3.9, verified: true, location: { lat: 39.5760, lng: 2.6560 } },
  { name: 'BP - Inca', area: 'Inca', address: 'Carretera de Palma, 103, Inca', phone: '+34 971 50 00 30', category: 'gasstations', rating: 4.1, verified: true, location: { lat: 39.7160, lng: 2.9100 } },
  { name: 'Galp - Autopista de Llevant, Manacor', area: 'Manacor', address: 'Autopista de Llevant, km 45, Manacor', category: 'gasstations', rating: 4.0, verified: false, location: { lat: 39.5730, lng: 3.2100 } },
  { name: 'Repsol - Alcúdia', area: 'Alcúdia', address: 'Carretera d\'Artà, 55, Alcúdia', phone: '+34 971 89 33 44', category: 'gasstations', rating: 4.0, verified: true, location: { lat: 39.8510, lng: 3.1250 } },

  // ==========================================
  // VETERINARIANS
  // ==========================================
  { name: 'Clínica Veterinària Palma', area: 'Palma', address: 'Carrer de l\'Om, 15, Palma', phone: '+34 971 71 80 80', category: 'veterinarians', rating: 4.5, verified: true, location: { lat: 39.5700, lng: 2.6480 }, hours: { open: '09:00', close: '19:00' } },
  { name: 'VetMallorca Hospital', area: 'Palma', address: 'Carrer de la Verge del Miracle, 8, Palma', phone: '+34 971 45 78 90', category: 'veterinarians', rating: 4.3, verified: true, location: { lat: 39.5760, lng: 2.6600 } },
  { name: 'Centre Veterinari d\'Inca', area: 'Inca', address: 'Passeig de les Roques, 22, Inca', phone: '+34 971 88 22 33', category: 'veterinarians', rating: 4.4, verified: true, location: { lat: 39.7190, lng: 2.9090 } },
  { name: 'Veterinària Alcúdia', area: 'Alcúdia', address: 'Carrer de l\'Església, 5, Alcúdia', phone: '+34 971 89 13 21', category: 'veterinarians', rating: 4.2, verified: true, location: { lat: 39.8510, lng: 3.1220 } },
  { name: 'Clínica Veterinària Manacor', area: 'Manacor', address: 'Carrer de la Riera, 33, Manacor', phone: '+34 971 55 66 77', category: 'veterinarians', rating: 4.0, verified: true, location: { lat: 39.5705, lng: 3.2080 } },

  // ==========================================
  // BANKS & ATMS
  // ==========================================
  { name: 'Banco Santander - Palma Centre', area: 'Palma', address: 'Plaça de Cort, 1, Palma', phone: '+34 971 72 90 10', category: 'banks', rating: 3.8, verified: true, location: { lat: 39.5698, lng: 2.6485 }, hours: { open: '08:15', close: '14:00' } },
  { name: 'CaixaBank - Avinguda Argentina', area: 'Palma', address: 'Avinguda de l\'Argentina, 30, Palma', phone: '+34 971 22 30 40', category: 'banks', verified: true, location: { lat: 39.5725, lng: 2.6510 }, hours: { open: '08:30', close: '14:15' } },
  { name: 'BBVA - Inca', area: 'Inca', address: "Plaça d'Espanya, 7, Inca", phone: '+34 971 50 10 20', category: 'banks', verified: true, location: { lat: 39.7200, lng: 2.9100 }, hours: { open: '08:30', close: '14:00' } },
  { name: 'Sabadell - Manacor', area: 'Manacor', address: 'Carrer dels Ferrers, 12, Manacor', phone: '+34 971 55 77 88', category: 'banks', verified: true, location: { lat: 39.5700, lng: 3.2080 } },
  { name: 'CaixaBank - Alcúdia', area: 'Alcúdia', address: "Plaça de la Constitució, 2, Alcúdia", phone: '+34 971 89 04 56', category: 'banks', verified: true, location: { lat: 39.8530, lng: 3.1220 } },

  // ==========================================
  // POST OFFICE
  // ==========================================
  { name: 'Correos - Palma Central', area: 'Palma', address: 'Carrer de la Germanor, 21, Palma', phone: '+34 971 22 11 33', category: 'postoffice', rating: 3.7, verified: true, location: { lat: 39.5730, lng: 2.6530 }, hours: { open: '08:30', close: '20:30' } },
  { name: 'Correos - Inca', area: 'Inca', address: 'Carrer del General Luque, 50, Inca', phone: '+34 971 50 20 30', category: 'postoffice', verified: true, location: { lat: 39.7180, lng: 2.9090 }, hours: { open: '08:30', close: '14:30' } },
  { name: 'Correos - Manacor', area: 'Manacor', address: "Carrer de l'Hospital, 2, Manacor", phone: '+34 971 55 33 44', category: 'postoffice', verified: true, location: { lat: 39.5715, lng: 3.2060 }, hours: { open: '08:30', close: '14:30' } },
  { name: 'Correos - Alcúdia', area: 'Alcúdia', address: 'Carrer del Comerç, 5, Alcúdia', phone: '+34 971 89 00 11', category: 'postoffice', verified: true, location: { lat: 39.8530, lng: 3.1210 }, hours: { open: '09:00', close: '13:00' } },
  { name: 'Correos - Calvià', area: 'Calvià', address: 'Carrer de la Major, 10, Calvià', phone: '+34 971 67 17 88', category: 'postoffice', verified: true, location: { lat: 39.5460, lng: 2.5160 }, hours: { open: '08:30', close: '14:30' } },

  // ==========================================
  // PARKS & GARDENS
  // ==========================================
  { name: 'Parc de la Mar', area: 'Palma', address: 'Avinguda de Gabriel Roca, s/n, Palma', category: 'parks', rating: 4.5, verified: true, location: { lat: 39.5650, lng: 2.6420 }, description: 'Beautiful park by the sea beneath Palma Cathedral.' },
  { name: "Jardí Botànic de Sóller", area: 'Sóller', address: 'Carretera de Palma, s/n, Sóller', phone: '+34 971 63 43 45', category: 'parks', rating: 4.3, verified: true, location: { lat: 39.7660, lng: 2.7050 }, hours: { open: '10:00', close: '18:00' } },
  { name: 'Parc de Sa Riera', area: 'Palma', address: 'Carrer de Sa Riera, 2, Palma', category: 'parks', rating: 4.2, verified: true, location: { lat: 39.5710, lng: 2.6540 } },
  { name: 'Sa Bassa Blanca Park', area: 'Alcúdia', address: "Carretera d'Alcúdia, km 2, Port d'Alcúdia", category: 'parks', rating: 4.4, verified: true, location: { lat: 39.8350, lng: 3.1300 } },
  { name: "Parc Natural de s'Albufera", area: 'Muro', address: "Carretera d'Artà, km 6, Muro", phone: '+34 971 89 22 55', category: 'parks', rating: 4.6, verified: true, location: { lat: 39.7800, lng: 3.1100 }, description: 'Protected wetland nature reserve.' },
  { name: 'Castell de Bellver', area: 'Palma', address: 'Carrer de Camilo José Cela, s/n, Palma', category: 'parks', rating: 4.6, verified: true, location: { lat: 39.5630, lng: 2.6200 }, description: 'Gothic castle with circular moat and pine forest.' },

  // ==========================================
  // INDUSTRIAL ESTATES
  // ==========================================
  { name: 'Polígono Industrial Son Castelló', area: 'Palma', address: 'Polígon Industrial Son Castelló, Palma', category: 'industrial', rating: 4.0, verified: true, location: { lat: 39.5850, lng: 2.6680 }, description: 'Largest industrial estate in Mallorca. Home to hundreds of businesses, warehouses, and logistics centers.' },
  { name: 'Polígono Industrial Can Valero', area: 'Palma', address: 'Polígon Industrial Can Valero, Palma', category: 'industrial', rating: 3.9, verified: true, location: { lat: 39.5800, lng: 2.6650 }, description: 'Major industrial estate in Palma with automotive, construction, and wholesale businesses.' },
  { name: 'Polígono Industrial dels Reis (Carril dels Reis)', area: 'Palma', address: 'Polígon Industrials dels Reis, Palma', category: 'industrial', rating: 3.8, verified: true, location: { lat: 39.5820, lng: 2.6720 }, description: 'Industrial area in Palma focused on logistics and warehousing.' },
  { name: 'Polígono Industrial de Marratxí', area: 'Marratxí', address: 'Polígon Industrial, Marratxí', category: 'industrial', rating: 4.0, verified: true, location: { lat: 39.6050, lng: 2.7300 }, description: 'Key industrial estate in Marratxí with diverse manufacturing and distribution.' },
  { name: 'Polígono Industrial d\'Inca', area: 'Inca', address: 'Polígon Industrial d\'Inca, Inca', category: 'industrial', rating: 4.0, verified: true, location: { lat: 39.7150, lng: 2.9150 }, description: 'Inca\'s main industrial zone serving the Raiguer region.' },
  { name: 'Polígono Industrial de Manacor', area: 'Manacor', address: 'Polígon Industrial, Manacor', category: 'industrial', rating: 3.9, verified: true, location: { lat: 39.5670, lng: 3.2050 }, description: 'Main industrial estate for the Llevant region of Mallorca.' },
  { name: 'Polígono Industrial de Calvià', area: 'Calvià', address: 'Polígon Industrial de Calvià, Calvià', category: 'industrial', rating: 3.8, verified: true, location: { lat: 39.5450, lng: 2.5100 }, description: 'Industrial zone serving the Calvià municipality.' },
  { name: 'Polígono Industrial d\'Alcúdia', area: 'Alcúdia', address: 'Polígon Industrial d\'Alcúdia, Alcúdia', category: 'industrial', rating: 3.9, verified: true, location: { lat: 39.8480, lng: 3.1300 }, description: 'Industrial estate serving the northern part of the island.' },
  { name: 'Polígono Industrial de Llucmajor', area: 'Llucmajor', address: 'Polígon Industrial, Llucmajor', category: 'industrial', rating: 3.7, verified: true, location: { lat: 39.4900, lng: 2.8880 }, description: 'Industrial area in Llucmajor with various businesses and services.' },
  { name: 'Polígono Industrial de Sa Pobla', area: 'Sa Pobla', address: 'Polígon Industrial, Sa Pobla', category: 'industrial', rating: 3.7, verified: true, location: { lat: 39.7650, lng: 3.0200 }, description: 'Industrial estate in the northern agricultural region.' },
  { name: 'Polígono Industrial de Muro', area: 'Muro', address: 'Polígon Industrial de Muro, Muro', category: 'industrial', rating: 3.6, verified: true, location: { lat: 39.7800, lng: 3.0800 }, description: 'Small industrial estate serving the Pla de Muro area.' },
  { name: 'Polígono Industrial de Pollença', area: 'Pollença', address: 'Polígon Industrial de Pollença, Pollença', category: 'industrial', rating: 3.6, verified: true, location: { lat: 39.8750, lng: 3.0250 }, description: 'Industrial zone in the northern Tramuntana region.' },
  { name: 'Polígono Industrial de Felanitx', area: 'Felanitx', address: 'Polígon Industrial, Felanitx', category: 'industrial', rating: 3.7, verified: true, location: { lat: 39.4650, lng: 3.1500 }, description: 'Main industrial estate for the Felanitx and southeast region.' },
  { name: 'Polígono Industrial de Campos', area: 'Campos', address: 'Polígon Industrial de Campos, Campos', category: 'industrial', rating: 3.6, verified: true, location: { lat: 39.4150, lng: 2.9950 }, description: 'Industrial estate in the southern Migjorn region.' },
  { name: 'Polígono Industrial de Capdepera', area: 'Capdepera', address: 'Polígon Industrial, Capdepera', category: 'industrial', rating: 3.5, verified: true, location: { lat: 39.6980, lng: 3.4350 }, description: 'Small industrial area serving the Capdepera municipality.' },
  { name: 'Polígono Industrial d\'Artà', area: 'Artà', address: 'Polígon Industrial d\'Artà, Artà', category: 'industrial', rating: 3.6, verified: true, location: { lat: 39.6900, lng: 3.3600 }, description: 'Industrial estate for the Llevant northern area.' },
  { name: 'Polígono Industrial de Sóller', area: 'Sóller', address: 'Polígon Industrial de Sóller, Sóller', category: 'industrial', rating: 3.5, verified: true, location: { lat: 39.7700, lng: 2.7200 }, description: 'Small industrial estate in the Sóller valley.' },
  { name: 'Polígono Industrial de Binissalem', area: 'Binissalem', address: 'Polígon Industrial, Binissalem', category: 'industrial', rating: 3.8, verified: true, location: { lat: 39.6800, lng: 2.8300 }, description: 'Key industrial zone in the wine region of Binissalem.' },
  { name: 'Polígono Industrial de Santa Maria del Camí', area: 'Santa Maria del Camí', address: 'Polígon Industrial, Santa Maria del Camí', category: 'industrial', rating: 3.8, verified: true, location: { lat: 39.6600, lng: 2.7750 }, description: 'Strategic industrial location near Palma and Inca.' },
  { name: 'Polígono Industrial d\'Andratx', area: 'Andratx', address: 'Polígon Industrial d\'Andratx, Andratx', category: 'industrial', rating: 3.5, verified: true, location: { lat: 39.5700, lng: 2.4200 }, description: 'Small industrial estate serving the southwest coast.' },
  { name: 'Polígono Industrial de Consell', area: 'Consell', address: 'Polígon Industrial, Consell', category: 'industrial', rating: 3.7, verified: true, location: { lat: 39.6680, lng: 2.8150 }, description: 'Growing industrial zone in the Raiguer region.' },
  { name: 'Polígon de Son Bugadelles', area: 'Calvià', address: 'Polígon de Son Bugadelles, Calvià', category: 'industrial', rating: 3.8, verified: true, location: { lat: 39.5490, lng: 2.5050 }, description: 'Modern industrial estate in the Calvià municipality.' },
  { name: 'Polígono de Son Tous', area: 'Palma', address: 'Polígon de Son Tous, Palma', category: 'industrial', rating: 3.9, verified: true, location: { lat: 39.5880, lng: 2.6900 }, description: 'Industrial and logistics park in eastern Palma.' },
  { name: 'Polígono Industrial de Son Parera', area: 'Palma', address: 'Polígon Industrial Son Parera, Palma', category: 'industrial', rating: 3.7, verified: true, location: { lat: 39.5830, lng: 2.6780 }, description: 'Smaller industrial estate integrated in Son Castelló area.' },
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
  console.log(`Done! ${count}/${businesses.length} businesses imported.`);
  process.exit(0);
}

seedDatabase();
