import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
const firebaseConfig={apiKey:"AIzaSyAPJ7VUeTKThInfZweMt33c_kUwcVSLSn0",authDomain:"syahriyyah-app.firebaseapp.com",projectId:"syahriyyah-app",storageBucket:"syahriyyah-app.firebasestorage.app",messagingSenderId:"110837276336",appId:"1:110837276336:web:94c9ba4e612c6af0a6e575",measurementId:"G-L1VPS2KZWL"};
export { firebaseConfig };
const app=initializeApp(firebaseConfig);export const db=getFirestore(app);export const auth=getAuth(app);
(function(){try{if(!document.querySelector('link[data-global-theme="true"]')){const link=document.createElement("link");link.rel="stylesheet";link.href="css/theme.css?v=20260821";link.dataset.globalTheme="true";document.head.appendChild(link)}}catch(e){console.warn("Tema global gagal dimuat:",e)}})();
(function(){function getLogo(){try{return window.CatatanKasSettings?.getLogo?.()||localStorage.getItem(`logoDashboard_${auth.currentUser?.uid||""}`)||"logo-catatan-kas.jpg"}catch(_){return"logo-catatan-kas.jpg"}}function apply(){const img=document.getElementById("laporanLogo");if(!img)return;img.src=getLogo();img.removeAttribute("srcset");img.onerror=()=>{img.src="logo-catatan-kas.jpg"}}if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",apply,{once:true});else apply();window.addEventListener("logoDashboardChanged",apply);window.addEventListener("accountSettingsReady",apply);})();
import("./js/ui-fixes.js").catch(e=>console.warn("UI fixes gagal dimuat:",e));
