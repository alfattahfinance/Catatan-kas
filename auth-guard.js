// ======================================
// CATATAN KAS
// AUTH GUARD + LOGO GLOBAL
// ======================================

import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

const DEFAULT_LOGO = "logo-catatan-kas.jpg";
const LOGO_KEY = "logoDashboard";
const SETTINGS_KEY = "pengaturanAplikasi";

function isValidLogo(value) {
    if (!value || typeof value !== "string") return false;
    const v = value.trim();
    if (!v) return false;
    if (/^(?:\.\/)?assets\/logo-catatan-kas\.(?:jpg|jpeg|png|webp)$/i.test(v)) return false;
    if (/^\/assets\/logo-catatan-kas\.(?:jpg|jpeg|png|webp)$/i.test(v)) return false;
    return /^data:image\//i.test(v) || /^https?:\/\//i.test(v) || /^blob:/i.test(v) || /^(?:\.\/)?[\w./-]+\.(?:png|jpe?g|webp|gif|svg)$/i.test(v);
}

function getConfiguredLogo() {
    try {
        const directLogo = localStorage.getItem(LOGO_KEY);
        if (isValidLogo(directLogo)) return directLogo;
        const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") || {};
        const settingsLogo = settings.logoDashboard || settings.logo || settings.logoUrl;
        if (isValidLogo(settingsLogo)) return settingsLogo;
    } catch (error) { console.warn("Gagal membaca pengaturan logo:", error); }
    return DEFAULT_LOGO;
}

function applyPageLogo() {
    const logo = getConfiguredLogo();
    const selectors = ["#laporanLogo", "#logo", ".ck-logo", ".app-logo", ".logo", "#logoDashboard", "#dashboardLogo", "#previewLogoDashboard", "#logoPreviewV2", "#logoPreview", "img[alt='Logo Dashboard']", "img[alt='Logo aplikasi']", "img[alt='Logo Catatan Kas']", "[data-dashboard-logo]"];
    document.querySelectorAll(selectors.join(",")).forEach((img) => {
        if (!(img instanceof HTMLImageElement)) return;
        img.onerror = () => { img.onerror = null; img.src = new URL(DEFAULT_LOGO, document.baseURI).href; };
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
    window.addEventListener("storage", (event) => { if (event.key === LOGO_KEY || event.key === SETTINGS_KEY) applyPageLogo(); });
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

    // Dashboard Excel harus mulai membaca Firestore setelah autentikasi selesai.
    // Ini mencegah halaman terlihat kosong ketika APK baru memulihkan sesi Firebase.
    if (location.pathname.toLowerCase().endsWith("dashboard-excel.html") || location.href.toLowerCase().includes("dashboard-excel.html")) {
        import("./dashboard-excel-fix.js").catch(error => console.error("Dashboard Excel gagal dimuat:", error));
    }
});
