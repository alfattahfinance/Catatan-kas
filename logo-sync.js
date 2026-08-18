(function () {
    "use strict";

    const SETTINGS_KEY = "pengaturanAplikasi";
    const LOGO_KEY = "logoDashboard";
    const DEFAULT_LOGO = "logo-catatan-kas.jpg";
    const FALLBACK_LOGO = "icon-192.png";

    function readSettings() {
        try {
            const data = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
            return data && typeof data === "object" ? data : {};
        } catch (_) {
            return {};
        }
    }

    function normalizeLogo(value) {
        if (!value || typeof value !== "string") return DEFAULT_LOGO;
        const logo = value.trim();
        if (!logo) return DEFAULT_LOGO;

        // Path logo lama yang sudah tidak valid di APK.
        if (
            logo === "assets/logo-catatan-kas.jpg" ||
            logo === "assets/logo-catatan-kas.png" ||
            logo === "logo-catatan-kas.png"
        ) {
            return DEFAULT_LOGO;
        }

        return logo;
    }

    function getLogo() {
        try {
            const saved = localStorage.getItem(LOGO_KEY);
            if (saved) return normalizeLogo(saved);

            const settings = readSettings();
            return normalizeLogo(settings.logoDashboard || settings.logo || DEFAULT_LOGO);
        } catch (_) {
            return DEFAULT_LOGO;
        }
    }

    function applyLogo() {
        const logo = getLogo();
        const selectors = [
            ".app-logo",
            ".ck-logo",
            ".logo",
            ".logo-preview",
            "#logo",
            "#logoDashboard",
            "#dashboardLogo",
            "#laporanLogo",
            "#logoPreview",
            "#logoPreviewV2",
            "#previewLogoDashboard",
            "img[alt='Logo Dashboard']",
            "img[alt='Logo aplikasi']",
            "img[alt='Logo Catatan Kas']",
            "[data-dashboard-logo]"
        ].join(",");

        document.querySelectorAll(selectors).forEach((img) => {
            if (!img || img.tagName !== "IMG") return;
            if (img.dataset.logoSyncApplied === logo) return;

            img.dataset.logoSyncApplied = logo;
            img.removeAttribute("srcset");
            img.removeAttribute("data-src");
            img.src = logo;

            img.onerror = function () {
                if (img.dataset.logoFallback === "1") return;
                img.dataset.logoFallback = "1";
                img.src = FALLBACK_LOGO;
            };
        });
    }

    function start() {
        applyLogo();

        // Menangani header yang dibuat/dimuat setelah halaman selesai dibuka.
        if (window.MutationObserver && document.body) {
            const observer = new MutationObserver(() => applyLogo());
            observer.observe(document.body, { childList: true, subtree: true });
        }

        window.addEventListener("logoDashboardChanged", applyLogo);
        window.addEventListener("storage", (event) => {
            if (event.key === LOGO_KEY || event.key === SETTINGS_KEY) applyLogo();
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start, { once: true });
    } else {
        start();
    }
})();
