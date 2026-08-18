(function () {
    "use strict";

    const SETTINGS_KEY = "pengaturanAplikasi";
    const THEME_KEY = "themeMode";
    const LOGO_KEY = "logoDashboard";
    const DEFAULT_LOGO_FILE = "logo-catatan-kas.jpg";
    const FALLBACK_LOGO_FILE = "icon-192.png";

    function getSettings() {
        try {
            const data = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
            return data && typeof data === "object" ? data : {};
        } catch (_) {
            return {};
        }
    }

    function saveSettings(settings) {
        try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (_) {}
    }

    function getSavedTheme() {
        const settings = getSettings();
        if (["dark", "light", "system"].includes(settings.tema)) return settings.tema;
        try {
            const saved = localStorage.getItem(THEME_KEY);
            if (["dark", "light", "system"].includes(saved)) return saved;
        } catch (_) {}
        return "light";
    }

    function resolveTheme(theme) {
        if (theme === "system") {
            try { return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"; }
            catch (_) { return "light"; }
        }
        return theme === "dark" ? "dark" : "light";
    }

    function applyTheme(theme, simpan = true) {
        if (!["dark", "light", "system"].includes(theme)) theme = "light";
        const resolvedTheme = resolveTheme(theme);
        const isDark = resolvedTheme === "dark";
        document.documentElement.setAttribute("data-theme", resolvedTheme);
        document.documentElement.classList.toggle("dark-mode", isDark);
        document.body?.classList.toggle("dark-mode", isDark);
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) metaTheme.setAttribute("content", isDark ? "#121212" : "#198754");
        if (simpan) {
            try { localStorage.setItem(THEME_KEY, theme); } catch (_) {}
            const settings = getSettings();
            settings.tema = theme;
            saveSettings(settings);
        }
        window.dispatchEvent(new CustomEvent("themeChanged", { detail: { theme, resolvedTheme, dark: isDark } }));
    }

    function absoluteFile(file) {
        try { return new URL(file, document.baseURI).href; }
        catch (_) { return file; }
    }

    function normalizeLogo(value) {
        if (!value || typeof value !== "string") return null;
        const logo = value.trim();
        if (!logo) return null;
        if (
            logo === "assets/logo-catatan-kas.jpg" ||
            logo === "assets/logo-catatan-kas.png" ||
            logo === "logo-catatan-kas.png"
        ) return null;
        if (/^data:image\//i.test(logo)) return logo;
        if (/^blob:/i.test(logo)) return logo;
        if (/^(https?:\/\/|\.\/|\/|[\w.-]+\/)/i.test(logo)) return logo;
        if (/^[\w.-]+\.(jpe?g|png|webp|gif|svg)$/i.test(logo)) return logo;
        return null;
    }

    function getLogo() {
        const settings = getSettings();
        let saved = null;
        try { saved = localStorage.getItem(LOGO_KEY); } catch (_) {}

        const candidates = [saved, settings.logoDashboard, settings.logo];
        for (const candidate of candidates) {
            const normalized = normalizeLogo(candidate);
            if (normalized) return normalized;
        }
        return absoluteFile(DEFAULT_LOGO_FILE);
    }

    function applyOneLogo(img, logo) {
        if (!img || img.tagName !== "IMG") return;
        img.removeAttribute("srcset");
        img.removeAttribute("data-src");
        img.setAttribute("data-catatan-kas-logo", "true");

        if (!img.dataset.logoFallbackBound) {
            img.dataset.logoFallbackBound = "true";
            img.addEventListener("error", function () {
                const fallback = absoluteFile(FALLBACK_LOGO_FILE);
                if (img.getAttribute("src") !== fallback) img.src = fallback;
            });
        }

        if (img.getAttribute("src") !== logo) {
            img.removeAttribute("data-logo-sync-applied");
            img.src = logo;
        }
    }

    let applyingLogo = false;
    function applyLogo() {
        if (applyingLogo) return;
        applyingLogo = true;
        try {
            const logo = getLogo();
            const selector = [
                ".app-logo", ".ck-logo", ".logo", ".top .logo", ".topbar .logo",
                "#logoDashboard", "#dashboardLogo", "#logoPreviewV2", "#logoPreview",
                "#previewLogoDashboard", "#laporanLogo", "#logo",
                "img[alt='Logo Dashboard']", "img[alt='Logo aplikasi']",
                "img[alt='Logo Catatan Kas']", "[data-dashboard-logo]"
            ].join(",");
            document.querySelectorAll(selector).forEach(img => applyOneLogo(img, logo));
        } finally {
            applyingLogo = false;
        }
    }

    function setupLogoSync() {
        applyLogo();

        // Pengaturan dan halaman lain dapat mengganti src logo setelah theme.js berjalan.
        // Dengarkan event tersebut agar logo pilihan pengguna selalu menang.
        window.addEventListener("logoDashboardChanged", applyLogo);
        window.addEventListener("storage", event => {
            if (event.key === LOGO_KEY || event.key === SETTINGS_KEY) applyLogo();
        });
        window.addEventListener("pageshow", applyLogo);
        window.addEventListener("focus", applyLogo);

        if (window.MutationObserver) {
            let queued = false;
            const observer = new MutationObserver(mutations => {
                const relevant = mutations.some(m => {
                    if (m.type === "childList") return true;
                    if (m.type === "attributes" && m.attributeName === "src") {
                        return m.target?.matches?.(
                            ".app-logo, .ck-logo, .logo, .top .logo, .topbar .logo, #logoDashboard, #dashboardLogo, #laporanLogo, #logo, img[alt='Logo Dashboard'], img[alt='Logo aplikasi'], img[alt='Logo Catatan Kas'], [data-dashboard-logo]"
                        );
                    }
                    return false;
                });
                if (!relevant || queued) return;
                queued = true;
                requestAnimationFrame(() => {
                    queued = false;
                    applyLogo();
                });
            });
            observer.observe(document.documentElement, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ["src"]
            });
        }

        // Beberapa halaman mengisi header setelah script lain selesai.
        setTimeout(applyLogo, 0);
        setTimeout(applyLogo, 250);
        setTimeout(applyLogo, 1000);
    }

    function toggleTheme() {
        const current = document.documentElement.classList.contains("dark-mode");
        applyTheme(current ? "light" : "dark", true);
    }

    function setupThemeToggle() {
        document.addEventListener("click", event => {
            const tombol = event.target.closest("#themeToggle, [data-theme-toggle]");
            if (!tombol) return;
            event.preventDefault();
            toggleTheme();
        });
    }

    function setupSystemThemeListener() {
        if (!window.matchMedia) return;
        const media = window.matchMedia("(prefers-color-scheme: dark)");
        const handleChange = () => { if (getSavedTheme() === "system") applyTheme("system", false); };
        if (typeof media.addEventListener === "function") media.addEventListener("change", handleChange);
        else if (typeof media.addListener === "function") media.addListener(handleChange);
    }

    function startThemeManager() {
        applyTheme(getSavedTheme(), false);
        setupThemeToggle();
        setupSystemThemeListener();
        setupLogoSync();
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", startThemeManager, { once: true });
    else startThemeManager();

    window.themeManager = {
        getTheme: getSavedTheme,
        setTheme: applyTheme,
        toggle: toggleTheme,
        init: startThemeManager,
        resolve: resolveTheme,
        getLogo,
        applyLogo
    };
})();
