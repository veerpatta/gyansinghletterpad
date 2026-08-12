/* ═══════════════════════════════════════════════════════════════
   sw.js — cache-first app shell.
   The app has no server to talk to, so once it is cached it works
   with no signal at all. Bump CACHE on every release.
   ═══════════════════════════════════════════════════════════════ */

const CACHE = 'gsl-v1';

const SHELL = [
  '.', 'index.html', 'manifest.webmanifest',
  'css/app.css', 'css/page.css',
  'js/app.js', 'js/store.js', 'js/render.js', 'js/pdf.js',
  'js/voice.js', 'js/format.js', 'js/templates.js',
  'vendor/html2canvas.min.js', 'vendor/jspdf.umd.min.js',
  'fonts/NotoSansDevanagari-dev.woff2', 'fonts/NotoSansDevanagari-latin.woff2',
  'assets/icon-192.png', 'assets/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    // addAll fails the whole install if any one file 404s (assets/header.jpg
    // is optional), so add them individually and tolerate misses
    await Promise.all(SHELL.map(u => c.add(u).catch(err => console.warn('[sw] skip', u, err))));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;

  e.respondWith((async () => {
    const hit = await caches.match(req, { ignoreSearch: true });
    if (hit) {
      // refresh in the background so an update lands on the next launch
      e.waitUntil(fetch(req).then(r => r.ok && caches.open(CACHE).then(c => c.put(req, r))).catch(() => {}));
      return hit;
    }
    try {
      const res = await fetch(req);
      if (res.ok) { const c = await caches.open(CACHE); c.put(req, res.clone()); }
      return res;
    } catch {
      return (await caches.match('index.html')) || Response.error();
    }
  })());
});
