// ==========================================
// CATATAN KAS - SERVICE WORKER
// ==========================================

const CACHE_NAME = "catatan-kas-v3";

const BASE = self.registration.scope;

// ==========================================
// FILE YANG DI-CACHE
// ==========================================

const urlsToCache = [
    BASE,
    BASE + "index.html",

    // CSS
    BASE + "css/style.css",
    BASE + "css/theme.css",

    // JavaScript
    BASE + "js/app.js",
    BASE + "js/theme.js",
    BASE + "js/auth-guard.js",
    BASE + "js/firebase-config.js",

    // Manifest
    BASE + "manifest.json",

    // LOGO
    BASE + "assets/logo-catatan-kas.png"
];


// ==========================================
// INSTALL
// ==========================================

self.addEventListener("install", event => {

    event.waitUntil(

        caches.open(CACHE_NAME)

            .then(cache => {

                console.log(
                    "Catatan Kas: menyimpan cache..."
                );

                return cache.addAll(urlsToCache);

            })

            .then(() => {

                console.log(
                    "Catatan Kas: cache berhasil."
                );

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

                        if (
                            cacheName !== CACHE_NAME
                        ) {

                            console.log(
                                "Menghapus cache lama:",
                                cacheName
                            );

                            return caches.delete(
                                cacheName
                            );

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

    // Hanya tangani request GET
    if (event.request.method !== "GET") {
        return;
    }

    event.respondWith(

        caches.match(event.request)

            .then(cachedResponse => {

                // Jika ada di cache
                if (cachedResponse) {

                    return cachedResponse;

                }

                // Jika belum ada → ambil dari internet
                return fetch(event.request)

                    .then(networkResponse => {

                        // Jangan cache response yang tidak valid
                        if (
                            !networkResponse ||
                            networkResponse.status !== 200 ||
                            networkResponse.type === "opaque"
                        ) {

                            return networkResponse;

                        }

                        // Simpan salinan ke cache
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

                        // Jika offline dan halaman tidak ada
                        // di cache
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
// PESAN DARI HALAMAN
// ==========================================

self.addEventListener("message", event => {

    if (!event.data) {
        return;
    }

    if (
        event.data.type ===
        "SKIP_WAITING"
    ) {

        self.skipWaiting();

    }

});
