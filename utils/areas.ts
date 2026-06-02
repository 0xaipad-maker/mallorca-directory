export interface AreaData {
  id: string;
  name: string;
  lat: number;
  lng: number;
  emoji: string;
  description: { en: string; es: string; de: string; ru: string };
  population?: number;
}

export const areas: AreaData[] = [
  { id: 'palma', name: 'Palma', lat: 39.5696, lng: 2.6502, emoji: '🏛️', population: 416000,
    description: { en: 'Capital of Mallorca with historic old town and vibrant atmosphere.', es: 'Capital de Mallorca con casco histórico y ambiente vibrante.', de: 'Hauptstadt Mallorcas mit historischer Altstadt und lebendiger Atmosphäre.', ru: 'Столица Майорки с историческим центром и оживлённой атмосферой.' } },
  { id: 'calvia', name: 'Calvià', lat: 39.5650, lng: 2.5060, emoji: '🌊', population: 51000,
    description: { en: 'Coastal municipality with famous resorts like Magaluf and Santa Ponsa.', es: 'Municipio costero con balnearios famosos como Magaluf y Santa Ponça.', de: 'Küstengemeinde mit bekannten Resorts wie Magaluf und Santa Ponsa.', ru: 'Прибрежный муниципалитет с известными курортами Магалуф и Санта-Понса.' } },
  { id: 'andratx', name: 'Andratx', lat: 39.5760, lng: 2.4200, emoji: '⛵', population: 12000,
    description: { en: 'Charming port town with beautiful marina and mountain views.', es: 'Encantador puerto con hermoso puerto deportivo y vistas a la montaña.', de: 'Charmante Hafenstadt mit schönem Yachthafen und Bergblick.', ru: 'Очаровательный портовый город с красивой мариной и горными видами.' } },
  { id: 'pollenca', name: 'Pollença', lat: 39.8770, lng: 3.0170, emoji: '⛵', population: 17000,
    description: { en: 'Northern municipality with stunning beaches and the iconic Port de Pollença.', es: 'Municipio del norte con impresionantes playas y el icónico Port de Pollença.', de: 'Nördliche Gemeinde mit atemberaubenden Stränden und dem ikonischen Port de Pollença.', ru: 'Северный муниципалитет с потрясающими пляжами и Порт-де-Польенса.' } },
  { id: 'alcudia', name: 'Alcúdia', lat: 39.8530, lng: 3.1210, emoji: '🏰', population: 21000,
    description: { en: 'Historic walled city with Roman ruins and beautiful beaches.', es: 'Ciudad histórica amurallada con ruinas romanas y hermosas playas.', de: 'Historische Stadt mit Stadtmauer, römischen Ruinen und schönen Stränden.', ru: 'Исторический город с крепостными стенами, римскими руинами и красивыми пляжами.' } },
  { id: 'soller', name: 'Sóller', lat: 39.7670, lng: 2.7140, emoji: '🚂', population: 14000,
    description: { en: 'Valley town famous for its vintage wooden tram and citrus orchards.', es: 'Pueblo del valle famoso por su tranvía de madera vintage y huertos de cítricos.', de: 'Bergdorf berühmt für seine historische Holzstraßenbahn und Zitrusplantagen.', ru: 'Город в долине, знаменитый старинным деревянным трамваем и цитрусовыми садами.' } },
  { id: 'deia', name: 'Deià', lat: 39.7480, lng: 2.6490, emoji: '🏔️', population: 700,
    description: { en: 'Picturesque mountain village beloved by artists and writers.', es: 'Pintoresco pueblo de montaña amado por artistas y escritores.', de: 'Malerisches Bergdorf, das von Künstlern und Schriftstellern geliebt wird.', ru: 'Живописная горная деревня, любимая художниками и писателями.' } },
  { id: 'valldemossa', name: 'Valldemossa', lat: 39.7100, lng: 2.6220, emoji: '🎵', population: 2000,
    description: { en: 'Mountain village famous for the Royal Carthusian Monastery and Chopin.', es: 'Pueblo de montaña famoso por la Cartuja Real y Chopin.', de: 'Bergdorf berühmt für die Königliche Kartause und Chopin.', ru: 'Горная деревня, известная монастырём и Шопеном.' } },
  { id: 'inca', name: 'Inca', lat: 39.7210, lng: 2.9100, emoji: '🏘️', population: 34000,
    description: { en: 'Industrial and commercial hub in the heart of Mallorca, famous for leather.', es: 'Centro industrial y comercial en el corazón de Mallorca, famoso por el cuero.', de: 'Industrielles und kommerzielles Zentrum im Herzen Mallorcas, berühmt für Leder.', ru: 'Промышленный и торговый центр в сердце Майорки, знаменитый кожей.' } },
  { id: 'manacor', name: 'Manacor', lat: 39.5690, lng: 3.2090, emoji: '🏭', population: 44000,
    description: { en: 'Second largest city, known for furniture, pearls, and Rafa Nadal.', es: 'Segunda ciudad más grande, conocida por muebles, perlas y Rafa Nadal.', de: 'Zweitgrößte Stadt, bekannt für Möbel, Perlen und Rafa Nadal.', ru: 'Второй по величине город, известный мебелью, жемчугом и Рафаэлем Надалем.' } },
  { id: 'santanyi', name: 'Santanyí', lat: 39.3540, lng: 3.1280, emoji: '🏖️', population: 13000,
    description: { en: 'Southern municipality with turquoise coves and stone architecture.', es: 'Municipio del sur con calas turquesas y arquitectura de piedra.', de: 'Südliche Gemeinde mit türkisfarbenen Buchten und Steinarchitektur.', ru: 'Южный муниципалитет с бирюзовыми бухтами и каменной архитектурой.' } },
  { id: 'llucmajor', name: 'Llucmajor', lat: 39.4900, lng: 2.8900, emoji: '🏘️', population: 38000,
    description: { en: 'Large municipality with Palma Airport and beautiful coastline.', es: 'Gran municipio con el Aeropuerto de Palma y una hermosa costa.', de: 'Große Gemeinde mit dem Flughafen Palma und einer wunderschönen Küste.', ru: 'Большой муниципалитет с аэропортом Пальмы и красивым побережьем.' } },
  { id: 'marratxi', name: 'Marratxí', lat: 39.6420, lng: 2.7530, emoji: '🏗️', population: 38000,
    description: { en: 'Industrial and residential area bordering Palma.', es: 'Área industrial y residencial que limita con Palma.', de: 'Industrie- und Wohngebiet grenzt an Palma.', ru: 'Промышленный и жилой район, граничащий с Пальмой.' } },
  { id: 'bunyola', name: 'Bunyola', lat: 39.6960, lng: 2.6990, emoji: '🌄', population: 7000,
    description: { en: 'Mountain village in the Tramuntana range with stunning nature.', es: 'Pueblo de montaña en la sierra de Tramuntana con impresionante naturaleza.', de: 'Bergdorf in der Tramuntana mit atemberaubender Natur.', ru: 'Горная деревня в Трамунтане с потрясающей природой.' } },
  { id: 'araro', name: 'Alaró', lat: 39.7040, lng: 2.7920, emoji: '🏘️', population: 6000,
    description: { en: 'Traditional village at the foot of the Tramuntana mountains.', es: 'Pueblo tradicional al pie de la sierra de Tramuntana.', de: 'Traditionelles Dorf am Fuße der Tramuntana-Berge.', ru: 'Традиционная деревня у подножия гор Трамунтана.' } },
  { id: 'capdepera', name: 'Capdepera', lat: 39.7030, lng: 3.4350, emoji: '🏖️', population: 12000,
    description: { en: 'Eastern municipality with beautiful coves and a medieval castle.', es: 'Municipio del este con hermosas calas y un castillo medieval.', de: 'Östliche Gemeinde mit schönen Buchten und einer mittelalterlichen Burg.', ru: 'Восточный муниципалитет с красивыми бухтами и средневековым замком.' } },
  { id: 'arta', name: 'Artà', lat: 39.6930, lng: 3.3490, emoji: '🏛️', population: 8000,
    description: { en: 'Historic town with a stunning skyline dominated by a sanctuary.', es: 'Ciudad histórica con una impresionante silueta dominada por un santuario.', de: 'Historische Stadt mit atemberaubender Skyline, dominiert von einem Heiligtum.', ru: 'Исторический город с потрясающим горизонтом, где доминирует святилище.' } },
  { id: 'felanitx', name: 'Felanitx', lat: 39.4700, lng: 3.1480, emoji: '🏘️', population: 18000,
    description: { en: 'Agricultural and wine-producing area in southeastern Mallorca.', es: 'Zona agrícola y vitivinícola en el sureste de Mallorca.', de: 'Landwirtschaftliches und Weinbaugebiet im Südosten Mallorcas.', ru: 'Сельскохозяйственный и винодельческий регион на юго-востоке Майорки.' } },
  { id: 'campos', name: 'Campos', lat: 39.4310, lng: 3.0190, emoji: '🌾', population: 11000,
    description: { en: 'Agricultural town near the famous Es Trenc beach.', es: 'Pueblo agrícola cerca de la famosa playa de Es Trenc.', de: 'Landwirtschaftliche Stadt in der Nähe des berühmten Strandes Es Trenc.', ru: 'Сельскохозяйственный городок рядом со знаменитым пляжем Эс-Тренк.' } },
  { id: 'muro', name: 'Muro', lat: 39.7350, lng: 3.0580, emoji: '🌿', population: 7500,
    description: { en: 'Quiet agricultural town with access to Albufera nature park.', es: 'Tranquilo pueblo agrícola con acceso al parque natural de la Albufera.', de: 'Ruhige landwirtschaftliche Stadt mit Zugang zum Naturpark Albufera.', ru: 'Тихий сельскохозяйственный городок с доступом к природному парку Альбуфера.' } },
  { id: 'sa-pobla', name: 'Sa Pobla', lat: 39.7690, lng: 3.0230, emoji: '🌾', population: 14000,
    description: { en: 'Agricultural town known for potato production and local markets.', es: 'Pueblo agrícola conocido por la producción de patatas y mercados locales.', de: 'Landwirtschaftliche Stadt bekannt für Kartoffelanbau und lokale Märkte.', ru: 'Сельскохозяйственный город, известный производством картофеля и местными рынками.' } },
  { id: 'santa-maria', name: 'Santa Maria del Camí', lat: 39.6510, lng: 2.7730, emoji: '🍷', population: 7500,
    description: { en: 'Wine-producing town in the heart of Mallorca\'s wine region.', es: 'Pueblo vinícola en el corazón de la región vinícola de Mallorca.', de: 'Weinbaustadt im Herzen des mallorquinischen Weinbaugebiets.', ru: 'Винодельческий город в центре винодельческого региона Майорки.' } },
  { id: 'binissalem', name: 'Binissalem', lat: 39.6860, lng: 2.8360, emoji: '🍷', population: 9000,
    description: { en: 'Historic wine-producing town with DO Binissalem designation.', es: 'Pueblo vitivinícola histórico con denominación DO Binissalem.', de: 'Historische Weinbaustadt mit DO Binissalem Auszeichnung.', ru: 'Исторический винодельческий город со статусом DO Бисалам.' } },
  { id: 'ses-salines', name: 'Ses Salines', lat: 39.3360, lng: 3.0510, emoji: '🧂', population: 5000,
    description: { en: 'Southern village famous for salt flats and pristine beaches.', es: 'Pueblo del sur famoso por sus salinas y playas vírgenes.', de: 'Südliches Dorf berühmt für Salinen und unberührte Strände.', ru: 'Южная деревня, знаменитая соляными разработками и нетронутыми пляжами.' } },
  { id: 'esporles', name: 'Esporles', lat: 39.6680, lng: 2.5790, emoji: '🌄', population: 5200,
    description: { en: 'Mountain village near Palma with hiking trails and nature.', es: 'Pueblo de montaña cerca de Palma con senderos y naturaleza.', de: 'Bergdorf in der Nähe von Palma mit Wanderwegen und Natur.', ru: 'Горная деревня рядом с Пальмой с пешеходными тропами и природой.' } },
  { id: 'porreres', name: 'Porreres', lat: 39.5160, lng: 3.0220, emoji: '🏘️', population: 5500,
    description: { en: 'Agricultural town in the center of Mallorca with traditional charm.', es: 'Pueblo agrícola en el centro de Mallorca con encanto tradicional.', de: 'Landwirtschaftliche Stadt im Zentrum Mallorcas mit traditionellem Charme.', ru: 'Сельскохозяйственный город в центре Майорки с традиционным шармом.' } },
  { id: 'son-servera', name: 'Son Servera', lat: 39.6210, lng: 3.3600, emoji: '🏖️', population: 12000,
    description: { en: 'Eastern coastal town with beautiful beaches and golf resorts.', es: 'Pueblo costero del este con hermosas playas y campos de golf.', de: 'Östliche Küstenstadt mit schönen Stränden und Golfresorts.', ru: 'Восточный прибрежный город с красивыми пляжами и гольф-курортами.' } },
];

export const areaMap: Record<string, AreaData> = {};
for (const a of areas) {
  areaMap[a.name] = a;
  areaMap[a.id] = a;
}
