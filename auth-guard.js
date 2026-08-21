// ======================================
// CATATAN KAS
// AUTH GUARD + IDENTITAS AKUN + LOGO
// ======================================
import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

const DEFAULT_LOGO="logo-catatan-kas.jpg";
const LOGO_KEY="logoDashboard";
const SETTINGS_KEY="pengaturanAplikasi";
const LOCAL_ACCOUNT_KEYS=[SETTINGS_KEY,"daftarSantri","logoDashboard"];
let akunLokalAktif=null;

function accountKey(base){return akunLokalAktif?.uid?`${base}_${akunLokalAktif.uid}`:base}
function readJson(key,fallback={}){try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback))}catch(_){return fallback}}
function writeJson(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch(_){}}
function loadAccountLocalData(user){
  akunLokalAktif=user||null;
  if(!user)return;
  for(const base of LOCAL_ACCOUNT_KEYS){
    const scoped=localStorage.getItem(`${base}_${user.uid}`);
    if(scoped!==null)localStorage.setItem(base,scoped);
    else if(base===SETTINGS_KEY) localStorage.setItem(base,"{}");
    else if(base==="daftarSantri") localStorage.setItem(base,"[]");
    else if(base===LOGO_KEY) localStorage.removeItem(base);
  }
}
function saveAccountLocalData(user){
  if(!user)return;
  for(const base of LOCAL_ACCOUNT_KEYS){
    const value=localStorage.getItem(base);
    if(value!==null)localStorage.setItem(`${base}_${user.uid}`,value);
  }
}

function isValidLogo(value){if(!value||typeof value!=="string")return false;const v=value.trim();if(!v)return false;if(/^(?:\.\/)?assets\/logo-catatan-kas\.(?:jpg|jpeg|png|webp)$/i.test(v))return false;if(/^\/assets\/logo-catatan-kas\.(?:jpg|jpeg|png|webp)$/i.test(v))return false;return /^data:image\//i.test(v)||/^https?:\/\//i.test(v)||/^blob:/i.test(v)||/^(?:\.\/)?[\w./-]+\.(?:png|jpe?g|webp|gif|svg)$/i.test(v)}
function getConfiguredLogo(){try{const directLogo=localStorage.getItem(LOGO_KEY);if(isValidLogo(directLogo))return directLogo;const settings=readJson(SETTINGS_KEY,{});const settingsLogo=settings.logoDashboard||settings.logo||settings.logoUrl;if(isValidLogo(settingsLogo))return settingsLogo}catch(error){console.warn("Gagal membaca pengaturan logo:",error)}return DEFAULT_LOGO}
function applyPageLogo(){const logo=getConfiguredLogo();const selectors=["#laporanLogo","#logo",".ck-logo",".app-logo",".logo","#logoDashboard","#dashboardLogo","#previewLogoDashboard","#logoPreviewV2","#logoPreview","img[alt='Logo Dashboard']","img[alt='Logo aplikasi']","img[alt='Logo Catatan Kas']","[data-dashboard-logo]"];document.querySelectorAll(selectors.join(",")).forEach(img=>{if(!(img instanceof HTMLImageElement))return;img.onerror=()=>{img.onerror=null;img.src=new URL(DEFAULT_LOGO,document.baseURI).href};img.src=logo;img.removeAttribute("srcset");img.removeAttribute("data-src");img.alt=img.alt||"Logo Catatan Kas"})}
function setupLogoEvents(){applyPageLogo();window.addEventListener("logoDashboardChanged",()=>{saveAccountLocalData(akunLokalAktif);applyPageLogo()});window.addEventListener("pageshow",applyPageLogo);window.addEventListener("focus",applyPageLogo);window.addEventListener("storage",event=>{if(event.key===LOGO_KEY||event.key===SETTINGS_KEY)applyPageLogo()});document.addEventListener("DOMContentLoaded",applyPageLogo,{once:true});setTimeout(applyPageLogo,100);setTimeout(applyPageLogo,500);setTimeout(applyPageLogo,1200)}
setupLogoEvents();

onAuthStateChanged(auth,user=>{
  if(!user){
    if(akunLokalAktif)saveAccountLocalData(akunLokalAktif);
    akunLokalAktif=null;
    window.location.replace("login.html");
    return;
  }
  loadAccountLocalData(user);
  window.currentFirebaseUser=user;
  window.currentFirebaseUid=user.uid;
  console.log("Pengguna sudah login:",user.email,user.uid);
  applyPageLogo();
  window.dispatchEvent(new CustomEvent("accountReady",{detail:{uid:user.uid,email:user.email||""}}));
  if(location.pathname.toLowerCase().endsWith("dashboard-excel.html")||location.href.toLowerCase().includes("dashboard-excel.html"))import("./dashboard-excel-fix.js").catch(error=>console.error("Dashboard Excel gagal dimuat:",error));
});

window.addEventListener("settingsChanged",()=>saveAccountLocalData(akunLokalAktif));
window.addEventListener("jenisKeuanganBerubah",()=>saveAccountLocalData(akunLokalAktif));
window.addEventListener("daftarSantriBerubah",()=>saveAccountLocalData(akunLokalAktif));