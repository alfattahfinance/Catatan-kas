(function () {
    "use strict";

    const THEME_KEY = "themeMode";

    function getSavedTheme() {
        return localStorage.getItem(THEME_KEY) || "light";
    }

    function applyTheme(theme) {
        const isDark = theme === "dark";

        document.body.classList.toggle("dark-mode", isDark);

        document.documentElement.setAttribute(
            "data-theme",
            theme
        );

        // Simpan agar semua halaman membaca pilihan yang sama
        localStorage.setItem(THEME_KEY, theme);

        // Beri tahu halaman lain / komponen lain
        window.dispatchEvent(
            new CustomEvent("themeChanged", {
                detail: {
                    theme: theme,
                    dark: isDark
                }
            })
        );
    }

    function toggleTheme() {
        const current =
            document.body.classList.contains("dark-mode")
                ? "dark"
                : "light";

        applyTheme(
            current === "dark"
                ? "light"
                : "dark"
        );
    }

    function initTheme() {
        const savedTheme = getSavedTheme();

        // Terapkan SEBELUM halaman digunakan
        document.body.classList.toggle(
            "dark-mode",
            savedTheme === "dark"
        );

        document.documentElement.setAttribute(
            "data-theme",
            savedTheme
        );
    }

    // Jalankan segera
    if (document.body) {
        initTheme();
    } else {
        document.addEventListener(
            "DOMContentLoaded",
            initTheme
        );
    }

    // Tombol tema bisa menggunakan:
    // id="themeToggle"
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

    // Bisa dipanggil dari halaman lain
    window.themeManager = {
        getTheme: getSavedTheme,
        setTheme: applyTheme,
        toggle: toggleTheme,
        init: initTheme
    };

})();
