// ======================================
// CATATAN KAS
// THEME MANAGER
// Versi final
// ======================================

(function () {

    "use strict";


    // ======================================
    // DEFAULT THEME
    // ======================================

    const DEFAULT_THEME = "light";

    const STORAGE_KEY = "pengaturanAplikasi";


    // ======================================
    // AMBIL PENGATURAN
    // ======================================

    function ambilPengaturan() {

        try {

            return JSON.parse(
                localStorage.getItem(STORAGE_KEY)
            ) || {};

        } catch (error) {

            console.warn(
                "Pengaturan aplikasi tidak valid:",
                error
            );

            return {};

        }

    }


    // ======================================
    // AMBIL TEMA
    // ======================================

    function ambilTema() {

        const data =
            ambilPengaturan();

        const tema =
            data.tema || DEFAULT_THEME;


        // Hanya izinkan:
        // light
        // dark
        // system

        if (
            tema === "dark" ||
            tema === "system" ||
            tema === "light"
        ) {

            return tema;

        }


        return DEFAULT_THEME;

    }


    // ======================================
    // CEK SYSTEM DARK MODE
    // ======================================

    function systemMenggunakanDarkMode() {

        return window.matchMedia &&
            window.matchMedia(
                "(prefers-color-scheme: dark)"
            ).matches;

    }


    // ======================================
    // TENTUKAN APAKAH DARK MODE AKTIF
    // ======================================

    function gunakanDarkMode() {

        const tema =
            ambilTema();


        if (tema === "dark") {

            return true;

        }


        if (tema === "system") {

            return systemMenggunakanDarkMode();

        }


        return false;

    }


    // ======================================
    // TERAPKAN THEME COLOR
    // ======================================

    function terapkanThemeColor(
        gunakanGelap
    ) {

        let meta =
            document.querySelector(
                'meta[name="theme-color"]'
            );


        if (!meta) {

            meta =
                document.createElement("meta");

            meta.name =
                "theme-color";

            document.head.appendChild(meta);

        }


        meta.setAttribute(
            "content",
            gunakanGelap
                ? "#121212"
                : "#198754"
        );

    }


    // ======================================
    // TERAPKAN TEMA GLOBAL
    // ======================================

    function terapkanTemaGlobal() {

        const gunakanGelap =
            gunakanDarkMode();


        const html =
            document.documentElement;

        const body =
            document.body;


        // HTML

        html.classList.toggle(
            "dark-mode",
            gunakanGelap
        );


        // BODY

        if (body) {

            body.classList.toggle(
                "dark-mode",
                gunakanGelap
            );

        }


        // Theme color browser

        terapkanThemeColor(
            gunakanGelap
        );


        // Simpan status aktif
        // agar halaman lain bisa membacanya

        html.setAttribute(
            "data-theme",
            gunakanGelap
                ? "dark"
                : "light"
        );

    }


    // ======================================
    // TERAPKAN SECEPAT MUNGKIN
    // ======================================

    // Jalankan sekarang apabila body sudah ada.
    // Kalau belum ada, jalankan setelah DOM siap.

    if (document.body) {

        terapkanTemaGlobal();

    } else {

        document.addEventListener(
            "DOMContentLoaded",
            terapkanTemaGlobal,
            { once: true }
        );

    }


    // ======================================
    // IKUTI PERUBAHAN TEMA PERANGKAT
    // ======================================

    const mediaQuery =
        window.matchMedia
            ? window.matchMedia(
                "(prefers-color-scheme: dark)"
            )
            : null;


    if (mediaQuery) {

        const perubahanSystem =
            function () {

                const tema =
                    ambilTema();


                // Hanya mengikuti perangkat
                // jika pilihan = system

                if (tema === "system") {

                    terapkanTemaGlobal();

                }

            };


        // Browser modern

        if (
            typeof mediaQuery.addEventListener ===
            "function"
        ) {

            mediaQuery.addEventListener(
                "change",
                perubahanSystem
            );

        }

        // Kompatibilitas browser lama

        else if (
            typeof mediaQuery.addListener ===
            "function"
        ) {

            mediaQuery.addListener(
                perubahanSystem
            );

        }

    }


    // ======================================
    // EVENT CUSTOM
    // ======================================
    //
    // Bisa dipanggil dari halaman pengaturan
    // setelah pengguna mengganti tema:
    //
    // window.dispatchEvent(
    //     new Event("temaBerubah")
    // );
    //
    // ======================================

    window.addEventListener(
        "temaBerubah",
        function () {

            terapkanTemaGlobal();

        }
    );


    // ======================================
    // FUNGSI GLOBAL
    // ======================================

    window.CatatanKasTheme = {

        ambilTema:
            ambilTema,

        gunakanDarkMode:
            gunakanDarkMode,

        terapkanTema:
            terapkanTemaGlobal

    };


})();
