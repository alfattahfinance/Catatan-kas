(function(){"use strict";
const DEFAULT_LOGO="Photoroom_20260812_224807.png?v=20260826";
function localKey(base){const uid=String(window.currentFirebaseUid||window.currentFirebaseUser?.uid||"").trim();return uid?`${base}_${uid}`:base}
function localLogo(){try{return localStorage.getItem(localKey("logoDashboard"))||""}catch(_){return""}}
function applyLogo(){const logo=window.CKLogoManager?.getCurrentLogo?.()||localLogo()||DEFAULT_LOGO;document.querySelectorAll(".app-logo,.ck-logo,.logo,#logo,#logoDashboard,#dashboardLogo,#laporanLogo,#logoPreview,#logoPreviewV2,#previewLogoDashboard,img[alt='Logo Dashboard'],img[alt='Logo aplikasi'],img[alt='Logo Catatan Kas'],[data-dashboard-logo]").forEach(img=>{if(!img||img.tagName!=="IMG")return;img.removeAttribute("srcset");img.removeAttribute("data-src");img.dataset.logoSyncApplied=logo;img.src=logo})}
async function start(){if(window.CKLogoManager?.ready)await window.CKLogoManager.ready();applyLogo()}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
window.addEventListener("logoDashboardChanged",applyLogo);window.addEventListener("settingsChanged",applyLogo);window.addEventListener("accountReady",applyLogo);window.addEventListener("accountDataReady",applyLogo);window.addEventListener("pageshow",applyLogo);
})();
