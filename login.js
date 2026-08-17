// ======================================
// Alfattah Finance
// LOGIN
// ======================================

import { auth } from "./firebase-config.js";

import {
    signInWithEmailAndPassword,
    onAuthStateChanged,
    setPersistence,
    browserLocalPersistence,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginButton = document.getElementById("loginButton") || document.getElementById("btnLogin");
const registerButton = document.getElementById("registerButton");
const forgotButton = document.getElementById("forgotButton");
const togglePassword = document.getElementById("togglePassword");
const loading = document.getElementById("loading");
const message = document.getElementById("message") || document.getElementById("pesan");

function showMessage(text, type = "error") {
    if (!message) return;
    message.textContent = text;
    message.className = type === "error" ? "message error" : `message ${type}`;
    message.style.display = "block";
}

function hideMessage() {
    if (message) message.style.display = "none";
}

function setBusy(busy) {
    if (loginButton) loginButton.disabled = busy;
    if (registerButton) registerButton.disabled = busy;
    if (forgotButton) forgotButton.disabled = busy;
    if (loading) loading.style.display = busy ? "block" : "none";
}

function explainAuthError(error) {
    const code = String(error?.code || "").toLowerCase();
    const raw = String(error?.message || "").toLowerCase();

    // Ini penting: error pada foto pengguna bukan berarti password salah.
    if (
        code.includes("invalid-api-key") ||
        code.includes("api-key-not-valid") ||
        raw.includes("api-key-not-valid") ||
        raw.includes("please pass a valid api key")
    ) {
        return "Konfigurasi Firebase bermasalah: Web API Key Firebase tidak valid atau sudah dibatasi/dihapus. Ini bukan kesalahan Gmail atau kata sandi. Perbarui Firebase Web API Key di firebase-config.js dari Firebase Console.";
    }

    if (code.includes("network-request-failed")) {
        return "Tidak dapat terhubung ke Firebase. Periksa internet lalu coba lagi.";
    }

    if (code.includes("too-many-requests")) {
        return "Terlalu banyak percobaan. Tunggu beberapa saat lalu coba lagi.";
    }

    if (code.includes("user-disabled")) {
        return "Akun ini dinonaktifkan oleh administrator Firebase.";
    }

    if (code.includes("invalid-email")) {
        return "Format Gmail tidak valid. Periksa kembali alamat email.";
    }

    if (
        code.includes("invalid-credential") ||
        code.includes("invalid-login-credentials") ||
        code.includes("wrong-password") ||
        code.includes("user-not-found")
    ) {
        return "Gmail atau kata sandi tidak cocok. Periksa kembali penulisannya.";
    }

    if (code.includes("operation-not-allowed")) {
        return "Login Email/Password belum diaktifkan di Firebase Authentication.";
    }

    return `Login gagal (${error?.code || "error tidak diketahui"}). Coba lagi atau hubungi pengelola aplikasi.`;
}

async function prosesLogin() {
    const email = emailInput?.value.trim().toLowerCase() || "";
    const password = emailInput && passwordInput ? passwordInput.value : "";

    hideMessage();

    if (!email || !password) {
        showMessage("Gmail dan kata sandi harus diisi.");
        return;
    }

    setBusy(true);

    try {
        await setPersistence(auth, browserLocalPersistence);
        await signInWithEmailAndPassword(auth, email, password);
        window.location.replace("index.html");
    } catch (error) {
        console.error("LOGIN ERROR:", error);
        showMessage(explainAuthError(error));
        setBusy(false);
    }
}

if (loginButton) {
    loginButton.addEventListener("click", prosesLogin);
}

[emailInput, passwordInput].filter(Boolean).forEach((input) => {
    input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") prosesLogin();
    });
});

if (togglePassword && passwordInput) {
    togglePassword.addEventListener("click", () => {
        const visible = passwordInput.type === "text";
        passwordInput.type = visible ? "password" : "text";
        togglePassword.innerHTML = visible
            ? '<i class="bi bi-eye"></i>'
            : '<i class="bi bi-eye-slash"></i>';
    });
}

if (registerButton) {
    registerButton.addEventListener("click", () => {
        window.location.replace("register.html");
    });
}

if (forgotButton) {
    forgotButton.addEventListener("click", async () => {
        const email = emailInput?.value.trim().toLowerCase() || "";

        if (!email) {
            showMessage("Masukkan Gmail terlebih dahulu untuk mengirim link reset kata sandi.", "info");
            emailInput?.focus();
            return;
        }

        forgotButton.disabled = true;

        try {
            await sendPasswordResetEmail(auth, email);
            showMessage("Link reset kata sandi sudah dikirim. Periksa Inbox atau Spam Gmail.", "info");
        } catch (error) {
            console.error("RESET PASSWORD ERROR:", error);
            showMessage(explainAuthError(error));
        } finally {
            forgotButton.disabled = false;
        }
    });
}

onAuthStateChanged(auth, (user) => {
    if (user && window.location.pathname.endsWith("login.html")) {
        window.location.replace("index.html");
    }
});
