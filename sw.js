// MEC 2026 — Service Worker with safe caching
const CACHE = "mec2026-v3";

const PRECACHE = [
  "./",
  "./index.html",
  "./CMUMEC_Regular_White.png",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  // AED images — must be precached so they work in standalone PWA mode
  "./aed_50pi.jpg",
  "./aed_rr1.jpg",
  "./aed_rr2.jpg",
  "./aed_rr6.jpg",
  "./aed_rn1.jpg",
  "./aed_cb15.jpg",
  "./aed_sj1.jpg",
  "./aed_sj15.jpg",
  "./aed_dorm.jpg"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      // addAll is atomic — if one fails, none cache. Use individual adds for resilience.
      Promise.all(
        PRECACHE.map(url =>
          c.add(url).catch(err => console.warn("[SW] precache failed:", url, err))
        )
      )
    )
  );
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
  if (!e.request.url.startsWith("http")) return;
  if (e.request.method !== "GET") return;

  const url = new URL(e.request.url);
  const sameOrigin = url.origin === self.location.origin;
  const isFont =
    url.hostname === "fonts.googleapis.com" ||
    url.hostname === "fonts.gstatic.com";

  // Cache-first for images: serve from cache if present, otherwise fetch + cache.
  // This is what fixes the broken AED images in PWA standalone mode.
  const isImage =
    e.request.destination === "image" ||
    /\.(png|jpe?g|webp|gif|svg)$/i.test(url.pathname);

  if (isImage && sameOrigin) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request)
          .then(res => {
            if (res.ok) {
              const clone = res.clone();
              caches.open(CACHE).then(c => c.put(e.request, clone));
            }
            return res;
          })
          .catch(() => caches.match("./index.html")); // last-resort fallback, never undefined
      })
    );
    return;
  }

  // Stale-while-revalidate for everything else (HTML, CSS, JS, fonts)
  e.respondWith(
    caches.match(e.request).then(cached => {
      const network = fetch(e.request)
        .then(res => {
          if (res.ok && (sameOrigin || isFont)) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
