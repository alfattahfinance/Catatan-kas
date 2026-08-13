(function () {
    "use strict";

    const THEME_KEY = "themeMode";

    /* =====================================================
       AMBIL TEMA TERSIMPAN
    ====================================================== */

    function getSavedTheme() {
        const saved = localStorage.getItem(THEME_KEY);

        return saved === "dark"
            ? "dark"
            : "light";
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


        /* BODY */

        document.body.classList.toggle(
            "dark-mode",
            isDark
        );


        /* HTML */

        document.documentElement.setAttribute(
            "data-theme",
            normalizedTheme
        );


        /* SIMPAN */

        localStorage.setItem(
            THEME_KEY,
            normalizedTheme
        );


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


        /*
         * Terapkan ke HTML terlebih dahulu.
         */

        document.documentElement.setAttribute(
            "data-theme",
            savedTheme
        );


        /*
         * Kemudian BODY.
         */

        if (document.body) {

            document.body.classList.toggle(
                "dark-mode",
                savedTheme === "dark"
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
