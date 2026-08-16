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

    apiKey: "AIzaSyAPJ7VUeTKThInfZweMt33c_kUwcVSLSn0",

    authDomain: "syahriyyah-app.firebaseapp.com",

    projectId: "syahriyyah-app",

    storageBucket: "syahriyyah-app.firebasestorage.app",

    messagingSenderId: "110837276336",

    appId: "1:110837276336:web:35ba5e32b4a4027aa6e575"

};


const app =
    initializeApp(firebaseConfig);


export const db =
    getFirestore(app);


export const auth =
    getAuth(app);


/* =====================================================
   MUAT TEMA GLOBAL SECARA OTOMATIS
   Halaman yang mengimpor firebase-config.js akan ikut
   menggunakan background hijau + abu-abu + kuning.
===================================================== */
(function loadGlobalTheme() {
    try {
        const href = "css/theme.css";

        if (!document.querySelector(`link[data-global-theme="true"]`)) {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = href;
            link.dataset.globalTheme = "true";
            document.head.appendChild(link);
        }
    } catch (error) {
        console.warn("Tema global gagal dimuat:", error);
    }
})();
