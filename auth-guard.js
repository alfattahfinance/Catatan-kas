// ======================================
// CATATAN KAS
// AUTH GUARD + LOGO GLOBAL
// ======================================

import { auth } from "./firebase-config.js";
import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

const DEFAULT_LOGO = "logo-catatan-kas.jpg";
const LOGO_KEY = "logoDashboard";
const SETTINGS_KEY = "pengaturanAplikasi";

function getConfiguredLogo() {
    try {
        const directLogo = localStorage.getItem(LOGO_KEY);
        if (directLogo && directLogo !== "assets/logo-catatan-kas.jpg" && directLogo !== "assets/logo-catatan-kas.png") {
            return directLogo;
        }

        const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") || {};
        const settingsLogo = settings.logoDashboard || settings.logo || settings.logoUrl;
        if (settingsLogo && settingsLogo !== "assets/logo-catatan-kas.jpg" && settingsLogo !== "assets/logo-catatan-kas.png") {
            return settingsLogo;
        }
    } catch (error) {
        console.warn("Gagal membaca pengaturan logo:", error);
    }

    return DEFAULT_LOGO;
}

function applyPageLogo() {
    const logo = getConfiguredLogo();
    const selectors = [
        "#laporanLogo",
        "#logo",
        ".ck-logo",
        ".app-logo",
        ".logo",
        "#logoDashboard",
        "#dashboardLogo",
        "#previewLogoDashboard",
        "#logoPreviewV2",
        "#logoPreview",
        "img[alt='Logo Dashboard']",
        "img[alt='Logo aplikasi']",
        "img[alt='Logo Catatan Kas']",
        "[data-dashboard-logo]"
    ];

    document.querySelectorAll(selectors.join(",")).forEach((img) => {
        if (!(img instanceof HTMLImageElement)) return;

        img.onerror = () => {
            img.onerror = null;
            if (img.src !== new URL(DEFAULT_LOGO, document.baseURI).href) {
                img.src = DEFAULT_LOGO;
            }
        };

        img.src = logo;
        img.removeAttribute("srcset");
        img.removeAttribute("data-src");
        img.alt = img.alt || "Logo Catatan Kas";
    });
}

function setupLogoEvents() {
    applyPageLogo();
    window.addEventListener("logoDashboardChanged", applyPageLogo);
    window.addEventListener("pageshow", applyPageLogo);
    window.addEventListener("focus", applyPageLogo);
    window.addEventListener("storage", (event) => {
        if (event.key === LOGO_KEY || event.key === SETTINGS_KEY) applyPageLogo();
    });

    document.addEventListener("DOMContentLoaded", applyPageLogo, { once: true });
    setTimeout(applyPageLogo, 100);
    setTimeout(applyPageLogo, 500);
    setTimeout(applyPageLogo, 1200);
}

setupLogoEvents();

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.replace("login.html");
        return;
    }

    console.log("Pengguna sudah login:", user.email);
    applyPageLogo();
});
