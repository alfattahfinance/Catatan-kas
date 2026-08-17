const CACHE_NAME = "catatan-kas-v7";
const BASE = self.registration.scope;
const LOGO_URL = new URL("logo-catatan-kas.jpg", BASE).href;
const ICON_URL = new URL("icon-192.png", BASE).href;

const urlsToCache = [
    BASE,
    BASE + "index.html",
    BASE + "laporan.html",
    BASE + "santri.html",
    BASE + "manifest.json",
    BASE + "style.css",
    BASE + "theme.css?v=20260817",
    BASE + "js/app.js",
    BASE + "js/theme.js",
    BASE + "js/auth-guard.js",
    BASE + "js/firebase-config.js",
    BASE + "logo-catatan-kas.jpg",
    BASE + "icon-192.png"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys()
            .then(cacheNames => Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) return caches.delete(cacheName);
                    return undefined;
                })
            ))
            .then(() => self.clients.claim())
    );
});

async function logoResponse(request) {
    const pathname = new URL(request.url).pathname.toLowerCase();
    const isOldAssetLogo = pathname.endsWith("/assets/logo-catatan-kas.jpg") ||
        pathname.endsWith("/assets/logo-catatan-kas.png");

    if (isOldAssetLogo) {
        const cached = await caches.match(LOGO_URL);
        if (cached && cached.ok) return cached;
        try {
            const response = await fetch(LOGO_URL, { cache: "no-cache" });
            if (response.ok) {
                const cache = await caches.open(CACHE_NAME);
                await cache.put(LOGO_URL, response.clone());
            }
            return response;
        } catch (_) {
            return caches.match(ICON_URL);
        }
    }

    const cached = await caches.match(request);
    if (cached && cached.ok) return cached;

    try {
        const response = await fetch(request, { cache: "no-cache" });
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, response.clone());
            return response;
        }
    } catch (_) {}

    const fallback = await caches.match(LOGO_URL);
    if (fallback && fallback.ok) return fallback;
    return caches.match(ICON_URL);
}

self.addEventListener("fetch", event => {
    if (event.request.method !== "GET") return;

    const url = new URL(event.request.url);
    const isTheme = url.pathname.endsWith("/css/theme.css") ||
        url.pathname.endsWith("/theme.css");
    const isPage = event.request.mode === "navigate" ||
        url.pathname.endsWith(".html");
    const isImage = event.request.destination === "image" ||
        /\.(png|jpe?g|webp|gif|svg)$/i.test(url.pathname);

    if (isTheme || isPage) {
        event.respondWith(
            fetch(event.request, { cache: "no-cache" })
                .then(networkResponse => {
                    if (networkResponse && networkResponse.status === 200) {
                        const clone = networkResponse.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                    }
                    return networkResponse;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    if (isImage) {
        event.respondWith(logoResponse(event.request));
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) return cachedResponse;
                return fetch(event.request)
                    .then(networkResponse => {
                        if (!networkResponse || networkResponse.status !== 200) return networkResponse;
                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
                        return networkResponse;
                    })
                    .catch(() => {
                        if (event.request.mode === "navigate") return caches.match(BASE + "index.html");
                    });
            })
    );
});

self.addEventListener("message", event => {
    if (event.data && event.data.type === "SKIP_WAITING") {
        self.skipWaiting();
    }
});
