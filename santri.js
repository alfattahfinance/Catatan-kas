import { db, auth } from "./firebase-config.js";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, onSnapshot, serverTimestamp, query, where, getDoc } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

const $=id=>document.getElementById(id); const esc=v=>String(v??"").replace(/[&<>\"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]));
let userAktif=null, unsubscribe=null, serverLoaded=false;
const inputId=(...ids)=>ids.map(id=>$(id)).find(Boolean); const namaInput=()=>inputId("nama","namaSantri"); const kelasInput=()=>inputId("kelas","kelasSantri"); const waliInput=()=>inputId("wali","hpSantri"); const idInput=()=>$("idSantri");
const cacheKey=()=>userAktif?.uid?`daftarSantri_${userAktif.uid}`:"daftarSantri";
function readCache(){try{const x=JSON.parse(localStorage.getItem(cacheKey())||"[]");return Array.isArray(x)?x:[]}catch(_){return []}}
function cleanList(list){const map=new Map();for(const x of list||[]){const nama=String(x?.nama??x?.namaSantri??x?.name??"").trim();if(!nama)continue;const id=String(x?.id??x?.docId??"").trim();const key=id||nama.toLowerCase();map.set(key,{id,nama,kelas:String(x?.kelas??x?.class??"-").trim()||"-",wali:String(x?.wali??x?.walisantri??"-").trim()||"-"})}return [...map.values()]}
function writeCache(list){try{localStorage.setItem(cacheKey(),JSON.stringify(cleanList(list)))}catch(_){} }
function clearCache(){try{localStorage.removeItem(cacheKey())}catch(_){} }
function kosongkan(){["nama","namaSantri","kelas","kelasSantri","wali","hpSantri","idSantri"].forEach(id=>{if($(id))$(id).value=""});const b=document.querySelector("button[onclick*='simpanSantri'],#btnSimpanSantri");if(b)b.innerHTML="Simpan Peserta Didik"}
function refresh(){try{localStorage.setItem("catatanKasDataBerubah",String(Date.now()))}catch(_){}window.dispatchEvent(new CustomEvent("daftarSantriBerubah"));window.dispatchEvent(new CustomEvent("dataKeuanganBerubah"));window.dispatchEvent(new CustomEvent("santriDataReady",{detail:{uid:userAktif?.uid||null,list:readCache()}}))}
function renderList(raw){const list=cleanList(raw);const el=$("daftarSantri"),tbody=$("tbodySantri"),jumlah=$("jumlahSantri");if(jumlah)jumlah.textContent=`${list.length} peserta didik`;const empty='<div class="text-center text-muted py-3">Belum ada data peserta didik.</div>';if(el){el.innerHTML=list.length?list.map((x,i)=>`<li class="list-group-item d-flex justify-content-between align-items-center py-3 gap-2"><div class="flex-grow-1"><b class="d-block nama-santri">${i+1}. ${esc(x.nama)}</b><small class="text-muted kelas-santri">Kelas: ${esc(x.kelas)} • Wali: ${esc(x.wali)}</small></div><div class="d-flex gap-1"><button type="button" class="btn btn-outline-primary btn-sm" data-santri-action="edit" data-id="${esc(x.id)}"><i class="bi bi-pencil"></i></button><button type="button" class="btn btn-outline-danger btn-sm" data-santri-action="delete" data-id="${esc(x.id)}"><i class="bi bi-trash"></i></button></div></li>`).join(""):empty}
if(tbody){tbody.innerHTML=list.length?list.map((x,i)=>`<tr><td>${i+1}</td><td class="nama-santri">${esc(x.nama)}</td><td class="kelas-santri">${esc(x.kelas)}</td><td class="text-center"><button type="button" class="btn btn-outline-primary btn-sm me-1" data-santri-action="edit" data-id="${esc(x.id)}"><i class="bi bi-pencil"></i></button><button type="button" class="btn btn-outline-danger btn-sm" data-santri-action="delete" data-id="${esc(x.id)}"><i class="bi bi-trash"></i></button></td></tr>`).join(""):"<tr><td colspan=\"4\" class=\"text-center text-muted py-4\">Belum ada data peserta didik.</td></tr>"}
window.__daftarSantri=Object.freeze(list.map(x=>({...x}))); window.dispatchEvent(new CustomEvent("santriDataReady",{detail:{uid:userAktif?.uid||null,list}}));
}
function renderServer(snap){const server=cleanList(snap.docs.map(d=>({id:d.id,...d.data()})));serverLoaded=true;if(server.length){writeCache(server);renderList(server)}else{const cached=readCache();renderList(cached)}}
async function load(){const el=$("daftarSantri"),tbody=$("tbodySantri");if(!el&&!tbody)return;if(unsubscribe){unsubscribe();unsubscribe=null}serverLoaded=false;if(!userAktif){renderList(readCache());return}const cached=readCache();if(cached.length)renderList(cached);else{if(el)el.innerHTML='<div class="text-center text-muted py-3">Memuat data peserta didik...</div>';if(tbody)tbody.innerHTML='<tr><td colspan="4" class="text-center text-muted py-4">Memuat data peserta didik...</td></tr>'}const q=query(collection(db,"santri"),where("uid","==",userAktif.uid));try{const first=await getDocs(q);if(auth.currentUser?.uid===userAktif.uid)renderServer(first);unsubscribe=onSnapshot(q,s=>{if(auth.currentUser?.uid===userAktif.uid)renderServer(s)},e=>{console.warn("Firestore data peserta listener:",e);const c=readCache();renderList(c);})}catch(e){console.error(e);renderList(readCache())}}
window.simpanSantri=async()=>{if(!userAktif)return alert("Silakan login terlebih dahulu.");const nama=namaInput()?.value.trim()||"",kelas=kelasInput()?.value.trim()||"-",wali=waliInput()?.value.trim()||"-",id=idInput()?.value||"";if(!nama)return alert("Silakan isi nama peserta didik.");try{if(id){const ref=doc(db,"santri",id),old=await getDoc(ref);if(!old.exists()||old.data()?.uid!==userAktif.uid)return alert("Data ini bukan milik akun Anda.");await updateDoc(ref,{nama,kelas,wali,updatedAt:serverTimestamp(),uid:userAktif.uid});}else{await addDoc(collection(db,"santri"),{nama,kelas,wali,createdAt:serverTimestamp(),updatedAt:serverTimestamp(),uid:userAktif.uid,akunEmail:userAktif.email||""});}await load();kosongkan();refresh();alert(id?"Data peserta didik berhasil diperbarui.":"Peserta didik berhasil ditambahkan")}catch(e){alert("Gagal menyimpan data peserta didik.\n\n"+(e.message||e))}};
window.editSantri=async id=>{if(!userAktif)return alert("Silakan login terlebih dahulu.");try{const s=await getDoc(doc(db,"santri",id));if(!s.exists()||s.data()?.uid!==userAktif.uid)return alert("Data peserta didik tidak ditemukan pada akun ini.");const d=s.data();if(namaInput())namaInput().value=d.nama||"";if(kelasInput())kelasInput().value=d.kelas||"";if(waliInput())waliInput().value=d.wali||"";if(idInput())idInput().value=id;const b=document.querySelector("button[onclick*='simpanSantri'],#btnSimpanSantri");if(b)b.innerHTML="Simpan Perubahan";window.scrollTo({top:0,behavior:"smooth"})}catch(e){alert("Gagal membuka data peserta didik.\n\n"+(e.message||e))}};
window.hapusSantri=async id=>{if(!userAktif)return alert("Silakan login terlebih dahulu.");if(!confirm("Hapus data peserta didik ini?\n\nData yang dihapus tidak dapat dikembalikan."))return;try{const ref=doc(db,"santri",id),s=await getDoc(ref);if(!s.exists()||s.data()?.uid!==userAktif.uid)return alert("Data peserta didik tidak ditemukan pada akun ini.");await deleteDoc(ref);const left=readCache().filter(x=>x.id!==id);if(left.length)writeCache(left);else clearCache();await load();if(idInput()?.value===id)kosongkan();alert("Data peserta didik berhasil dihapus.");refresh()}catch(e){alert("Gagal menghapus data peserta didik.\n\n"+(e.message||e))}};
document.addEventListener("click",e=>{const b=e.target.closest("#btnSimpanSantri,button[onclick*='simpanSantri']");if(b){e.preventDefault();e.stopImmediatePropagation();window.simpanSantri();return}const a=e.target.closest("[data-santri-action]");if(!a)return;e.preventDefault();e.stopPropagation();a.dataset.santriAction==="edit"?window.editSantri(a.dataset.id):window.hapusSantri(a.dataset.id)},true);

// Istilah tampilan dibuat umum: istilah internal/database tetap tidak diubah.
function gunakanIstilahUmum(){
  const replaceText=(text)=>String(text??"")
    .replace(/Data Santri/gi,"Data Peserta Didik")
    .replace(/Nama Santri/gi,"Nama Peserta Didik")
    .replace(/Daftar Santri/gi,"Daftar Peserta Didik")
    .replace(/Santri/gi,"Peserta Didik")
    .replace(/santri/gi,"peserta didik");
  const apply=(root)=>{
    if(!root)return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(n=>{const v=replaceText(n.nodeValue);if(v!==n.nodeValue)n.nodeValue=v});
    root.querySelectorAll?.("input,textarea,button,[title],[aria-label]").forEach(el=>{
      if(el.placeholder)el.placeholder=replaceText(el.placeholder);
      if(el.title)el.title=replaceText(el.title);
      if(el.getAttribute("aria-label"))el.setAttribute("aria-label",replaceText(el.getAttribute("aria-label")));
      if(el.tagName==="BUTTON"&&el.innerHTML)el.innerHTML=replaceText(el.innerHTML);
    });
  };
  document.title=replaceText(document.title);
  document.querySelector('meta[name="description"]')?.setAttribute("content",replaceText(document.querySelector('meta[name="description"]').getAttribute("content")));
  apply(document.body);
  if(!document.body.dataset.ckGeneralLabelObserver){
    const observer=new MutationObserver(mutations=>{for(const m of mutations){for(const n of m.addedNodes){if(n.nodeType===1)apply(n);else if(n.nodeType===3)n.nodeValue=replaceText(n.nodeValue)}}});
    observer.observe(document.body,{childList:true,subtree:true});
    document.body.dataset.ckGeneralLabelObserver="1";
  }
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",gunakanIstilahUmum,{once:true});else gunakanIstilahUmum();
window.addEventListener("daftarSantriBerubah",()=>{if(userAktif)load()});import("./js/import-santri-ui.js").catch(()=>{});onAuthStateChanged(auth,u=>{userAktif=u||null;load();setTimeout(gunakanIstilahUmum,0)});