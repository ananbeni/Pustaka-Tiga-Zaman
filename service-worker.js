
const CACHE_NAME = "pustaka-tiga-zaman-v2";

const APP_FILES = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.png"
];

// Memasang cache awal
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_FILES);
    })
  );

  self.skipWaiting();
});

// Mengaktifkan versi baru
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) =>
            key.startsWith("pustaka-tiga-zaman-") &&
            key !== CACHE_NAME
          )
          .map((key) => caches.delete(key))
      );
    })
  );

  self.clients.claim();
});

// Menangani halaman dan aset lokal
self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  const isNavigation = request.mode === "navigate";

  const isStatic =
    /\.(css|js|png|jpg|jpeg|webp|svg|ico|woff2?)$/i.test(url.pathname) ||
    url.pathname === "/manifest.json";

  if (!isNavigation && !isStatic) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      try {
        const response = await fetch(request);

        if (response.ok && response.type === "basic") {
          await cache.put(request, response.clone());
        }

        return response;
      } catch (error) {
        const cached = await caches.match(request);

        if (cached) return cached;

        if (isNavigation) {
          const halamanUtama = await caches.match("/index.html");

          if (halamanUtama) return halamanUtama;
        }

        return new Response("Konten tidak tersedia saat offline.", {
          status: 503,
          headers: {
            "Content-Type": "text/plain; charset=utf-8"
          }
        });
      }
    })()
  );
});
