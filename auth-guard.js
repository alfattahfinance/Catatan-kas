// ======================================
// CATATAN KAS
// AUTH GUARD + DATA AKUN PERSISTEN
// ======================================
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

const DEFAULT_LOGO="logo-catatan-kas.jpg";
const LOGO_KEY="logoDashboard";
const SETTINGS_KEY="pengaturanAplikasi";
const TYPES_KEY="jenisKeuanganCustom";
const LOCAL_ACCOUNT_KEYS=[SETTINGS_KEY,"daftarSantri",LOGO_KEY,TYPES_KEY];
let akunLokalAktif=null;
let cloudProfileReady=false;
let cloudSaveTimer=null;

function accountKey(base){return akunLokalAktif?.uid?`${base}_${akunLokalAktif.uid}`:base}
function readJson(key,fallback={}){try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback))}catch(_){return fallback}}
function writeJson(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch(_){}}

function loadAccountLocalData(user){
  akunLokalAktif=user||null;
  cloudProfileReady=false;
  if(!user)return;
  for(const base of LOCAL_ACCOUNT_KEYS){
    const scoped=localStorage.getItem(`${base}_${user.uid}`);
    if(scoped!==null)localStorage.setItem(base,scoped);
    else if(base===SETTINGS_KEY)localStorage.setItem(base,"{}");
    else if(base==="daftarSantri")localStorage.setItem(base,"[]");
    else if(base===TYPES_KEY)localStorage.setItem(base,"[]");
    else if(base===LOGO_KEY)localStorage.removeItem(base);
  }
}

function saveAccountLocalData(user){
  if(!user)return;
  for(const base of LOCAL_ACCOUNT_KEYS){
    const value=localStorage.getItem(base);
    if(value!==null)localStorage.setItem(`${base}_${user.uid}`,value);
  }
}

async function loadCloudAccountData(user){
  if(!user)return;
  try{
    const ref=doc(db,"users",user.uid,"private","profile");
    const snap=await getDoc(ref);
    if(snap.exists()){
      const data=snap.data()||{};
      if(data.settings&&typeof data.settings==="object"){
        writeJson(SETTINGS_KEY,data.settings);
        localStorage.setItem(`${SETTINGS_KEY}_${user.uid}`,JSON.stringify(data.settings));
      }
      if(Array.isArray(data.types)){
        writeJson(TYPES_KEY,data.types);
        localStorage.setItem(`${TYPES_KEY}_${user.uid}`,JSON.stringify(data.types));
      }
      if(Array.isArray(data.localStudents)){
        writeJson("daftarSantri",data.localStudents);
        localStorage.setItem(`daftarSantri_${user.uid}`,JSON.stringify(data.localStudents));
      }
      if(typeof data.logo==="string"&&data.logo.length>0&&data.logo.length<900000){
        localStorage.setItem(LOGO_KEY,data.logo);
        localStorage.setItem(`${LOGO_KEY}_${user.uid}`,data.logo);
      }
    }else{
      await saveCloudAccountData(user,{createOnly:true});
    }
    cloudProfileReady=true;
    window.dispatchEvent(new CustomEvent("accountDataReady",{detail:{uid:user.uid}}));
  }catch(error){
    console.error("Gagal memuat data akun dari Firestore:",error);
    // Tetap gunakan cache UID lokal agar aplikasi tidak kehilangan tampilan ketika offline.
    cloudProfileReady=true;
  }
}

async function saveCloudAccountData(user,options={}){
  if(!user||!cloudProfileReady&&!options.createOnly)return;
  try{
    saveAccountLocalData(user);
    const settings=readJson(SETTINGS_KEY,{});
    const types=readJson(TYPES_KEY,[]);
    const localStudents=readJson("daftarSantri",[]);
    const logo=localStorage.getItem(LOGO_KEY)||"";
    const payload={
      uid:user.uid,
      email:user.email||"",
      settings:settings&&typeof settings==="object"?settings:{},
      types:Array.isArray(types)?types:[],
      localStudents:Array.isArray(localStudents)?localStudents:[],
      updatedAt:serverTimestamp()
    };
    // Data URI logo dapat besar; hanya simpan jika masih aman untuk satu dokumen Firestore.
    if(typeof logo==="string"&&logo.length>0&&logo.length<900000)payload.logo=logo;
    await setDoc(doc(db,"users",user.uid,"private","profile"),payload,{merge:true});
  }catch(error){
    console.error("Gagal menyimpan data akun ke Firestore:",error);
  }
}

