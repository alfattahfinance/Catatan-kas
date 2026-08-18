const CACHE_NAME = "catatan-kas-v8";
const BASE = self.registration.scope;
const LOGO_URL = new URL("logo-catatan-kas.jpg", BASE).href;
const ICON_URL = new URL("icon-192.png", BASE).href;
const LOGO_SYNC_URL = new URL("logo-sync.js?v=2", BASE).href;

const urlsToCache = [
    BASE,
    BASE + "index.html",
    BASE + "laporan.html",
    BASE + "santri.html",
    BASE + "pembayaran.html",
    BASE + "pengeluaran.html",
    BASE + "rekap.html",
    BASE + "pengaturan.html",
    BASE + "manifest.json",
    BASE + "style.css",
    BASE + "theme.css?v=20260817",
    BASE + "theme.js",
    BASE + "logo-sync.js?v=2",
    BASE + "icon-192.png",
    BASE + "logo-catatan-kas.jpg"
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
        pathname.endsWith("/assets/logo-catatan-kas.png") ||
        pathname.endsWith("/logo-catatan-kas.png");

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

async function preparePageResponse(response) {
    if (!response || !response.ok) return response;
    const type = response.headers.get("content-type") || "";
    if (!type.includes("text/html")) return response;

    try {
        const text = await response.text();
        if (text.includes("logo-sync.js")) return new Response(text, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers
        });

        const injected = text.replace(
            /<\/head>/i,
            '<script src="logo-sync.js?v=2"></script></head>'
        );

        return new Response(injected, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers
        });
    } catch (_) {
        return response;
    }
}

self.addEventListener("fetch", event => {
    if (event.request.method !== "GET") return;

    const url = new URL(event.request.url);
    const isTheme = url.pathname.endsWith("/css/theme.css") ||
        url.pathname.endsWith("/theme.css") ||
        url.pathname.endsWith("/theme.js");
    const isPage = event.request.mode === "navigate" ||
        url.pathname.endsWith(".html");
    const isImage = event.request.destination === "image" ||
        /\.(png|jpe?g|webp|gif|svg)$/i.test(url.pathname);

    if (isTheme || isPage) {
        event.respondWith(
            fetch(event.request, { cache: "no-cache" })
                .then(async networkResponse => {
                    if (!networkResponse || networkResponse.status !== 200) return networkResponse;
                    const prepared = isPage ? await preparePageResponse(networkResponse) : networkResponse;
                    const clone = prepared.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                    return prepared;
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
