const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};
const app = initializeApp(firebaseConfig, 'desc-gen');
const db = getFirestore(app);

const areaNames = {
  palma: { en: 'Palma de Mallorca', es: 'Palma de Mallorca', de: 'Palma de Mallorca', ru: 'Пальма-де-Майорка' },
  calvia: { en: 'Calvià', es: 'Calvià', de: 'Calvià', ru: 'Кальвия' },
  andratx: { en: 'Andratx', es: 'Andratx', de: 'Andratx', ru: 'Андранч' },
  pollenca: { en: 'Pollença', es: 'Pollença', de: 'Pollença', ru: 'Польенса' },
  alcudia: { en: 'Alcúdia', es: 'Alcúdia', de: 'Alcúdia', ru: 'Алькудия' },
  soller: { en: 'Sóller', es: 'Sóller', de: 'Sóller', ru: 'Сольер' },
  inca: { en: 'Inca', es: 'Inca', de: 'Inca', ru: 'Инка' },
  manacor: { en: 'Manacor', es: 'Manacor', de: 'Manacor', ru: 'Манакор' },
  santanyi: { en: 'Santanyí', es: 'Santanyí', de: 'Santanyí', ru: 'Сантани' },
  llucmajor: { en: 'Llucmajor', es: 'Llucmajor', de: 'Llucmajor', ru: 'Льюкмайор' },
  marratxi: { en: 'Marratxí', es: 'Marratxí', de: 'Marratxí', ru: 'Маррачи' },
  bunyola: { en: 'Bunyola', es: 'Bunyola', de: 'Bunyola', ru: 'Буньола' },
  araro: { en: 'Alaró', es: 'Alaró', de: 'Alaró', ru: 'Аларо' },
  capdepera: { en: 'Capdepera', es: 'Capdepera', de: 'Capdepera', ru: 'Капдепера' },
  arta: { en: 'Artà', es: 'Artà', de: 'Artà', ru: 'Арта' },
  felanitx: { en: 'Felanitx', es: 'Felanitx', de: 'Felanitx', ru: 'Феланитч' },
  campos: { en: 'Campos', es: 'Campos', de: 'Campos', ru: 'Кампос' },
  muro: { en: 'Muro', es: 'Muro', de: 'Muro', ru: 'Муро' },
  'sa-pobla': { en: 'Sa Pobla', es: 'Sa Pobla', de: 'Sa Pobla', ru: 'Са-Побла' },
  'santa-maria': { en: 'Santa Maria del Camí', es: 'Santa Maria del Camí', de: 'Santa Maria del Camí', ru: 'Санта-Мария-дель-Ками' },
  binissalem: { en: 'Binissalem', es: 'Binissalem', de: 'Binissalem', ru: 'Бинисалем' },
  'ses-salines': { en: 'Ses Salines', es: 'Ses Salines', de: 'Ses Salines', ru: 'Сес-Салинас' },
  esporles: { en: 'Esporles', es: 'Esporles', de: 'Esporles', ru: 'Эспорлес' },
  porreres: { en: 'Porreres', es: 'Porreres', de: 'Porreres', ru: 'Порререс' },
  'son-servera': { en: 'Son Servera', es: 'Son Servera', de: 'Son Servera', ru: 'Сон-Сервера' },
};