function scheduleCloudSave(){
  if(!akunLokalAktif||!cloudProfileReady)return;
  clearTimeout(cloudSaveTimer);
  cloudSaveTimer=setTimeout(()=>saveCloudAccountData(akunLokalAktif),300);
}

function isValidLogo(value){if(!value||typeof value!=="string")return false;const v=value.trim();if(!v)return false;if(/^(?:\.\/)?assets\/logo-catatan-kas\.(?:jpg|jpeg|png|webp)$/i.test(v))return false;if(/^\/assets\/logo-catatan-kas\.(?:jpg|jpeg|png|webp)$/i.test(v))return false;return /^data:image\//i.test(v)||/^https?:\/\//i.test(v)||/^blob:/i.test(v)||/^(?:\.\/)?[\w./-]+\.(?:png|jpe?g|webp|gif|svg)$/i.test(v)}
function getConfiguredLogo(){try{const directLogo=localStorage.getItem(LOGO_KEY);if(isValidLogo(directLogo))return directLogo;const settings=readJson(SETTINGS_KEY,{});const settingsLogo=settings.logoDashboard||settings.logo||settings.logoUrl;if(isValidLogo(settingsLogo))return settingsLogo}catch(error){console.warn("Gagal membaca pengaturan logo:",error)}return DEFAULT_LOGO}
function applyPageLogo(){const logo=getConfiguredLogo();const selectors=["#laporanLogo","#logo",".ck-logo",".app-logo",".logo","#logoDashboard","#dashboardLogo","#previewLogoDashboard","#logoPreviewV2","#logoPreview","img[alt='Logo Dashboard']","img[alt='Logo aplikasi']","img[alt='Logo Catatan Kas']","[data-dashboard-logo]"];document.querySelectorAll(selectors.join(",")).forEach(img=>{if(!(img instanceof HTMLImageElement))return;img.onerror=()=>{img.onerror=null;img.src=new URL(DEFAULT_LOGO,document.baseURI).href};img.src=logo;img.removeAttribute("srcset");img.removeAttribute("data-src");img.alt=img.alt||"Logo Catatan Kas"})}
function setupLogoEvents(){applyPageLogo();window.addEventListener("logoDashboardChanged",()=>{saveAccountLocalData(akunLokalAktif);scheduleCloudSave();applyPageLogo()});window.addEventListener("pageshow",applyPageLogo);window.addEventListener("focus",applyPageLogo);window.addEventListener("storage",event=>{if(event.key===LOGO_KEY||event.key===SETTINGS_KEY||event.key===TYPES_KEY){applyPageLogo();scheduleCloudSave()}});document.addEventListener("DOMContentLoaded",applyPageLogo,{once:true});setTimeout(applyPageLogo,100);setTimeout(applyPageLogo,500);setTimeout(applyPageLogo,1200)}
setupLogoEvents();

onAuthStateChanged(auth,async user=>{
  if(!user){
    if(akunLokalAktif){saveAccountLocalData(akunLokalAktif);await saveCloudAccountData(akunLokalAktif)}
    akunLokalAktif=null;
    cloudProfileReady=false;
    window.location.replace("login.html");
    return;
  }
  loadAccountLocalData(user);
  window.currentFirebaseUser=user;
  window.currentFirebaseUid=user.uid;
  console.log("Pengguna sudah login:",user.email,user.uid);
  applyPageLogo();
  window.dispatchEvent(new CustomEvent("accountReady",{detail:{uid:user.uid,email:user.email||""}}));
  await loadCloudAccountData(user);
  applyPageLogo();
  if(location.pathname.toLowerCase().endsWith("dashboard-excel.html")||location.href.toLowerCase().includes("dashboard-excel.html"))import("./dashboard-excel-fix.js").catch(error=>console.error("Dashboard Excel gagal dimuat:",error));
});

window.addEventListener("settingsChanged",()=>{saveAccountLocalData(akunLokalAktif);scheduleCloudSave()});
window.addEventListener("jenisKeuanganBerubah",()=>{saveAccountLocalData(akunLokalAktif);scheduleCloudSave()});
window.addEventListener("daftarSantriBerubah",()=>{saveAccountLocalData(akunLokalAktif);scheduleCloudSave()});
window.addEventListener("accountDataReady",()=>{applyPageLogo()});