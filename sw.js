// MEC 2026 — Service Worker
// Strategy:
//   • HTML shell (index.html, navigations) → network-first, fall back to cache.
//     This means edits you push live appear on the next reload, not the one after.
//   • Static assets (images, fonts, icons) → stale-while-revalidate.
//     Fast to load, refreshed in background.
//   • data.json → network-first with short cache fallback so announcements
//     stay live but still work offline.
//
// Bump CACHE when you change PRECACHE or want to force a cold refresh.

const CACHE = "mec2026-v3";

// Critical-path assets precached on install.
// These are the things an attendee MUST have before going offline (e.g. inside
// a building with weak signal). Wayfinding photos are added opportunistically
// the first time the user opens the Map tab.
const PRECACHE = [
  "/",
  "/index.html",
  "/manifest.json",
  "/data.json",
  "/CMUMEC_Regular_White.png",
  "/icon-192.png",
  "/icon-512.png",
  "/aed_50pi.jpg",
  "/aed_rr2.jpg",
  "/aed_rr6.jpg",
  "/aed_rn1.jpg",
  "/aed_cb15.jpg",
  "/aed_sj1.jpg",
  "/aed_sj15.jpg",
  "/aed_dorm.jpg"
];

// Hosts whose responses we are allowed to cache at runtime.
// Anything outside this list is fetched but not stored.
const CACHEABLE_HOSTS = [
  self.location.origin,
  "https://fonts.googleapis.com",
  "https://fonts.gstatic.com",
  "https://cmu-imc.med.cmu.ac.th"
];

const isCacheable = url => CACHEABLE_HOSTS.some(h => url.startsWith(h));
const isHTML = req => req.mode === "navigate" || req.destination === "document";
const isData = url => url.endsWith("/data.json") || url.endsWith("data.json");

// ─── INSTALL ─────────────────────────────────────────────────────────────
// Use Promise.allSettled + individual cache.put rather than cache.addAll so a
// single missing asset (typo, 404) doesn't fail the entire install and leave
// the app with no service worker at all.
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(cache =>
      Promise.allSettled(
        PRECACHE.map(url =>
          fetch(url, { cache: "reload" })
            .then(res => res.ok && cache.put(url, res))
            .catch(() => null)
        )
      )
    )
  );
  self.skipWaiting();
});

// ─── ACTIVATE ────────────────────────────────────────────────────────────
// Delete old caches so previous deploys don't linger and eat storage quota.
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ─── FETCH ───────────────────────────────────────────────────────────────
self.addEventListener("fetch", e => {
  const req = e.request;
  if (!req.url.startsWith("http")) return;       // chrome-extension://, data:, etc.
  if (req.method !== "GET") return;

  // HTML shell + data.json → network-first.
  // Live edits land on next reload. Falls back to cache when offline.
  if (isHTML(req) || isData(req.url)) {
    e.respondWith(
      fetch(req)
        .then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(req, clone));
          }
          return res;
        })
        .catch(() =>
          caches.match(req).then(cached => cached || caches.match("/index.html"))
        )
    );
    return;
  }

  // Everything else → stale-while-revalidate.
  // Serve cache immediately if present, fetch in the background to update.
  e.respondWith(
    caches.match(req).then(cached => {
      const network = fetch(req)
        .then(res => {
          // Skip opaque (cross-origin no-cors) and error responses.
          if (res.ok && res.type !== "opaque" && isCacheable(req.url)) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(req, clone));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
