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
