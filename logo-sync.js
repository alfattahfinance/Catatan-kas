(function(){
"use strict";
const DEFAULT_LOGO="Photoroom_20260812_224807.png?v=20260826";
const DEFAULT_NAME="Keuangan";
const DEFAULT_SUBTITLE="Dashboard Keuangan";
const SELECTOR=".app-logo,.ck-logo,.logo,#logo,#logoDashboard,#dashboardLogo,#laporanLogo,#logoPreview,#logoPreviewV2,#previewLogoDashboard,#logoPemasukan,#logoPengeluaran,img[alt='Logo Dashboard'],img[alt='Logo aplikasi'],img[alt='Logo Catatan Kas'],img[alt='Logo Keuangan'],img[alt='Logo'],[data-dashboard-logo]";
const NAME_SELECTOR="[data-app-name],.app-name,.ck-title";
const SUBTITLE_SELECTOR="[data-app-subtitle],.app-subtitle,.ck-subtitle";
function uid(){return String(window.currentFirebaseUid||window.currentFirebaseUser?.uid||window.__ckUserUid||"").trim()}
function localKey(base){const id=uid();return id?`${base}_${id}`:base}
function readSettings(){try{const id=uid();const scoped=id?JSON.parse(localStorage.getItem(`pengaturanAplikasi_${id}`)||"{}"):{};const direct=JSON.parse(localStorage.getItem("pengaturanAplikasi")||"{}");return {...direct,...scoped}}catch(_){return{}}}
function appText(){const s=readSettings();return{namaLembaga:String(s.namaLembaga??s.namaPondok??s.namaSekolah??s.lembaga??"").trim()||DEFAULT_NAME,subJudul:String(s.subJudul??s.subjudul??s.subTitle??"").trim()||DEFAULT_SUBTITLE}}
function applyAppText(){const t=appText();document.querySelectorAll(NAME_SELECTOR).forEach(el=>{el.textContent=t.namaLembaga});document.querySelectorAll(SUBTITLE_SELECTOR).forEach(el=>{el.textContent=t.subJudul});
 // Jika halaman memakai id khusus untuk nama lembaga, tetap samakan.
 document.querySelectorAll("#namaSekolahHeader,[data-lembaga-name]").forEach(el=>{el.textContent=t.namaLembaga});
}
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
  if(img.getAttribute("src")!==logo)img.src=logo;
  requestAnimationFrame(()=>img.style.setProperty("visibility","visible","important"));
 });
}
function applyAll(){applyAppText();applyLogo()}
async function start(){if(window.CKLogoManager?.ready)try{await window.CKLogoManager.ready}catch(_){}applyAll();setTimeout(applyAll,50);setTimeout(applyAll,300)}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
window.addEventListener("logoDashboardChanged",applyAll);window.addEventListener("settingsChanged",applyAll);window.addEventListener("accountReady",applyAll);window.addEventListener("accountDataReady",applyAll);window.addEventListener("pageshow",applyAll);window.addEventListener("focus",applyAll);
const observer=new MutationObserver(m=>{let changed=false;for(const x of m){if(x.type==="childList"){x.addedNodes.forEach(n=>{if(n.nodeType===1)changed=true})}}if(changed)applyAll()});
const observe=()=>document.body&&observer.observe(document.body,{childList:true,subtree:true});if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",observe,{once:true});else observe();
})();