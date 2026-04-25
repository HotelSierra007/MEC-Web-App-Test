// MEC 2026 — Service Worker with safe caching
const CACHE = "mec2026-v2";
const PRECACHE = ["/", "/index.html", "/CMUMEC_Regular_White.png", "/manifest.json"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  // CRITICAL: ignore chrome-extension and non-http requests
  if (!e.request.url.startsWith("http")) return;
  if (e.request.method !== "GET") return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      const network = fetch(e.request).then(res => {
        // Only cache same-origin and known CDN responses
        if (res.ok && (
          e.request.url.includes(self.location.origin) ||
          e.request.url.includes("fonts.googleapis.com") ||
          e.request.url.includes("fonts.gstatic.com")
        )) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => cached); // return cache if network fails
      return cached || network;
    })
  );
});
