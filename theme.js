/* =========================================================
   CATATAN KAS - THEME MANAGER
   Mode Terang / Gelap Global
========================================================= */

(function () {
    "use strict";

    const STORAGE_KEY = "themeMode";

    /* =====================================================
       AMBIL TEMA TERSIMPAN
    ====================================================== */
    function getSavedTheme() {
        return localStorage.getItem(STORAGE_KEY) || "light";
    }

    /* =====================================================
       TERAPKAN TEMA
    ====================================================== */
    function applyTheme(theme) {
        const isDark = theme === "dark";

        document.body.classList.toggle("dark-mode", isDark);

        document.documentElement.classList.toggle(
            "dark-mode",
            isDark
        );

        document.documentElement.setAttribute(
            "data-theme",
            isDark ? "dark" : "light"
        );

        document.body.setAttribute(
            "data-theme",
            isDark ? "dark" : "light"
        );

        /* Update tombol theme jika tersedia */
        updateThemeButtons(isDark);
    }

    /* =====================================================
       TOMBOL MODE GELAP
    ====================================================== */
    function updateThemeButtons(isDark) {
        const buttons = document.querySelectorAll(
            "[data-theme-toggle], #themeToggle, #darkModeToggle"
        );

        buttons.forEach(function (button) {
            if (isDark) {
                button.innerHTML =
                    '<i class="bi bi-sun-fill"></i> Mode Terang';

                button.setAttribute(
                    "aria-label",
                    "Aktifkan mode terang"
                );

                button.setAttribute(
                    "title",
                    "Aktifkan mode terang"
                );
            } else {
                button.innerHTML =
                    '<i class="bi bi-moon-stars-fill"></i> Mode Gelap';

                button.setAttribute(
                    "aria-label",
                    "Aktifkan mode gelap"
                );

                button.setAttribute(
                    "title",
                    "Aktifkan mode gelap"
                );
            }
        });
    }

    /* =====================================================
       TOGGLE THEME
    ====================================================== */
    function toggleTheme() {
        const currentTheme =
            document.body.classList.contains("dark-mode")
                ? "dark"
                : "light";

        const newTheme =
            currentTheme === "dark"
                ? "light"
                : "dark";

        localStorage.setItem(
            STORAGE_KEY,
            newTheme
        );

        applyTheme(newTheme);
    }

    /* =====================================================
       EVENT TOMBOL
    ====================================================== */
    function initThemeButtons() {
        const buttons = document.querySelectorAll(
            "[data-theme-toggle], #themeToggle, #darkModeToggle"
        );

        buttons.forEach(function (button) {
            button.addEventListener(
                "click",
                function (event) {
                    event.preventDefault();
                    toggleTheme();
                }
            );
        });

        updateThemeButtons(
            document.body.classList.contains("dark-mode")
        );
    }

    /* =====================================================
       CSS DARK MODE GLOBAL
    ====================================================== */
    function injectDarkModeCSS() {
        if (document.getElementById("catatanKasDarkModeCSS")) {
            return;
        }

        const style =
            document.createElement("style");

        style.id =
            "catatanKasDarkModeCSS";

        style.textContent = `

        /* ================================================
           DARK MODE GLOBAL
        ================================================= */

        html.dark-mode,
        html[data-theme="dark"] {
            background: #121212 !important;
        }

        body.dark-mode,
        body[data-theme="dark"] {
            background: #121212 !important;
            color: #eeeeee !important;
            animation: none !important;
        }

        /* BODY & TEXT */
        body.dark-mode *,
        body[data-theme="dark"] * {
            border-color: #333333;
        }

        body.dark-mode .text-dark,
        body[data-theme="dark"] .text-dark {
            color: #eeeeee !important;
        }

        body.dark-mode .text-muted,
        body[data-theme="dark"] .text-muted {
            color: #aaaaaa !important;
        }

        /* CARD */
        body.dark-mode .card,
        body.dark-mode .custom-card,
        body[data-theme="dark"] .card,
        body[data-theme="dark"] .custom-card {
            background: #1e1e1e !important;
            color: #eeeeee !important;
            border-color: #333333 !important;
        }

        /* HEADER */
        body.dark-mode .ck-topbar,
        body[data-theme="dark"] .ck-topbar {
            background: #1e1e1e !important;
            color: #eeeeee !important;
            border-color: #333333 !important;
        }

        body.dark-mode .ck-title,
        body[data-theme="dark"] .ck-title {
            color: #42c985 !important;
        }

        body.dark-mode .ck-subtitle,
        body[data-theme="dark"] .ck-subtitle {
            color: #aaaaaa !important;
        }

        /* KEMBALI */
        body.dark-mode .ck-back,
        body.dark-mode .back-btn,
        body[data-theme="dark"] .ck-back,
        body[data-theme="dark"] .back-btn {
            color: #42c985 !important;
        }

        /* FORM */
        body.dark-mode .form-control,
        body.dark-mode .form-select,
        body[data-theme="dark"] .form-control,
        body[data-theme="dark"] .form-select {
            background-color: #2a2a2a !important;
            color: #ffffff !important;
            border-color: #444444 !important;
        }

        body.dark-mode .form-control::placeholder,
        body.dark-mode .form-select::placeholder,
        body[data-theme="dark"] .form-control::placeholder,
        body[data-theme="dark"] .form-select::placeholder {
            color: #888888 !important;
        }

        body.dark-mode .form-label,
        body[data-theme="dark"] .form-label {
            color: #dddddd !important;
        }

        body.dark-mode .form-text,
        body[data-theme="dark"] .form-text {
            color: #999999 !important;
        }

        /* OPTION DROPDOWN */
        body.dark-mode option,
        body[data-theme="dark"] option {
            background: #2a2a2a !important;
            color: #ffffff !important;
        }

        /* TABLE */
        body.dark-mode .table,
        body[data-theme="dark"] .table {
            --bs-table-bg: #1e1e1e !important;
            --bs-table-color: #eeeeee !important;
            color: #eeeeee !important;
            background-color: #1e1e1e !important;
        }

        body.dark-mode .table > :not(caption) > * > *,
        body[data-theme="dark"] .table > :not(caption) > * > * {
            background-color: #1e1e1e !important;
            color: #eeeeee !important;
            border-color: #333333 !important;
        }

        body.dark-mode .table-light,
        body[data-theme="dark"] .table-light {
            --bs-table-bg: #292929 !important;
            --bs-table-color: #ffffff !important;
            background-color: #292929 !important;
            color: #ffffff !important;
        }

        body.dark-mode .table-success,
        body[data-theme="dark"] .table-success {
            --bs-table-bg: #164c3d !important;
            --bs-table-color: #ffffff !important;
            background-color: #164c3d !important;
            color: #ffffff !important;
        }

        /* LIST */
        body.dark-mode .list-group-item,
        body[data-theme="dark"] .list-group-item {
            background-color: #1e1e1e !important;
            color: #eeeeee !important;
            border-color: #333333 !important;
        }

        /* BOTTOM NAV */
        body.dark-mode .ck-bottom,
        body[data-theme="dark"] .ck-bottom {
            background: rgba(30, 30, 30, .97) !important;
            color: #eeeeee !important;
            border-top-color: #333333 !important;
        }

        body.dark-mode .ck-bottom a,
        body[data-theme="dark"] .ck-bottom a {
            color: #aaaaaa !important;
        }

        body.dark-mode .ck-bottom a.active,
        body[data-theme="dark"] .ck-bottom a.active {
            color: #42c985 !important;
        }

        body.dark-mode .ck-bottom a:hover,
        body[data-theme="dark"] .ck-bottom a:hover {
            color: #42c985 !important;
            background: rgba(66, 201, 133, .08) !important;
        }

        /* BACKGROUND LIGHT DARI BOOTSTRAP */
        body.dark-mode .bg-light,
        body[data-theme="dark"] .bg-light {
            background-color: #2a2a2a !important;
            color: #ffffff !important;
        }

        /* MODAL */
        body.dark-mode .modal-content,
        body[data-theme="dark"] .modal-content {
            background-color: #1e1e1e !important;
            color: #eeeeee !important;
        }

        body.dark-mode .modal-header,
        body.dark-mode .modal-footer,
        body[data-theme="dark"] .modal-header,
        body[data-theme="dark"] .modal-footer {
            border-color: #333333 !important;
        }

        /* DROPDOWN */
        body.dark-mode .dropdown-menu,
        body[data-theme="dark"] .dropdown-menu {
            background-color: #1e1e1e !important;
            border-color: #333333 !important;
        }

        body.dark-mode .dropdown-item,
        body[data-theme="dark"] .dropdown-item {
            color: #eeeeee !important;
        }

        body.dark-mode .dropdown-item:hover,
        body[data-theme="dark"] .dropdown-item:hover {
            background-color: #2a2a2a !important;
            color: #42c985 !important;
        }

        /* HR */
        body.dark-mode hr,
        body[data-theme="dark"] hr {
            border-color: #333333 !important;
            opacity: 1;
        }

        /* LINK */
        body.dark-mode a,
        body[data-theme="dark"] a {
            color: #42c985;
        }

        /* ANGKA LAPORAN */
        body.dark-mode #totalSaldo,
        body.dark-mode #hariIni,
        body.dark-mode #bulanIni,
        body.dark-mode #tahunIni,
        body[data-theme="dark"] #totalSaldo,
        body[data-theme="dark"] #hariIni,
        body[data-theme="dark"] #bulanIni,
        body[data-theme="dark"] #tahunIni {
            color: #42c985 !important;
        }

        body.dark-mode #pengeluaranHariIni,
        body.dark-mode #pengeluaranBulanIni,
        body.dark-mode #pengeluaranTahunIni,
        body[data-theme="dark"] #pengeluaranHariIni,
        body[data-theme="dark"] #pengeluaranBulanIni,
        body[data-theme="dark"] #pengeluaranTahunIni {
            color: #ff6b6b !important;
        }

        /* IKON */
        body.dark-mode .text-success,
        body[data-theme="dark"] .text-success {
            color: #42c985 !important;
        }

        body.dark-mode .text-danger,
        body[data-theme="dark"] .text-danger {
            color: #ff6b6b !important;
        }

        /* INPUT AUTOFILL */
        body.dark-mode input:-webkit-autofill,
        body[data-theme="dark"] input:-webkit-autofill {
            -webkit-text-fill-color: #ffffff !important;
            -webkit-box-shadow: 0 0 0 1000px #2a2a2a inset !important;
        }

        `;

        document.head.appendChild(style);
    }

    /* =====================================================
       INIT
    ====================================================== */
    function initTheme() {
        injectDarkModeCSS();

        const savedTheme =
            getSavedTheme();

        applyTheme(savedTheme);

        initThemeButtons();
    }

    /* Jalankan sedini mungkin */
    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initTheme
        );
    } else {
        initTheme();
    }

    /* =====================================================
       PUBLIC API
       Bisa dipanggil dari file lain
    ====================================================== */
    window.CatatanKasTheme = {
        toggle: toggleTheme,

        set: function (theme) {
            if (
                theme !== "dark" &&
                theme !== "light"
            ) {
                return;
            }

            localStorage.setItem(
                STORAGE_KEY,
                theme
            );

            applyTheme(theme);
        },

        get: function () {
            return getSavedTheme();
        }
    };

})();
