(function () {
    "use strict";

    const SETTINGS_KEY = "pengaturanAplikasi";
    const THEME_KEY = "themeMode";
    const LOGO_KEY = "logoDashboard";
    const LOGO_DEFAULT = "logo-catatan-kas.jpg";

    function getSettings() {
        try {
            const data = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
            return data && typeof data === "object" ? data : {};
        } catch (error) {
            console.warn("Gagal membaca pengaturan aplikasi:", error);
            return {};
        }
    }

    function saveSettings(settings) {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        } catch (error) {
            console.warn("Gagal menyimpan pengaturan aplikasi:", error);
        }
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
            try {
                return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
            } catch (_) {
                return "light";
            }
        }
        return theme === "dark" ? "dark" : "light";
    }

    function applyTheme(theme, simpan = true) {
        if (!["dark", "light", "system"].includes(theme)) theme = "light";
        const resolvedTheme = resolveTheme(theme);
        const isDark = resolvedTheme === "dark";
        const html = document.documentElement;
        const body = document.body;

        html.setAttribute("data-theme", resolvedTheme);
        html.classList.toggle("dark-mode", isDark);
        body?.classList.toggle("dark-mode", isDark);

        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) metaTheme.setAttribute("content", isDark ? "#121212" : "#198754");

        if (simpan) {
            try { localStorage.setItem(THEME_KEY, theme); } catch (_) {}
            const settings = getSettings();
            settings.tema = theme;
            saveSettings(settings);
        }

        window.dispatchEvent(new CustomEvent("themeChanged", {
            detail: { theme, resolvedTheme, dark: isDark }
        }));
    }

    // =====================================================
    // LOGO DASHBOARD GLOBAL
    // Satu sumber logo untuk seluruh halaman aplikasi.
    // =====================================================

    function getLogo() {
        try {
            const saved = localStorage.getItem(LOGO_KEY);
            if (!saved || saved === "assets/logo-catatan-kas.jpg" || saved === "assets/logo-catatan-kas.png") {
                return LOGO_DEFAULT;
            }
            return saved;
        } catch (_) {
            return LOGO_DEFAULT;
        }
    }

    function applyLogo() {
        const logo = getLogo();
        const selector = [
            ".app-logo",
            ".ck-logo",
            ".logo",
            "#logo",
            "#logoDashboard",
            "#dashboardLogo",
            "#logoPreviewV2",
            "#logoPreview",
            "#previewLogoDashboard",
            "img[alt='Logo Dashboard']",
            "img[alt='Logo aplikasi']",
            "img[alt='Logo Catatan Kas']",
            "[data-dashboard-logo]"
        ].join(",");

        document.querySelectorAll(selector).forEach((img) => {
            if (img && img.tagName === "IMG") {
                img.src = logo;
                img.removeAttribute("srcset");
                img.removeAttribute("data-src");
            }
        });
    }

    function setupLogoSync() {
        applyLogo();
        window.addEventListener("logoDashboardChanged", applyLogo);
        window.addEventListener("storage", (event) => {
            if (event.key === LOGO_KEY || event.key === SETTINGS_KEY) applyLogo();
        });
        window.addEventListener("pageshow", applyLogo);
        window.addEventListener("focus", applyLogo);
    }

    function toggleTheme() {
        const current = document.documentElement.classList.contains("dark-mode");
        applyTheme(current ? "light" : "dark", true);
    }

    function setupThemeToggle() {
        document.addEventListener("click", (event) => {
            const tombol = event.target.closest("#themeToggle, [data-theme-toggle]");
            if (!tombol) return;
            event.preventDefault();
            toggleTheme();
        });
    }

    function setupSystemThemeListener() {
        if (!window.matchMedia) return;
        const media = window.matchMedia("(prefers-color-scheme: dark)");
        const handleChange = () => {
            if (getSavedTheme() === "system") applyTheme("system", false);
        };
        if (typeof media.addEventListener === "function") media.addEventListener("change", handleChange);
        else if (typeof media.addListener === "function") media.addListener(handleChange);
    }

    function initTheme() {
        applyTheme(getSavedTheme(), false);
        applyLogo();
    }

    function startThemeManager() {
        initTheme();
        setupThemeToggle();
        setupSystemThemeListener();
        setupLogoSync();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", startThemeManager);
    } else {
        startThemeManager();
    }

    window.themeManager = {
        getTheme: getSavedTheme,
        setTheme: applyTheme,
        toggle: toggleTheme,
        init: initTheme,
        resolve: resolveTheme,
        getLogo,
        applyLogo
    };
})();