const templates = {
  restaurants: (n, a) => ({
    en: `Nestled in the heart of ${a}, ${n} invites you to experience genuine culinary craftsmanship. This restaurant has earned its reputation through a commitment to quality ingredients, warm hospitality, and a passion for flavors that tell a story. Whether you are a local food enthusiast or a traveler seeking authentic tastes, ${n} promises an unforgettable dining experience. The atmosphere blends modern comfort with traditional charm, creating the perfect backdrop for any occasion.`,
    es: `En el corazón de ${a}, ${n} te invita a descubrir una experiencia culinaria auténtica. Este restaurante se ha ganado su reputación gracias a ingredientes de calidad, hospitalidad cálida y pasión por los sabores. Tanto si eres un amante de la gastronomía local como un viajero en busca de sabores auténticos, ${n} promete una experiencia gastronómica inolvidable.`,
    de: `Im Herzen von ${a} lädt Sie ${n} zu einem echten kulinarischen Erlebnis ein. Dieses Restaurant hat sich seinen Ruf durch hochwertige Zutaten, herzliche Gastfreundschaft und Leidenschaft für Aromen erarbeitet. Ob als lokaler Feinschmecker oder Reisender auf der Suche nach authentischen Geschmäckern — ${n} verspricht ein unvergessliches Speiseerlebnis.`,
    ru: `В самом сердце ${a} ресторан ${n} приглашает вас открыть для себя подлинное кулинарное мастерство. Заведение заслужило репутацию благодаря качественным ингредиентам, тёплому гостеприимству и страсти к вкусам, которые рассказывают истории. ${n} обещает незабываемые гастрономические впечатления.`,
  }),
  cafes: (n, a) => ({
    en: `${n} is a charming café in ${a}, offering a cozy retreat for coffee lovers and casual visitors alike. Known for its carefully sourced beans and inviting atmosphere, this spot has become a beloved gathering place. Whether you're starting your day with a perfectly crafted espresso or enjoying a leisurely afternoon with friends, ${n} delivers quality in every cup.`,
    es: `${n} es un encantador café en ${a}, que ofrece un refugio acogedor para los amantes del café. Con su atmosfera acogedora y café de calidad, se ha convertido en un lugar de encuentro favorito. Ya sea para empezar el día con un espresso perfecto o disfrutar de una tarde relajada, ${n} ofrece calidad en cada taza.`,
    de: `${n} ist ein charmantes Café in ${a} und bietet eine gemütliche Oase für Kaffeeliebhaber. Bekannt für sorgfältig ausgewählte Bohnen und einladende Atmosphäre, ist es zu einem beliebten Treffpunkt geworden. Ob zum perfekten Espresso am Morgen oder entspanntem Nachmittag mit Freunden — ${n} liefert Qualität in jeder Tasse.`,
    ru: `${n} — уютное кафе в ${a}, предлагающее тёплое убежище для любителей кофе. Благодаря тщательно отобранным зёрнам и гостеприимной атмосфере оно стало любимым местом встреч. ${n} гарантирует качество в каждой чашке.`,
  }),
  hotels: (n, a) => ({
    en: `${n} stands as a premier accommodation in ${a}, blending elegant design with authentic Mallorcan charm. Guests are treated to thoughtfully designed rooms, attentive service, and a location that puts the best of the island within reach. From the moment you arrive, ${n} delivers a stay that balances luxury with the relaxed Mediterranean lifestyle.`,
    es: `${n} es un alojamiento destacado en ${a}, que combina diseño elegante con encanto auténtico mallorquín. Los huéspedes disfrutan de habitaciones cuidadosamente diseñadas y un servicio atento. Desde que llegas, ${n} ofrece una estancia que equilibra lujo con el estilo mediterráneo relajado.`,
    de: `${n} ist eine Unterkunft erster Klasse in ${a}, die elegantes Design mit authentischem mallorquinischem Charme verbindet. Gäste genießen durchdacht gestaltete Zimmer und aufmerksamen Service. Von Ihrer Ankunft an bietet ${n} einen Aufenthalt, der Luxus mit entspanntem mediterranen Lebensstil verbindet.`,
    ru: `${n} — премиальное место проживания в ${a}, сочетающее элегантный дизайн с аутентичным майорканским шармом. Гости наслаждаются продуманными номерами и внимательным обслуживанием. ${n} предлагает роскошь в гармонии со средиземноморским стилем жизни.`,
  }),
  activities: (n, a) => ({
    en: `${n} brings exciting adventures to ${a}, offering experiences that create lasting memories. With professional guides and top-quality equipment, every activity is designed to thrill and inspire. Whether you're an adrenaline seeker or looking for a relaxing escape, ${n} has something special for you.`,
    es: `${n} trae aventuras emocionantes a ${a}, ofreciendo experiencias que crean recuerdos duraderos. Con guías profesionales y equipo de primera calidad, cada actividad está diseñada para emocionar e inspirar.`,
    de: `${n} bringt spannende Abenteuer nach ${a} und bietet Erlebnisse, die bleibende Erinnerungen schaffen. Mit professionellen Guides und erstklassiger Ausrüstung ist jede Aktivität darauf ausgelegt, zu begeistern.`,
    ru: `${n} дарит захватывающие приключения в ${a}, предлагая впечатления, которые создают долгие воспоминания. С профессиональными гидами и оборудованием высшего качества каждое занятие создано для вдохновения.`,
  }),
  shopping: (n, a) => ({
    en: `${n} is a standout shopping destination in ${a}, curated for those who appreciate quality and variety. From carefully selected local products to international brands, the range caters to diverse tastes. The welcoming atmosphere makes every visit a pleasure.`,
    es: `${n} es un destino de compras destacado en ${a}, seleccionado para quienes aprecian calidad y variedad. La atmósfera acogedora hace que cada visita sea un placer.`,
    de: `${n} ist ein herausragendes Einkaufsziel in ${a}, kuratiert für Qualitäts- und Vielfalltsliebhaber. Die einladende Atmosphäre macht jeden Einkaufsbesuch zum Vergnügen.`,
    ru: `${n} — выдающееся место для шопинга в ${a}, подобранное для ценителей качества и разнообразия. Гостеприимная атмосфера превращает каждый визит в удовольствие.`,
  }),
  services: (n, a) => ({
    en: `${n} provides professional services in ${a}, built on a foundation of expertise and client trust. The team brings years of experience and a commitment to delivering results. Whether you need expert advice or hands-on support, ${n} is your reliable partner.`,
    es: `${n} ofrece servicios profesionales en ${a}, construidos sobre una base de experiencia y confianza del cliente. El equipo aporta años de experiencia y compromiso con los resultados.`,
    de: `${n} bietet professionelle Dienstleistungen in ${a}, basierend auf Expertise und Kundenvertrauen. Das Team bringt jahrelange Erfahrung und Engagement für Ergebnisse mit.`,
    ru: `${n} предоставляет профессиональные услуги в ${a}, основанные на опыте и доверии клиентов. Команда привносит годы экспертизы и приверженность результатам.`,
  }),
  health: (n, a) => ({
    en: `${n} is a trusted health facility in ${a}, providing essential medical services with care and professionalism. The team combines medical expertise with compassionate patient care, ensuring every visit is handled with the attention it deserves.`,
    es: `${n} es un centro de salud de confianza en ${a}, que ofrece servicios médicos esenciales con cuidado y profesionalismo. El equipo combina experiencia médica con atención compasiva al paciente.`,
    de: `${n} ist eine vertrauenswürdige Gesundheitseinrichtung in ${a} und bietet wesentliche medizinische Dienstleistungen mit Sorgfalt und Professionalität.`,
    ru: `${n} — проверенный медицинский центр в ${a}, предоставляющий важнейшие медицинские услуги заботливо и профессионально.`,
  }),
  banks: (n, a) => ({
    en: `${n} offers comprehensive banking services in ${a}, helping individuals and businesses manage their finances with confidence. With modern facilities and experienced staff, every banking need is addressed professionally.`,
    es: `${n} ofrece servicios bancarios integrales en ${a}, ayudando a particulares y empresas a gestionar sus finanzas con confianza.`,
    de: `${n} bietet umfassende Bankdienstleistungen in ${a} und hilft Einzelpersonen und Unternehmen dabei, ihre Finanzen sicher zu verwalten.`,
    ru: `${n} предоставляет полный спектр банковских услуг в ${a}, помогая частным лицам и компаниям уверенно управлять финансами.`,
  }),
  transport: (n, a) => ({
    en: `${n} provides reliable transportation solutions in ${a}, ensuring you get where you need to go safely and on time. With well-maintained vehicles and professional service, your journey is in good hands.`,
    es: `${n} ofrece soluciones de transporte fiables en ${a}, asegurando que llegues a tu destino de forma segura y puntual.`,
    de: `${n} bietet zuverlässige Transportlösungen in ${a} und stellt sicher, dass Sie sicher und pünktlich an Ihr Ziel kommen.`,
    ru: `${n} предлагает надёжные транспортные решения в ${a}, обеспечивая безопасную и своевременную доставку.`,
  }),
  pharmacies: (n, a) => ({
    en: `${n} is a well-stocked pharmacy in ${a}, serving the community with essential health products and professional pharmaceutical advice. The knowledgeable staff provides personalized recommendations for your well-being.`,
    es: `${n} es una farmacia bien surtida en ${a}, que sirve a la comunidad con productos esenciales y asesoramiento farmacéutico profesional.`,
    de: `${n} ist eine gut sortierte Apotheke in ${a} und versorgt die Gemeinde mit wesentlichen Gesundheitsprodukten und fachkundigem pharmazeutischem Rat.`,
    ru: `${n} — хорошо укомплектованная аптека в ${a}, обслуживающая сообщество важнейшими товарами для здоровья и профессиональными фармацевтическими рекомендациями.`,
  }),
  supermarkets: (n, a) => ({
    en: `${n} is a convenient supermarket in ${a}, offering a wide selection of fresh produce, pantry essentials, and quality brands. The store provides everything you need for daily life, from local specialties to international favorites.`,
    es: `${n} es un supermercado conveniente en ${a}, que ofrece una amplia selección de productos frescos y marcas de calidad.`,
    de: `${n} ist ein praktischer Supermarkt in ${a} mit einer großen Auswahl an frischen Produkten und Qualitätsmarken.`,
    ru: `${n} — удобный супермаркет в ${a}, предлагающий широкий выбор свежих продуктов и качественных брендов.`,
  }),
  veterinarians: (n, a) => ({
    en: `${n} provides compassionate veterinary care in ${a}, treating your beloved pets with the expertise and tenderness they deserve. From routine check-ups to specialized treatments, the team is dedicated to animal health.`,
    es: `${n} ofrece atención veterinaria compasiva en ${a}, tratando a tus queridas mascotas con la experiencia y ternura que merecen.`,
    de: `${n} bietet mitfühlende tierärztliche Versorgung in ${a} und behandelt Ihre Haustiere mit der Expertise und Zärtlichkeit, die sie verdienen.`,
    ru: `${n}提供заботливую ветеринарную помощь в ${a}, относясь к вашим питомцам с экспертизой и нежностью, которых они заслуживают.`,
  }),
  gasstations: (n, a) => ({
    en: `${n} provides reliable fueling services in ${a}, ensuring your vehicle is ready for the road. Clean facilities, competitive prices, and convenient location make it a practical choice.`,
    es: `${n} ofrece servicios de combustible fiables en ${a}, asegurando que tu vehículo esté listo para el camino.`,
    de: `${n} bietet zuverlässige Tankdienste in ${a} und stellt sicher, dass Ihr Fahrzeug startklar ist.`,
    ru: `${n}提供надёжные услуги заправки в ${a}, гарантируя готовность вашего автомобиля к поездке.`,
  }),
  parks: (n, a) => ({
    en: `${n} offers a green oasis in ${a}, perfect for relaxation and connecting with nature. The beautifully maintained grounds provide an ideal setting for families and nature lovers alike.`,
    es: `${n} ofrece un oasis verde en ${a}, perfecto para relajarse y conectar con la naturaleza.`,
    de: `${n} bietet eine grüne Oase in ${a}, perfekt zur Entspannung und zum Verbinden mit der Natur.`,
    ru: `${n}提供в${a}зелёный оазис, идеальный для отдыха и единения с природой.`,
  }),
  police: (n, a) => ({
    en: `${n} serves and protects the community in ${a}, ensuring public safety and responding to emergencies around the clock.`,
    es: `${n} sirve y protege a la comunidad en ${a}, garantizando la seguridad pública y respondiendo a emergencias.`,
    de: `${n} dient und schützt die Gemeinschaft in ${a} und gewährleistet öffentliche Sicherheit.`,
    ru: `${n} служит и защищает сообщество в ${a}, обеспечивая общественную безопасность.`,
  }),
  postoffice: (n, a) => ({
    en: `${n} provides postal and logistics services in ${a}, connecting people and businesses through reliable mail and package delivery.`,
    es: `${n} ofrece servicios postales y logísticos en ${a}, conectando personas y negocios.`,
    de: `${n} bietet Post- und Logistikdienste in ${a} und verbindet Menschen und Unternehmen.`,
    ru: `${n}提供почтовые и логистические услуги в ${a}, связывая людей и бизнес.`,
  }),
  industrial: (n, a) => ({
    en: `${n} is an established business in the industrial area of ${a}, providing professional services to the local commercial community.`,
    es: `${n} es un negocio establecido en la zona industrial de ${a}, que ofrece servicios profesionales.`,
    de: `${n} ist ein etabliertes Unternehmen im Industriegebiet von ${a} mit professionellen Dienstleistungen.`,
    ru: `${n} — устоявшийся бизнес в промышленной зоне ${a}, предоставляющий профессиональные услуги.`,
  }),
};

