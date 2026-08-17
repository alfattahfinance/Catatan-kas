import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";

import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

import {
    getAuth
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyAPJ7VUeTKThInfZweMt33c_kUwcVSLS0",
    authDomain: "syahriyyah-app.firebaseapp.com",
    projectId: "syahriyyah-app",
    storageBucket: "syahriyyah-app.firebasestorage.app",
    messagingSenderId: "110837276336",
    appId: "1:110837276336:web:35ba5e32b4a4027aa6e575"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

/* MUAT TEMA GLOBAL SECARA OTOMATIS */
(function loadGlobalTheme() {
    try {
        if (!document.querySelector('link[data-global-theme="true"]')) {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = "css/theme.css?v=20260816";
            link.dataset.globalTheme = "true";
            document.head.appendChild(link);
        }
    } catch (error) {
        console.warn("Tema global gagal dimuat:", error);
    }
})();

/* ======================================================
   PERBAIKAN LOGO LAPORAN
   Laporan harus memakai logoDashboard yang sama dengan dashboard.
   ====================================================== */
(function loadReportLogo() {
    const DEFAULT_LOGO = "logo-catatan-kas.jpg";
    const OLD_LOGO_PATHS = [
        "assets/logo-catatan-kas.jpg",
        "assets/logo-catatan-kas.png"
    ];

    function getLogo() {
        try {
            const saved = localStorage.getItem("logoDashboard");
            if (!saved || OLD_LOGO_PATHS.includes(saved)) {
                return DEFAULT_LOGO;
            }
            return saved;
        } catch (_) {
            return DEFAULT_LOGO;
        }
    }

    function applyReportLogo() {
        const img = document.getElementById("laporanLogo");
        if (!img) return;

        const saved = getLogo();
        const fallback = DEFAULT_LOGO;

        img.onerror = function () {
            if (img.dataset.logoFallbackApplied !== "1") {
                img.dataset.logoFallbackApplied = "1";
                img.src = fallback;
            }
        };

        img.src = saved;
        img.removeAttribute("srcset");
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", applyReportLogo, { once: true });
    } else {
        applyReportLogo();
    }

    window.addEventListener("storage", (event) => {
        if (event.key === "logoDashboard") applyReportLogo();
    });

    window.addEventListener("logoDashboardChanged", applyReportLogo);
})();
