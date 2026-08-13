// ======================================
// CATATAN KAS
// GLOBAL THEME MANAGER
// ======================================

(function () {

    "use strict";


    // ==================================
    // AMBIL PENGATURAN APLIKASI
    // ==================================

    function ambilPengaturan() {

        try {

            return JSON.parse(
                localStorage.getItem(
                    "pengaturanAplikasi"
                )
            ) || {};

        } catch (error) {

            console.warn(
                "Pengaturan aplikasi tidak valid:",
                error
            );

            return {};

        }

    }


    // ==================================
    // TENTUKAN TEMA
    // ==================================

    function gunakanDarkMode() {

        const data =
            ambilPengaturan();

        const tema =
            data.tema || "light";


        // ------------------------------
        // DARK
        // ------------------------------

        if (tema === "dark") {

            return true;

        }


        // ------------------------------
        // SYSTEM
        // ------------------------------

        if (tema === "system") {

            return window.matchMedia(
                "(prefers-color-scheme: dark)"
            ).matches;

        }


        // ------------------------------
        // LIGHT
        // ------------------------------

        return false;

    }


    // ==================================
    // TERAPKAN TEMA
    // ==================================

    function terapkanTema() {

        const gunakanGelap =
            gunakanDarkMode();


        // HTML
        document.documentElement.classList.toggle(
            "dark-mode",
            gunakanGelap
        );


        // BODY
        if (document.body) {

            document.body.classList.toggle(
                "dark-mode",
                gunakanGelap
            );

        }


        // Simpan status tema aktif
        document.documentElement.dataset.theme =
            gunakanGelap
                ? "dark"
                : "light";


        // ==================================
        // UPDATE WARNA STATUS BAR
        // ==================================

        const metaTheme =
            document.querySelector(
                'meta[name="theme-color"]'
            );


        if (metaTheme) {

            metaTheme.setAttribute(
                "content",
                gunakanGelap
                    ? "#121212"
                    : "#198754"
            );

        }

    }


    // ==================================
    // TERAPKAN SECEPAT MUNGKIN
    // ==================================

    terapkanTema();


    // ==================================
    // DOM SIAP
    // ==================================

    document.addEventListener(
        "DOMContentLoaded",
        function () {

            terapkanTema();

        }
    );


    // ==================================
    // SYSTEM THEME BERUBAH
    // ==================================

    const mediaQuery =
        window.matchMedia(
            "(prefers-color-scheme: dark)"
        );


    function cekPerubahanSystem() {

        const data =
            ambilPengaturan();


        if (data.tema === "system") {

            terapkanTema();

        }

    }


    // Browser modern
    if (
        typeof mediaQuery.addEventListener ===
        "function"
    ) {

        mediaQuery.addEventListener(
            "change",
            cekPerubahanSystem
        );

    }

    // Browser lama
    else if (
        typeof mediaQuery.addListener ===
        "function"
    ) {

        mediaQuery.addListener(
            cekPerubahanSystem
        );

    }


    // ==================================
    // FUNGSI GLOBAL
    // Bisa dipanggil halaman lain
    // ==================================

    window.terapkanTemaGlobal =
        terapkanTema;


})();
