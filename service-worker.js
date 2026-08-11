const CACHE_NAME = "catatan-kas-v3";
const BASE = self.registration.scope;

const urlsToCache = [
    BASE,
    BASE + "index.html",
    BASE + "manifest.json",

    // CSS
    BASE + "css/style.css",
    BASE + "css/theme.css",

    // JavaScript
    BASE + "js/app.js",
    BASE + "js/theme.js",
    BASE + "js/auth-guard.js",
    BASE + "js/firebase-config.js",

    // Logo
    BASE + "assets/logo-catatan-kas.png"
];


// ==========================================
// INSTALL
// ==========================================

self.addEventListener("install", event => {

    event.waitUntil(

        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                return self.skipWaiting();
            })

    );

});


// ==========================================
// ACTIVATE
// ==========================================

self.addEventListener("activate", event => {

    event.waitUntil(

        caches.keys()
            .then(cacheNames => {

                return Promise.all(

                    cacheNames.map(cacheName => {

                        if (cacheName !== CACHE_NAME) {

                            return caches.delete(cacheName);

                        }

                    })

                );

            })
            .then(() => {

                return self.clients.claim();

            })

    );

});


// ==========================================
// FETCH
// ==========================================

self.addEventListener("fetch", event => {

    if (event.request.method !== "GET") {
        return;
    }

    event.respondWith(

        caches.match(event.request)

            .then(cachedResponse => {

                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(event.request)

                    .then(networkResponse => {

                        if (
                            !networkResponse ||
                            networkResponse.status !== 200
                        ) {
                            return networkResponse;
                        }

                        const responseClone =
                            networkResponse.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {

                                cache.put(
                                    event.request,
                                    responseClone
                                );

                            });

                        return networkResponse;

                    })

                    .catch(() => {

                        if (
                            event.request.mode ===
                            "navigate"
                        ) {

                            return caches.match(
                                BASE + "index.html"
                            );

                        }

                    });

            })

    );

});


// ==========================================
// UPDATE SERVICE WORKER
// ==========================================

self.addEventListener("message", event => {

    if (
        event.data &&
        event.data.type === "SKIP_WAITING"
    ) {

        self.skipWaiting();

    }

});
