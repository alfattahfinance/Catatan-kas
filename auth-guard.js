// ======================================
// Syahriyyah / Alfattah Finance
// AUTH GUARD
// ======================================

import { auth } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";


onAuthStateChanged(auth, (user) => {

    if (!user) {

        // Belum login
        window.location.replace(
    "login.html"
);

        return;
    }

    console.log(
        "Pengguna sudah login:",
        user.email
    );

});
