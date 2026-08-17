// ======================================
// Syahriyyah / Alfattah Finance
// AUTH GUARD + LOGO FIX
// ======================================

import { auth } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

const DEFAULT_LOGO = "IMG_1511.png";

function applyPageLogo() {
    let settings = {};

    try {
        settings = JSON.parse(
            localStorage.getItem("pengaturanAplikasi") || "{}"
        ) || {};
    } catch (error) {
        console.warn("Gagal membaca pengaturan logo:", error);
    }

    const configuredLogo =
        settings.logoDashboard ||
        settings.logo ||
        settings.logoUrl ||
        DEFAULT_LOGO;

    const logoSelectors = [
        "#laporanLogo",
        "#logo",
        ".ck-logo",
        ".logo"
    ];

    document.querySelectorAll(logoSelectors.join(",")).forEach((img) => {
        if (!(img instanceof HTMLImageElement)) return;

        let fallbackUsed = false;

        img.onerror = () => {
            if (fallbackUsed) return;
            fallbackUsed = true;
            img.onerror = null;
            img.src = DEFAULT_LOGO;
        };

        img.src = configuredLogo;
        img.alt = img.alt || "Logo Catatan Kas";
    });
}

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.replace("login.html");
        return;
    }

    console.log("Pengguna sudah login:", user.email);

    applyPageLogo();
    setTimeout(applyPageLogo, 300);
    setTimeout(applyPageLogo, 1000);
});
