(function () {
    "use strict";

    /*
     * =====================================================
     * THEME MANAGER - CATATAN KAS
     * =====================================================
     *
     * Mode:
     * - light
     * - dark
     * - system
     *
     * Sumber utama:
     * localStorage "pengaturanAplikasi"
     *
     * Kompatibilitas:
     * localStorage "themeMode"
     */

    const SETTINGS_KEY = "pengaturanAplikasi";
    const THEME_KEY = "themeMode";


    /* =====================================================
       AMBIL PENGATURAN APLIKASI
    ====================================================== */

    function getSettings() {

        try {

            const data =
                localStorage.getItem(
                    SETTINGS_KEY
                );

            if (!data) {
                return {};
            }

            const settings =
                JSON.parse(data);

            return (
                settings &&
                typeof settings === "object"
            )
                ? settings
                : {};

        } catch (error) {

            console.warn(
                "Gagal membaca pengaturan aplikasi:",
                error
            );

            return {};
        }
    }


    /* =====================================================
       SIMPAN PENGATURAN APLIKASI
    ====================================================== */

    function saveSettings(settings) {

        try {

            localStorage.setItem(
                SETTINGS_KEY,
                JSON.stringify(settings)
            );

        } catch (error) {

            console.warn(
                "Gagal menyimpan pengaturan aplikasi:",
                error
            );
        }
    }


    /* =====================================================
       AMBIL TEMA TERSIMPAN
    ====================================================== */

    function getSavedTheme() {

        const settings =
            getSettings();

        /*
         * PRIORITAS UTAMA:
         * pengaturanAplikasi.tema
         */

        if (
            settings.tema === "dark" ||
            settings.tema === "light" ||
            settings.tema === "system"
        ) {

            return settings.tema;
        }


        /*
         * KOMPATIBILITAS DENGAN
         * themeMode VERSI LAMA
         */

        try {

            const saved =
                localStorage.getItem(
                    THEME_KEY
                );

            if (
                saved === "dark" ||
                saved === "light" ||
                saved === "system"
            ) {

                return saved;
            }

        } catch (error) {

            console.warn(
                "Gagal membaca themeMode:",
                error
            );
        }


        /*
         * DEFAULT
         */

        return "light";
    }


    /* =====================================================
       TENTUKAN TEMA SEBENARNYA
    ====================================================== */

    function resolveTheme(theme) {

        if (theme === "system") {

            try {

                return window.matchMedia(
                    "(prefers-color-scheme: dark)"
                ).matches
                    ? "dark"
                    : "light";

            } catch (error) {

                return "light";
            }
        }

        return theme === "dark"
            ? "dark"
            : "light";
    }


    /* =====================================================
       TERAPKAN TEMA
    ====================================================== */

    function applyTheme(
        theme,
        simpan = true
    ) {

        /*
         * Pastikan hanya menerima:
         * light / dark / system
         */

        if (
            theme !== "dark" &&
            theme !== "light" &&
            theme !== "system"
        ) {

            theme = "light";
        }


        const resolvedTheme =
            resolveTheme(theme);

        const isDark =
            resolvedTheme === "dark";


        const html =
            document.documentElement;

        const body =
            document.body;


        /* =================================================
           HTML
        ================================================= */

        html.setAttribute(
            "data-theme",
            resolvedTheme
        );

        html.classList.toggle(
            "dark-mode",
            isDark
        );


        /* =================================================
           BODY
        ================================================= */

        if (body) {

            body.classList.toggle(
                "dark-mode",
                isDark
            );
        }


        /* =================================================
           META THEME COLOR
        ================================================= */

        const metaTheme =
            document.querySelector(
                'meta[name="theme-color"]'
            );

        if (metaTheme) {

            metaTheme.setAttribute(
                "content",
                isDark
                    ? "#121212"
                    : "#198754"
            );
        }


        /* =================================================
           SIMPAN
        ================================================= */

        if (simpan) {

            /*
             * Simpan ke themeMode
             * untuk kompatibilitas
             */

            try {

                localStorage.setItem(
                    THEME_KEY,
                    theme
                );

            } catch (error) {

                console.warn(
                    "Gagal menyimpan themeMode:",
                    error
                );
            }


            /*
             * Simpan ke pengaturanAplikasi
             */

            const settings =
                getSettings();

            settings.tema =
                theme;

            saveSettings(
                settings
            );
        }


        /* =================================================
           EVENT GLOBAL
        ================================================= */

        window.dispatchEvent(
            new CustomEvent(
                "themeChanged",
                {
                    detail: {
                        theme:
                            theme,

                        resolvedTheme:
                            resolvedTheme,

                        dark:
                            isDark
                    }
                }
            )
        );
    }


    /* =====================================================
       INISIALISASI
    ====================================================== */

    function initTheme() {

        const savedTheme =
            getSavedTheme();

        applyTheme(
            savedTheme,
            false
        );
    }


    /* =====================================================
       GANTI TEMA
    ====================================================== */

    function toggleTheme() {

        const current =
            document.documentElement
                .classList
                .contains(
                    "dark-mode"
                );

        applyTheme(
            current
                ? "light"
                : "dark",
            true
        );
    }


    /* =====================================================
       TOMBOL DARK MODE
    ====================================================== */

    function setupThemeToggle() {

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
    }


    /* =====================================================
       TEMA SYSTEM
    ====================================================== */

    function setupSystemThemeListener() {

        if (
            !window.matchMedia
        ) {

            return;
        }


        const media =
            window.matchMedia(
                "(prefers-color-scheme: dark)"
            );


        const handleChange =
            function () {

                /*
                 * Hanya mengikuti perubahan
                 * sistem jika pengguna memilih
                 * mode "system".
                 */

                if (
                    getSavedTheme() ===
                    "system"
                ) {

                    initTheme();
                }
            };


        /*
         * Browser modern
         */

        if (
            typeof media.addEventListener ===
            "function"
        ) {

            media.addEventListener(
                "change",
                handleChange
            );

        }


        /*
         * Browser lama
         */

        else if (
            typeof media.addListener ===
            "function"
        ) {

            media.addListener(
                handleChange
            );
        }
    }


    /* =====================================================
       JALANKAN
    ====================================================== */

    function startThemeManager() {

        initTheme();

        setupThemeToggle();

        setupSystemThemeListener();
    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            startThemeManager
        );

    } else {

        startThemeManager();
    }


    /* =====================================================
       API GLOBAL
    ====================================================== */

    window.themeManager = {

        getTheme:
            getSavedTheme,

        setTheme:
            applyTheme,

        toggle:
            toggleTheme,

        init:
            initTheme,

        resolve:
            resolveTheme
    };

})();
