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
  // Inca area
  const q1 = `[out:json][timeout:15];(node["name"~"Mercadona",i](39.71,2.90,39.74,2.93);way["name"~"Mercadona",i](39.71,2.90,39.74,2.93););out center;`;
  const r1 = await overpassQuery(q1);
  console.log('Inca area Mercadona:');
  if(r1 && r1.elements) r1.elements.forEach(e => {
    const lat = e.lat || e.center?.lat;
    const lon = e.lon || e.center?.lon;
    console.log('  ', e.tags?.['name'], lat, lon, e.tags?.['addr:street'], e.tags?.['addr:housenumber']);
  });

  // Calvià area (wider)
  const q2 = `[out:json][timeout:15];(node["name"~"Mercadona",i](39.51,2.48,39.58,2.56);way["name"~"Mercadona",i](39.51,2.48,39.58,2.56););out center;`;
  const r2 = await overpassQuery(q2);
  console.log('Calvià area Mercadona:');
  if(r2 && r2.elements) r2.elements.forEach(e => {
    const lat = e.lat || e.center?.lat;
    const lon = e.lon || e.center?.lon;
    console.log('  ', e.tags?.['name'], lat, lon, e.tags?.['addr:street'], e.tags?.['addr:housenumber']);
  });

  // Sa Pobla area
  const q3 = `[out:json][timeout:15];(node["name"~"Mercadona",i](39.75,3.00,39.79,3.04);way["name"~"Mercadona",i](39.75,3.00,39.79,3.04););out center;`;
  const r3 = await overpassQuery(q3);
  console.log('Sa Pobla area Mercadona:');
  if(r3 && r3.elements) r3.elements.forEach(e => {
    const lat = e.lat || e.center?.lat;
    const lon = e.lon || e.center?.lon;
    console.log('  ', e.tags?.['name'], lat, lon, e.tags?.['addr:street'], e.tags?.['addr:housenumber']);
  });

  // Sant Llorenç area
  const q4 = `[out:json][timeout:15];(node["name"~"Mercadona",i](39.60,3.32,39.63,3.36);way["name"~"Mercadona",i](39.60,3.32,39.63,3.36););out center;`;
  const r4 = await overpassQuery(q4);
  console.log('Sant Llorenç area Mercadona:');
  if(r4 && r4.elements) r4.elements.forEach(e => {
    const lat = e.lat || e.center?.lat;
    const lon = e.lon || e.center?.lon;
    console.log('  ', e.tags?.['name'], lat, lon, e.tags?.['addr:street'], e.tags?.['addr:housenumber']);
  });

  // Full Mallorca Mercadona scan
  const q5 = `[out:json][timeout:15];(node["name"~"Mercadona",i](39.2,2.0,40.1,3.6);way["name"~"Mercadona",i](39.2,2.0,40.1,3.6););out center;`;
  const r5 = await overpassQuery(q5);
  console.log('ALL Mallorca Mercadona from OSM:', r5?.elements?.length || 0);
  if(r5 && r5.elements) r5.elements.forEach(e => {
    const lat = e.lat || e.center?.lat;
    const lon = e.lon || e.center?.lon;
    console.log('  ', lat, lon, e.tags?.['addr:street'], e.tags?.['addr:housenumber'], e.tags?.['addr:city']);
  });
})();
