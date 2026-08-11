// ======================================
// Syahriyyah App
// LOGIN ADMIN
// ======================================

import {
    auth
} from "./firebase-config.js";

import {
    signInWithEmailAndPassword,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";


// ======================================
// ELEMENT
// ======================================

const emailInput =
    document.getElementById("email");

const passwordInput =
    document.getElementById("password");

const btnLogin =
    document.getElementById("btnLogin");

const pesan =
    document.getElementById("pesan");


// ======================================
// CEK JIKA SUDAH LOGIN
// ======================================

onAuthStateChanged(auth, (user) => {

    if (user) {

        window.location.href = "../index.html";

    }

});


// ======================================
// TAMPILKAN PESAN
// ======================================

function tampilkanPesan(teks, tipe = "danger") {

    pesan.innerHTML = `
        <div class="alert alert-${tipe}">
            ${teks}
        </div>
    `;

}


// ======================================
// LOGIN
// ======================================

btnLogin.addEventListener("click", async () => {

    const email =
        emailInput.value.trim();

    const password =
        passwordInput.value;


    // Cek input
    if (!email || !password) {

        tampilkanPesan(
            "Email dan password wajib diisi."
        );

        return;

    }


    // Loading
    btnLogin.disabled = true;
    btnLogin.textContent = "Memproses...";


    try {

        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );


        tampilkanPesan(
            "Login berhasil. Mengalihkan...",
            "success"
        );


        setTimeout(() => {

            window.location.href =
                "../index.html";

        }, 500);


    } catch (error) {

        console.error(
            "Login error:",
            error
        );


        let pesanError =
            "Email atau password salah.";


        if (
            error.code ===
            "auth/invalid-email"
        ) {

            pesanError =
                "Format email tidak valid.";

        }

        else if (
            error.code ===
            "auth/user-not-found"
        ) {

            pesanError =
                "Akun tidak ditemukan.";

        }

        else if (
            error.code ===
            "auth/wrong-password"
        ) {

            pesanError =
                "Password salah.";

        }

        else if (
            error.code ===
            "auth/invalid-credential"
        ) {

            pesanError =
                "Email atau password salah.";

        }


        tampilkanPesan(
            pesanError
        );


        btnLogin.disabled = false;
        btnLogin.textContent = "Login";

    }

});