function getAreaName(areaId) {
  const a = areaNames[areaId];
  return a ? a.en : areaId || 'Mallorca';
}

function getAreaNameMulti(areaId) {
  const a = areaNames[areaId];
  if (!a) return { en: areaId || 'Mallorca', es: areaId || 'Mallorca', de: areaId || 'Mallorca', ru: areaId || 'Майорка' };
  return a;
}

function hasGoodDescription(desc) {
  if (!desc) return false;
  if (typeof desc === 'object') {
    return desc.en && desc.en.length > 100 && desc.es && desc.es.length > 80;
  }
  return false;
}

async function main() {
  const snap = await getDocs(collection(db, 'businesses'));
  let updated = 0;
  let skipped = 0;
  let generated = 0;
  const total = snap.size;

  for (const d of snap.docs) {
    const data = d.data();
    const name = data.name || 'Business';
    const category = data.category || 'services';
    const areaId = data.area || '';

    if (hasGoodDescription(data.description)) {
      skipped++;
      continue;
    }

    const areaName = getAreaName(areaId);
    const templateFn = templates[category] || templates.services;
    const areaMulti = getAreaNameMulti(areaId);

    const desc = templateFn(name, areaName);
    const fullDesc = {
      en: desc.en,
      es: desc.es || desc.en,
      de: desc.de || desc.en,
      ru: desc.ru || desc.en,
    };

    try {
      await updateDoc(doc(db, 'businesses', d.id), { description: fullDesc });
      generated++;
    } catch (e) {
      console.error(`Error updating ${name}: ${e.message}`);
    }

    if ((generated + skipped) % 100 === 0) {
      console.log(`Progress: ${generated + skipped}/${total} (generated: ${generated}, skipped: ${skipped})`);
    }
  }

  console.log(`\nDone: ${generated} descriptions generated, ${skipped} skipped (already good), ${total} total`);
  process.exit(0);
}

main();
