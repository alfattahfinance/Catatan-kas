const CACHE_NAME = "catatan-kas-v4";
const BASE = self.registration.scope;

const urlsToCache = [
    BASE,
    BASE + "index.html",
    BASE + "manifest.json",

    // CSS
    BASE + "css/style.css",
    BASE + "css/theme.css?v=20260816",

    // JavaScript
    BASE + "js/app.js",
    BASE + "js/theme.js",
    BASE + "js/auth-guard.js",
    BASE + "js/firebase-config.js",

    // Logo
    BASE + "assets/logo-catatan-kas.png"
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
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                    return undefined;
                })
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", event => {
    if (event.request.method !== "GET") return;

    const url = new URL(event.request.url);
    const isTheme = url.pathname.endsWith("/css/theme.css");
    const isPage = event.request.mode === "navigate" ||
        url.pathname.endsWith(".html");

    // Theme and HTML must not stay stuck on an old cached version.
    if (isTheme || isPage) {
        event.respondWith(
            fetch(event.request)
                .then(networkResponse => {
                    if (networkResponse && networkResponse.status === 200) {
                        const clone = networkResponse.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, clone);
                        });
                    }
                    return networkResponse;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) return cachedResponse;

                return fetch(event.request)
                    .then(networkResponse => {
                        if (!networkResponse || networkResponse.status !== 200) {
                            return networkResponse;
                        }

                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, responseClone);
                        });

                        return networkResponse;
                    })
                    .catch(() => {
                        if (event.request.mode === "navigate") {
                            return caches.match(BASE + "index.html");
                        }
                    });
            })
    );
});

self.addEventListener("message", event => {
    if (event.data && event.data.type === "SKIP_WAITING") {
        self.skipWaiting();
    }
});
