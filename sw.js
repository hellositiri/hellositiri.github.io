// Sitiri offline support. Keeps a copy of the site on this computer so it opens without internet.
// It only ever handles the site's own files. Documents you load into Sitiri never pass through here.
const VERSION = 'sitiri-1.8.5';
const FILES = [
  './', 'index.html', 'tool.html', 'terms.html', 'sitiri.css', 'front.css', 'img/hero.jpg', 'img/signing.jpg', 'img/meeting.jpg', 'img/sunset.jpg', 'tool-look.css', 'convert.js', 'names.js', 'words.js', 'manifest.webmanifest', 'LICENSES.txt',
  'icons/icon-64.png', 'icons/icon-192.png', 'icons/icon-512.png',
  'fonts/atkinson-hyperlegible-latin-400-normal.woff2', 'fonts/atkinson-hyperlegible-latin-400-italic.woff2',
  'fonts/atkinson-hyperlegible-latin-700-normal.woff2', 'fonts/bricolage-grotesque-latin-wght-normal.woff2', 'fonts/bodoni-moda-latin-opsz-normal.woff2', 'fonts/bodoni-moda-latin-wght-italic.woff2',
  'vendor/pdfjs/pdf.min.mjs', 'vendor/pdfjs/pdf.worker.min.mjs'
];
// The scan reader is larger, so it is fetched in the background once the tool has been opened.
const SCAN_READER = [
  'vendor/tesseract/tesseract.min.js', 'vendor/tesseract/worker.min.js',
  'vendor/tesseract/core/tesseract-core-relaxedsimd-lstm.wasm.js', 'vendor/tesseract/lang/eng.traineddata.gz'
];
self.addEventListener('message', (e) => {
  if (e.data !== 'warm') return;
  e.waitUntil(caches.open(VERSION).then((c) => Promise.all(SCAN_READER.map((u) => c.match(u).then((hit) => hit || c.add(u))))).catch(() => {}));
});
self.addEventListener('install', (e) => {
  // cache: 'reload' skips the browser's own short-term cache, so a new version never stores old files.
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES.map((u) => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
// Online: always ask the website first (a quick check if nothing changed), so updates show at once.
// Offline: use the copy kept on this computer.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(fetch(req.url, { cache: 'no-cache' }).then((res) => {
    if (res && res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req, { ignoreSearch: true })));
});
