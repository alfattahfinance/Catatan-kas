(function(){"use strict";
const SETTINGS_KEY="pengaturanAplikasi",LOGO_KEY="logoDashboard",DEFAULT_LOGO="logo-catatan-kas.jpg",FALLBACK_LOGO="icon-192.png";
function uid(){return String(window.currentFirebaseUid||window.currentFirebaseUser?.uid||"").trim()}
function key(base){const u=uid();return u?`${base}_${u}`:base}
function read(base){try{return localStorage.getItem(key(base))}catch(_){return null}}
function readSettings(){try{const raw=read(SETTINGS_KEY);const data=raw?JSON.parse(raw):{};return data&&typeof data==="object"?data:{}}catch(_){return{}}}
function normalize(v){if(!v||typeof v!=="string")return DEFAULT_LOGO;const x=v.trim();if(!x)return DEFAULT_LOGO;if(["assets/logo-catatan-kas.jpg","assets/logo-catatan-kas.png","logo-catatan-kas.png"].includes(x))return DEFAULT_LOGO;return x}
function getLogo(){return normalize(read(LOGO_KEY)||readSettings().logoDashboard||readSettings().logo||DEFAULT_LOGO)}
function applyLogo(){const logo=getLogo();document.querySelectorAll(".app-logo,.ck-logo,.logo,.logo-preview,#logo,#logoDashboard,#dashboardLogo,#laporanLogo,#logoPreview,#logoPreviewV2,#previewLogoDashboard,img[alt='Logo Dashboard'],img[alt='Logo aplikasi'],img[alt='Logo Catatan Kas'],[data-dashboard-logo]").forEach(img=>{if(!img||img.tagName!=="IMG")return;if(img.dataset.logoSyncApplied===logo)return;img.dataset.logoSyncApplied=logo;img.removeAttribute("srcset");img.removeAttribute("data-src");img.src=logo;img.onerror=function(){if(img.dataset.logoFallback==="1")return;img.dataset.logoFallback="1";img.src=FALLBACK_LOGO}})}
function start(){applyLogo();if(window.MutationObserver&&document.body){const o=new MutationObserver(()=>applyLogo());o.observe(document.body,{childList:true,subtree:true})}window.addEventListener("logoDashboardChanged",applyLogo);window.addEventListener("accountReady",applyLogo);window.addEventListener("accountDataReady",applyLogo);window.addEventListener("storage",e=>{if(e.key===LOGO_KEY||e.key===SETTINGS_KEY)applyLogo()})}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();