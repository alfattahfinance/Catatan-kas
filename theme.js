// ======================================
// CATATAN KAS
// GLOBAL THEME MANAGER
// ======================================

(function () {

    "use strict";


    // ==================================
    // AMBIL PENGATURAN
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
                "Pengaturan aplikasi tidak valid.",
                error
            );

            return {};

        }

    }


    // ==================================
    // CEK DARK MODE
    // ==================================

    function gunakanDarkMode() {

        const data =
            ambilPengaturan();

        const tema =
            data.tema || "light";


        // DARK
        if (tema === "dark") {

            return true;

        }


        // SYSTEM
        if (tema === "system") {

            return window.matchMedia(
                "(prefers-color-scheme: dark)"
            ).matches;

        }


        // LIGHT
        return false;

    }


    // ==================================
    // TERAPKAN TEMA
    // ==================================

    function terapkanTema() {

        const dark =
            gunakanDarkMode();


        // HTML
        document.documentElement.classList.toggle(
            "dark-mode",
            dark
        );


        // BODY
        if (document.body) {

            document.body.classList.toggle(
                "dark-mode",
                dark
            );

        }


        // Simpan status sementara
        document.documentElement.dataset.theme =
            dark ? "dark" : "light";


        // Update theme-color browser
        const meta =
            document.querySelector(
                'meta[name="theme-color"]'
            );


        if (meta) {

            meta.setAttribute(
                "content",
                dark
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
    // JIKA BODY BELUM ADA
    // ==================================

    if (!document.body) {

        document.addEventListener(
            "DOMContentLoaded",
            terapkanTema,
            { once: true }
        );

    }


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


    if (
        typeof mediaQuery.addEventListener ===
        "function"
    ) {

        mediaQuery.addEventListener(
            "change",
            cekPerubahanSystem
        );

    } else {

        // Support browser lama

        mediaQuery.addListener(
            cekPerubahanSystem
        );

    }


    // ==================================
    // UPDATE SETELAH DOM SIAP
    // ==================================

    document.addEventListener(
        "DOMContentLoaded",
        function () {

            terapkanTema();

        }
    );


    // ==================================
    // BISA DIPANGGIL DARI HALAMAN LAIN
    // ==================================

    window.terapkanTemaGlobal =
        terapkanTema;


})();
