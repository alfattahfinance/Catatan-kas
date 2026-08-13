(function () {
    "use strict";

    const SETTING_KEY = "pengaturanAplikasi";

    /* =====================================================
       AMBIL TEMA TERSIMPAN
    ====================================================== */

    function getSavedTheme() {
        try {
            const pengaturan = JSON.parse(localStorage.getItem(SETTING_KEY)) || {};
            return pengaturan.tema === "dark" ? "dark" : "light";
        } catch (e) {
            return "light";
        }
    }


    /* =====================================================
       TERAPKAN TEMA
    ====================================================== */

    function applyTheme(theme) {

        const normalizedTheme =
            theme === "dark"
                ? "dark"
                : "light";

        const isDark =
            normalizedTheme === "dark";


        /* BODY & HTML (Class dark-mode ditambahkan ke keduanya agar CSS global aktif) */

        document.body.classList.toggle(
            "dark-mode",
            isDark
        );

        document.documentElement.classList.toggle(
            "dark-mode",
            isDark
        );


        /* ATRIBUT HTML */

        document.documentElement.setAttribute(
            "data-theme",
            normalizedTheme
        );


        /* SIMPAN KE PENGATURAN APLIKASI */

        try {
            const pengaturan = JSON.parse(localStorage.getItem(SETTING_KEY)) || {};
            pengaturan.tema = normalizedTheme;
            localStorage.setItem(SETTING_KEY, JSON.stringify(pengaturan));
        } catch (e) {
            console.warn("Gagal menyimpan tema:", e);
        }


        /* EVENT */

        window.dispatchEvent(
            new CustomEvent(
                "themeChanged",
                {
                    detail: {
                        theme:
                            normalizedTheme,

                        dark:
                            isDark
                    }
                }
            )
        );


        /* Update tombol */

        updateThemeButtons(
            normalizedTheme
        );
    }


    /* =====================================================
       UPDATE SEMUA TOMBOL TEMA
    ====================================================== */

    function updateThemeButtons(theme) {

        const isDark =
            theme === "dark";


        document
            .querySelectorAll(
                "#themeToggle, [data-theme-toggle]"
            )
            .forEach(function (button) {

                if (!button) {
                    return;
                }


                /* Aksesibilitas */

                button.setAttribute(
                    "aria-pressed",
                    String(isDark)
                );


                button.setAttribute(
                    "title",
                    isDark
                        ? "Aktifkan Mode Terang"
                        : "Aktifkan Mode Gelap"
                );


                /* Icon jika menggunakan Bootstrap Icons */

                const icon =
                    button.querySelector("i");


                if (icon) {

                    icon.classList.remove(
                        "bi-moon-fill",
                        "bi-sun-fill",
                        "bi-moon",
                        "bi-sun"
                    );


                    icon.classList.add(
                        isDark
                            ? "bi-sun-fill"
                            : "bi-moon-fill"
                    );

                }


                /* Teks tombol jika ada */

                const text =
                    button.querySelector(
                        "[data-theme-text]"
                    );


                if (text) {

                    text.textContent =
                        isDark
                            ? "Mode Terang"
                            : "Mode Gelap";

                }

            });
    }


    /* =====================================================
       TOGGLE
    ====================================================== */

    function toggleTheme() {

        const current =
            getSavedTheme();


        const next =
            current === "dark"
                ? "light"
                : "dark";


        applyTheme(next);
    }


    /* =====================================================
       INIT
    ====================================================== */

    function initTheme() {

        const savedTheme =
            getSavedTheme();

        const isDark =
            savedTheme === "dark";


        /*
         * Terapkan ke HTML & BODY terlebih dahulu.
         */

        document.documentElement.classList.toggle(
            "dark-mode",
            isDark
        );

        document.documentElement.setAttribute(
            "data-theme",
            savedTheme
        );


        if (document.body) {

            document.body.classList.toggle(
                "dark-mode",
                isDark
            );

        }


        /*
         * Update tombol setelah halaman siap.
         */

        updateThemeButtons(
            savedTheme
        );
    }


    /* =====================================================
       TOMBOL TEMA
    ====================================================== */

    document.addEventListener(
        "click",
        function (event) {

            const button =
                event.target.closest(
                    "#themeToggle, [data-theme-toggle]"
                );


            if (!button) {
                return;
            }


            event.preventDefault();


            toggleTheme();
        }
    );


    /* =====================================================
       EVENT DARI HALAMAN / KOMPONEN LAIN
    ====================================================== */

    window.addEventListener(
        "themeChanged",
        function (event) {

            const theme =
                event.detail?.theme;


            if (
                theme === "dark" ||
                theme === "light"
            ) {

                updateThemeButtons(
                    theme
                );

            }

        }
    );


    /* =====================================================
       JALANKAN
    ====================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initTheme
        );

    } else {

        initTheme();

    }


    /* =====================================================
       PUBLIC API
    ====================================================== */

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
