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
  restaurants: { en: 'Mediterranean and international cuisine in a welcoming setting.', es: 'Cocina mediterránea e internacional en un ambiente acogedor.', de: 'Mediterrane und internationale Küche in einladender Atmosphäre.', ru: 'Средиземноморская и интернациональная кухня в уютной обстановке.' },
  cafes: { en: 'Relaxing spot for coffee, pastries, and light meals.', es: 'Lugar relajante para café, pasteles y comidas ligeras.', de: 'Entspannter Ort für Kaffee, Gebäck und leichte Mahlzeiten.', ru: 'Место отдыха с кофе, выпечкой и лёгкими закусками.' },
  hotels: { en: 'Comfortable accommodation with excellent service and amenities.', es: 'Alojamiento confortable con excelente servicio y comodidades.', de: 'Komfortable Unterkunft mit exzellentem Service und Annehmlichkeiten.', ru: 'Комфортное проживание с отличным сервисом и удобствами.' },
  beaches: { en: 'Stunning sandy beach with crystal-clear Mediterranean waters.', es: 'Impresionante playa de arena con aguas cristalinas del Mediterráneo.', de: 'Wunderschöner Sandstrand mit kristallklarem Mittelmeerwasser.', ru: 'Прекрасный песчаный пляж с кристально чистой водой Средиземного моря.' },
  parks: { en: 'Beautiful green space perfect for relaxation and nature walks.', es: 'Hermoso espacio verde perfecto para relajarse y pasear.', de: 'Wunderschöne Grünanlage, perfekt für Entspannung und Spaziergänge.', ru: 'Красивое зелёное пространство для отдыха и прогулок на природе.' },
  activities: { en: 'Fun and exciting experience for all ages.', es: 'Experiencia divertida y emocionante para todas las edades.', de: 'Ein unterhaltsames und aufregendes Erlebnis für jedes Alter.', ru: 'Весёлое и захватывающее мероприятие для всех возрастов.' },
  shopping: { en: 'Great selection of shops and products in a convenient location.', es: 'Gran selección de tiendas y productos en una ubicación conveniente.', de: 'Große Auswahl an Geschäften und Produkten an einem günstigen Ort.', ru: 'Большой выбор магазинов и товаров в удобном месте.' },
  supermarkets: { en: 'Well-stocked supermarket with fresh produce and daily essentials.', es: 'Supermercado bien surtido con productos frescos y esenciales diarios.', de: 'Gut sortierter Supermarkt mit frischen Produkten und täglichen Bedarfsartikeln.', ru: 'Хорошо снабжённый супермаркет со свежими продуктами.' },
  services: { en: 'Professional and reliable service you can trust.', es: 'Servicio profesional y confiable en el que puede confiar.', de: 'Professioneller und zuverlässiger Service, dem Sie vertrauen können.', ru: 'Профессиональный и надёжный сервис, которому можно доверять.' },
  transport: { en: 'Convenient transport hub connecting you across Mallorca.', es: 'Conveniente centro de transporte que le conecta por toda Mallorca.', de: 'Praktischer Verkehrsknotenpunkt, der Sie durch ganz Mallorca verbindet.', ru: 'Удобный транспортный узел, соединяющий вас по всей Мальорке.' },
  health: { en: 'Quality healthcare and medical services.', es: 'Atención médica y servicios de salud de calidad.', de: 'Qualitativ hochwertige Gesundheitsversorgung und medizinische Dienste.', ru: 'Качественное медицинское обслуживание и услуги.' },
  pharmacies: { en: 'Full-service pharmacy with professional care.', es: 'Farmacia de servicio completo con atención profesional.', de: 'Apotheke mit umfassendem Service und professioneller Beratung.', ru: 'Аптека с полным спектром услуг и профессиональным уходом.' },
  police: { en: 'Dedicated to keeping the community safe.', es: 'Dedicados a mantener la seguridad de la comunidad.', de: 'Dem Schutz der Gemeinschaft verpflichtet.', ru: 'Обеспечение безопасности сообщества.' },
  gasstations: { en: 'Convenient fuel station with competitive prices.', es: 'Gasolinera conveniente con precios competitivos.', de: 'Praktische Tankstelle mit wettbewerbsfähigen Preisen.', ru: 'Удобная заправочная станция с конкурентоспособными ценами.' },
  veterinarians: { en: 'Caring veterinary services for your pets.', es: 'Servicios veterinarios cariñosos para sus mascotas.', de: 'Fürsorgliche tierärztliche Versorgung für Ihre Haustiere.', ru: 'Заботливые ветеринарные услуги для ваших питомцев.' },
  banks: { en: 'Full banking services for individuals and businesses.', es: 'Servicios bancarios completos para particulares y empresas.', de: 'Umfassende Bankdienstleistungen für Privatpersonen und Unternehmen.', ru: 'Полный спектр банковских услуг для частных лиц и бизнеса.' },
  postoffice: { en: 'Complete postal and parcel services.', es: 'Servicios postales y de paquetería completos.', de: 'Komplette Post- und Paketdienste.', ru: 'Полный спектр почтовых услуг и доставки посылок.' },
  industrial: { en: 'Strategic industrial estate with modern facilities for businesses.', es: 'Polígono industrial estratégico con instalaciones modernas para empresas.', de: 'Strategisches Industriegebiet mit modernen Einrichtungen für Unternehmen.', ru: 'Стратегическая промышленная зона с современными предприятиями.' },
};

const defaultDesc = { en: 'Quality service in Mallorca.', es: 'Servicio de calidad en Mallorca.', de: 'Qualitätsservice auf Mallorca.', ru: 'Качественный сервис на Майорке.' };

async function migrate() {
  const snapshot = await getDocs(collection(db, 'businesses'));
  let updated = 0;
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const desc = data.description;
    if (!desc || typeof desc === 'string') {
      const template = descTemplates[data.category] || defaultDesc;
      await updateDoc(doc(db, 'businesses', docSnap.id), { description: template, updatedAt: serverTimestamp() });
      updated++;
    }
  }
  console.log(`Updated ${updated}/${snapshot.docs.length} businesses with multilingual descriptions.`);
  process.exit(0);
}

migrate();
