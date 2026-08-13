(function () {
    "use strict";

    const THEME_KEY = "themeMode";
    const SETTINGS_KEY = "pengaturanAplikasi";

    function getSettings() {
        try {
            return JSON.parse(
                localStorage.getItem(SETTINGS_KEY)
            ) || {};
        } catch (error) {
            return {};
        }
    }

    function getSavedTheme() {
        // Prioritas utama: themeMode
        const saved = localStorage.getItem(THEME_KEY);

        if (
            saved === "dark" ||
            saved === "light" ||
            saved === "system"
        ) {
            return saved;
        }

        // Kompatibel dengan pengaturan lama
        const settings = getSettings();

        if (
            settings.tema === "dark" ||
            settings.tema === "light" ||
            settings.tema === "system"
        ) {
            return settings.tema;
        }

        return "light";
    }

    function resolveTheme(theme) {
        if (theme === "system") {
            return window.matchMedia(
                "(prefers-color-scheme: dark)"
            ).matches
                ? "dark"
                : "light";
        }

        return theme === "dark"
            ? "dark"
            : "light";
    }

    function applyTheme(theme, simpan = true) {

        const resolvedTheme =
            resolveTheme(theme);

        const isDark =
            resolvedTheme === "dark";

        // Class utama untuk seluruh aplikasi
        document.body.classList.toggle(
            "dark-mode",
            isDark
        );

        // Data theme untuk CSS global
        document.documentElement.setAttribute(
            "data-theme",
            resolvedTheme
        );

        document.documentElement.classList.toggle(
            "dark-mode",
            isDark
        );

        if (simpan) {

            // Simpan sistem tema utama
            localStorage.setItem(
                THEME_KEY,
                theme
            );

            // Sinkronkan dengan pengaturan aplikasi lama
            try {

                const settings =
                    getSettings();

                settings.tema =
                    theme;

                localStorage.setItem(
                    SETTINGS_KEY,
                    JSON.stringify(settings)
                );

            } catch (error) {
                console.warn(
                    "Gagal menyimpan tema.",
                    error
                );
            }
        }

        window.dispatchEvent(
            new CustomEvent(
                "themeChanged",
                {
                    detail: {
                        theme: theme,
                        resolvedTheme:
                            resolvedTheme,
                        dark: isDark
                    }
                }
            )
        );
    }

    function initTheme() {

        const savedTheme =
            getSavedTheme();

        applyTheme(
            savedTheme,
            false
        );
    }

    function toggleTheme() {

        const current =
            document.body.classList.contains(
                "dark-mode"
            )
                ? "dark"
                : "light";

        applyTheme(
            current === "dark"
                ? "light"
                : "dark"
        );
    }

    // Terapkan tema
    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            initTheme
        );

    } else {

        initTheme();

    }

    // Tombol Dark Mode
    document.addEventListener(
        "click",
        function (event) {

            const tombol =
                event.target.closest(
                    "#themeToggle, [data-theme-toggle]"
                );

            if (!tombol) {
                return;
            }

            event.preventDefault();

            toggleTheme();
        }
    );

    // Jika tema sistem berubah
    if (
        window.matchMedia
    ) {

        const media =
            window.matchMedia(
                "(prefers-color-scheme: dark)"
            );

        media.addEventListener(
            "change",
            function () {

                if (
                    getSavedTheme() ===
                    "system"
                ) {
                    initTheme();
                }

            }
        );
    }

    // Bisa dipanggil halaman lain
    window.themeManager = {

        getTheme:
            getSavedTheme,

        setTheme:
            applyTheme,

        toggle:
            toggleTheme,

        init:
            initTheme
    };

})();
