const https = require('https');

function overpassQuery(query) {
  return new Promise((resolve) => {
    const data = 'data=' + encodeURIComponent(query);
    const opts = {
      hostname: 'overpass-api.de',
      path: '/api/interpreter',
      method: 'POST',
      headers: { 'Content-Type': 'text/plain', 'Content-Length': Buffer.byteLength(data) }
    };
    const req = https.request(opts, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { resolve(null); } });
    });
    req.on('error', () => resolve(null));
    req.write(data);
    req.end();
  });
}

(async()=>{
  // Andratx wider area
  const q1 = '[out:json][timeout:15];(node(39.55,2.40,39.60,2.46);way(39.55,2.40,39.60,2.46););out center tags;';
  const r1 = await overpassQuery(q1);
  console.log('Andratx area:');
  if(r1?.elements) r1.elements.filter(e => e.tags?.name?.toLowerCase().includes('merca')).forEach(e => {
    console.log('  ', e.tags.name, e.lat||e.center?.lat, e.lon||e.center?.lon);
  });

  // Calvià wider - Son Bugadelles area
  const q2 = '[out:json][timeout:15];(node["name"~"Mercadona",i](39.55,2.49,39.58,2.52);way["name"~"Mercadona",i](39.55,2.49,39.58,2.52););out center;';
  const r2 = await overpassQuery(q2);
  console.log('Calvià Son Bugadelles:');
  if(r2?.elements) r2.elements.forEach(e => {
    console.log('  ', e.tags?.name, e.lat||e.center?.lat, e.lon||e.center?.lon, e.tags?.['addr:street']);
  });

  // Inca wider
  const q3 = '[out:json][timeout:15];(node["name"~"Mercadona",i](39.71,2.90,39.73,2.93);way["name"~"Mercadona",i](39.71,2.90,39.73,2.93););out center;';
  const r3 = await overpassQuery(q3);
  console.log('Inca area:');
  if(r3?.elements) r3.elements.forEach(e => {
    console.log('  ', e.tags?.name, e.lat||e.center?.lat, e.lon||e.center?.lon, e.tags?.['addr:street']);
  });

  // Marratxí wider
  const q4 = '[out:json][timeout:15];(node["name"~"Mercadona",i](39.60,2.68,39.64,2.74);way["name"~"Mercadona",i](39.60,2.68,39.64,2.74););out center;';
  const r4 = await overpassQuery(q4);
  console.log('Marratxí area:');
  if(r4?.elements) r4.elements.forEach(e => {
    console.log('  ', e.tags?.name, e.lat||e.center?.lat, e.lon||e.center?.lon, e.tags?.['addr:street']);
  });

  // Sa Pobla
  const q5 = '[out:json][timeout:15];(node["name"~"Mercadona",i](39.75,3.01,39.78,3.04);way["name"~"Mercadona",i](39.75,3.01,39.78,3.04););out center;';
  const r5 = await overpassQuery(q5);
  console.log('Sa Pobla area:');
  if(r5?.elements) r5.elements.forEach(e => {
    console.log('  ', e.tags?.name, e.lat||e.center?.lat, e.lon||e.center?.lon, e.tags?.['addr:street']);
  });
})();
