const CACHE = 'mallorca-v2';
const STATIC_ASSETS = [
  '/mallorca-directory/favicon.ico',
  '/mallorca-directory/manifest.json',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  const isNav = e.request.mode === 'navigate';
  const isStatic = url.pathname.match(/\.(js|css|png|ico|json)$/);
  const isFirebase = url.hostname.includes('firestore') || url.hostname.includes('firebase');

  if (isFirebase) {
    e.respondWith(networkFirst(e.request));
  } else if (isNav) {
    e.respondWith(networkFirst(e.request));
  } else if (isStatic) {
    e.respondWith(cacheFirst(e.request));
  }
});

async function cacheFirst(req) {
  const cached = await caches.match(req);
  return cached || fetch(req);
}

async function networkFirst(req) {
  try {
    const res = await fetch(req);
    const cache = await caches.open(CACHE);
    cache.put(req, res.clone());
    return res;
  } catch {
    return caches.match(req);
  }
}
