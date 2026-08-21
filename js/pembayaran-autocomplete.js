import "./jenis-keuangan.js";
import { db, auth } from "../firebase-config.js";
import { collection, onSnapshot, query, where } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

(() => {
  "use strict";
  if (window.__ckPaymentAutocompleteStarted) return;
  window.__ckPaymentAutocompleteStarted = true;
  const inputIds=["namaSantriPemasukan","namaSantri","santri"];
  let input=null,box=null,names=[],unsubscribe=null,observer=null,userAktif=null;
  const findInput=()=>inputIds.map(id=>document.getElementById(id)).find(Boolean)||null;
  const isDark=()=>document.documentElement.classList.contains("dark-mode")||document.body?.classList.contains("dark-mode");
  const localNames=()=>{const set=new Set();try{const keys=[];if(userAktif?.uid)keys.push(`daftarSantri_${userAktif.uid}`);keys.push("daftarSantri");for(const key of keys){const list=JSON.parse(localStorage.getItem(key)||"[]");if(Array.isArray(list))list.forEach(x=>{const n=String(x?.nama||x?.namaSantri||x?.nama_santri||x?.name||"").trim();if(n)set.add(n)})}}catch(_){}return set};
  const rebuildLocal=()=>{const set=new Set(names);localNames().forEach(n=>set.add(n));names=[...set].sort((a,b)=>a.localeCompare(b,"id",{sensitivity:"base"}))};
  const applyBoxTheme=()=>{if(!box)return;const dark=isDark();box.style.background=dark?"#2a2a2a":"#fff";box.style.color=dark?"#f1f1f1":"#212529";box.style.borderColor=dark?"#555":"#ced4da";box.querySelectorAll(".ck-suggest-item").forEach(item=>{item.style.background=dark?"#2a2a2a":"#fff";item.style.color=dark?"#f1f1f1":"#212529";item.style.borderColor=dark?"#444":"transparent"})};
  const hide=()=>{if(box)box.hidden=true};
  const move=delta=>{if(!box||box.hidden)return;const items=[...box.querySelectorAll(".ck-suggest-item")];if(!items.length)return;let index=items.findIndex(x=>x.classList.contains("ck-suggest-active"));index=index<0?(delta>0?0:items.length-1):Math.max(0,Math.min(items.length-1,index+delta));items.forEach(x=>x.classList.remove("ck-suggest-active"));items[index].classList.add("ck-suggest-active");items[index].scrollIntoView({block:"nearest"})};
  const render=()=>{ensureUI();if(!input||!box)return;rebuildLocal();const q=input.value.trim().toLocaleLowerCase("id-ID");if(!q){hide();return}const starts=names.filter(n=>n.toLocaleLowerCase("id-ID").startsWith(q));const contains=names.filter(n=>!n.toLocaleLowerCase("id-ID").startsWith(q)&&n.toLocaleLowerCase("id-ID").includes(q));const matches=[...starts,...contains].slice(0,30);box.innerHTML="";if(!matches.length){hide();return}matches.forEach(name=>{const b=document.createElement("button");b.type="button";b.className="list-group-item list-group-item-action border-0 text-start ck-suggest-item";b.textContent=name;b.style.cssText="display:block;width:100%;padding:10px 12px;background:transparent;cursor:pointer;";b.addEventListener("mousedown",e=>e.preventDefault());b.addEventListener("click",()=>{if(input)input.value=name;hide();input?.dispatchEvent(new Event("change",{bubbles:true}))});box.appendChild(b)});box.hidden=false;applyBoxTheme()};
  const ensureUI=()=>{const nextInput=findInput();if(nextInput&&nextInput!==input){input=nextInput;if(box&&box.parentElement!==input.parentElement){box.remove();box=null}}if(!input||box)return;const wrapper=input.parentElement;if(!wrapper)return;wrapper.style.position="relative";box=document.createElement("div");box.id="ckNamaSantriSuggestions";box.className="ck-nama-suggest";box.hidden=true;box.setAttribute("role","listbox");box.style.cssText="position:absolute;left:0;right:0;top:100%;z-index:2000;border:1px solid #ced4da;border-radius:0 0 12px 12px;box-shadow:0 6px 18px rgba(0,0,0,.12);max-height:240px;overflow:auto;";wrapper.appendChild(box);applyBoxTheme();input.setAttribute("autocomplete","off");input.setAttribute("aria-autocomplete","list");input.addEventListener("input",render);input.addEventListener("focus",render);input.addEventListener("keydown",e=>{if(e.key==="Escape")hide();if(e.key==="ArrowDown"){e.preventDefault();move(1)}if(e.key==="ArrowUp"){e.preventDefault();move(-1)}if(e.key==="Enter"&&!box.hidden){const active=box.querySelector(".ck-suggest-active");if(active){e.preventDefault();active.click()}}})};
  const start=()=>{ensureUI();rebuildLocal();if(unsubscribe){unsubscribe();unsubscribe=null}if(!userAktif){if(input?.value.trim())render();return}const q=query(collection(db,"santri"),where("uid","==",userAktif.uid));unsubscribe=onSnapshot(q,snap=>{const unique=new Set();snap.forEach(d=>{const x=d.data()||{},name=String(x.nama||x.namaSantri||x.nama_santri||x.name||"").trim();if(name)unique.add(name)});names=[...unique];rebuildLocal();if(input?.value.trim())render()},err=>{console.warn("Autocomplete peserta didik gagal memuat akun:",err);rebuildLocal();if(input?.value.trim())render()});if(input?.value.trim())render()};
  const refreshNames=()=>{rebuildLocal();if(input?.value.trim())render()};
  startWhenReady();
  function startWhenReady(){if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(start,0),{once:true});else setTimeout(start,0)}
  document.addEventListener("click",e=>{if(box&&!box.contains(e.target)&&e.target!==input)hide()});
  window.addEventListener("storage",e=>{if(e.key==="daftarSantri"||e.key?.startsWith("daftarSantri_")){refreshNames()}if(e.key==="pengaturanAplikasi")setTimeout(applyBoxTheme,0)});
  window.addEventListener("settingsChanged",()=>setTimeout(applyBoxTheme,0));
  window.addEventListener("daftarSantriBerubah",refreshNames);
  window.addEventListener("santriDataReady",refreshNames);
  window.addEventListener("dataKeuanganBerubah",refreshNames);
  onAuthStateChanged(auth,u=>{userAktif=u||null;names=[];start()});
  observer=new MutationObserver(()=>{const previous=input;ensureUI();if(input!==previous)render()});
  observer.observe(document.documentElement,{childList:true,subtree:true});
  setInterval(()=>{const before=names.length;rebuildLocal();if(names.length!==before&&input?.value.trim())render()},1500);
})();