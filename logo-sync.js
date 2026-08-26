(function(){
"use strict";
const DEFAULT_LOGO="Photoroom_20260812_224807.png?v=20260826";
const SELECTOR=".app-logo,.ck-logo,.logo,#logo,#logoDashboard,#dashboardLogo,#laporanLogo,#logoPreview,#logoPreviewV2,#previewLogoDashboard,#logoPemasukan,#logoPengeluaran,img[alt='Logo Dashboard'],img[alt='Logo aplikasi'],img[alt='Logo Catatan Kas'],img[alt='Logo Keuangan'],img[alt='Logo'],[data-dashboard-logo]";
function uid(){return String(window.currentFirebaseUid||window.currentFirebaseUser?.uid||window.__ckUserUid||"").trim()}
function localKey(base){const id=uid();return id?`${base}_${id}`:base}
function validLogo(v){v=String(v||"").trim();if(!v)return false;if(/^logo-catatan-kas\.(?:jpg|jpeg|png|webp)$/i.test(v))return false;return /^data:image\//i.test(v)||/^https?:\/\//i.test(v)||/^blob:/i.test(v)||/^(?:\.\/)?[\w./-]+\.(?:png|jpe?g|webp|gif|svg)(?:\?.*)?$/i.test(v)}
function localLogo(){try{const direct=localStorage.getItem(localKey("logoDashboard"));if(validLogo(direct))return direct;const id=uid();if(id){const s=JSON.parse(localStorage.getItem(`pengaturanAplikasi_${id}`)||"{}");const v=s.logoDashboard||s.logo||s.logoUrl;if(validLogo(v))return v}else{const s=JSON.parse(localStorage.getItem("pengaturanAplikasi")||"{}");const v=s.logoDashboard||s.logo||s.logoUrl;if(validLogo(v))return v}}catch(_){}return DEFAULT_LOGO}
function applyLogo(){
 const logo=window.CKLogoManager?.getCurrentLogo?.()||localLogo()||DEFAULT_LOGO;
 document.querySelectorAll(SELECTOR).forEach(img=>{
  if(!img||img.tagName!=="IMG")return;
  img.style.setProperty("visibility","hidden","important");
  img.style.setProperty("content","normal","important");
  img.removeAttribute("srcset");img.removeAttribute("sizes");img.removeAttribute("data-src");
  img.dataset.logoSyncApplied=logo;
  img.onerror=()=>{img.onerror=null;img.src=DEFAULT_LOGO;img.style.setProperty("visibility","visible","important")};
  img.src=logo;
  requestAnimationFrame(()=>img.style.setProperty("visibility","visible","important"));
 });
}
async function start(){if(window.CKLogoManager?.ready)try{await window.CKLogoManager.ready}catch(_){}applyLogo()}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
window.addEventListener("logoDashboardChanged",applyLogo);window.addEventListener("settingsChanged",applyLogo);window.addEventListener("accountReady",applyLogo);window.addEventListener("accountDataReady",applyLogo);window.addEventListener("pageshow",applyLogo);window.addEventListener("focus",applyLogo);
const observer=new MutationObserver(m=>{for(const x of m){if(x.type==="childList")x.addedNodes.forEach(n=>{if(n.nodeType===1)applyLogo()})}});const observe=()=>document.body&&observer.observe(document.body,{childList:true,subtree:true});if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",observe,{once:true});else observe();
})();
