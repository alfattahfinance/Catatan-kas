import "./js/jenis-keuangan.js";

// ======================================================
// CATATAN KAS - APP.JS
// DASHBOARD KEUANGAN
// FIREBASE FIRESTORE REAL-TIME
// ======================================================

import { db } from "./firebase-config.js";
import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

let semuaPembayaran = [];
let semuaPengeluaran = [];
let semuaSantri = [];
let unsubscribePayments = null;
let unsubscribeExpenses = null;
let unsubscribeSantri = null;
const $ = (id) => document.getElementById(id);
const LOGO_DEFAULT = "logo-catatan-kas.jpg";
function logoDashboardTersimpan(){try{const settings=JSON.parse(localStorage.getItem("pengaturanAplikasi")||"{}");const saved=localStorage.getItem("logoDashboard");const candidates=[saved,settings?.logoDashboard,settings?.logo];for(const candidate of candidates){if(typeof candidate!=="string")continue;const logo=candidate.trim();if(!logo)continue;if(logo==="assets/logo-catatan-kas.jpg"||logo==="assets/logo-catatan-kas.png"||logo==="logo-catatan-kas.png")continue;if(/^data:image\//i.test(logo)||/^https?:\/\//i.test(logo)||/^blob:/i.test(logo)||/^(\.\/|\/)?[\w./-]+\.(jpe?g|png|webp|gif|svg)$/i.test(logo))return logo;}return LOGO_DEFAULT;}catch(_){return LOGO_DEFAULT;}}
function muatLogoDashboard(){const logo=logoDashboardTersimpan();const kandidat=document.querySelectorAll([".app-logo",".ck-logo","#logoDashboard","#dashboardLogo","#logoPreviewV2","#logoPreview","#previewLogoDashboard","img[alt='Logo Dashboard']","img[alt='Logo aplikasi']","img[alt='Logo Catatan Kas']","[data-dashboard-logo]"].join(","));kandidat.forEach(element=>{if(element&&element.tagName==="IMG"){element.src=logo;element.removeAttribute("srcset");element.removeAttribute("data-src");}});}
function refreshLogoDanDashboard(){muatLogoDashboard();tampilkanDashboard();}
function rupiah(nilai){const angka=Number(nilai)||0;return "Rp"+angka.toLocaleString("id-ID");}
function ambilNominal(item){const nilai=item?.nominal??item?.jumlah??item?.nilai??0;return Number(nilai)||0;}
function ambilNominalPengeluaran(item){const nilai=item?.nominal??item?.jumlah??item?.nilai??item?.harga??item?.total??0;return Number(nilai)||0;}
function ambilKategoriPembayaran(item){return String(item?.jenis??item?.kategori??"").trim();}
function ambilKategoriPengeluaran(item){return String(item?.jenis??item?.kategori??item?.keterangan??"").trim();}
function cocokKategori(nilai,filter){if(!filter||filter==="Semua")return true;return String(nilai).trim().toLowerCase()===String(filter).trim().toLowerCase();}
function sinkronkanFilterKategori(){const filterElement=$("filterKategori");if(!filterElement||!window.ckJenisKeuangan)return;const fromData=[...semuaPembayaran.map(ambilKategoriPembayaran),...semuaPengeluaran.map(ambilKategoriPengeluaran)];window.ckJenisKeuangan.populate(filterElement,fromData);const types=window.ckJenisKeuangan.allTypes(fromData);const seen=new Set([...filterElement.options].map(o=>String(o.value).toLowerCase()));types.forEach(type=>{if(seen.has(type.toLowerCase()))return;const o=document.createElement("option");o.value=type;o.textContent=type;filterElement.appendChild(o);seen.add(type.toLowerCase());});}
function hitungDashboard(){const filterElement=$("filterKategori");const filter=filterElement?filterElement.value:"Semua";const pembayaranTerfilter=semuaPembayaran.filter(item=>cocokKategori(ambilKategoriPembayaran(item),filter));let totalMasuk=0;pembayaranTerfilter.forEach(item=>{totalMasuk+=ambilNominal(item);});const pengeluaranTerfilter=semuaPengeluaran.filter(item=>cocokKategori(ambilKategoriPengeluaran(item),filter));let totalKeluar=0;pengeluaranTerfilter.forEach(item=>{totalKeluar+=ambilNominalPengeluaran(item);});return{totalMasuk,totalKeluar,saldo:totalMasuk-totalKeluar,totalSantri:semuaSantri.length,filter};}
function tampilkanDashboard(){sinkronkanFilterKategori();const hasil=hitungDashboard();const totalMasuk=$("totalMasuk");if(totalMasuk)totalMasuk.textContent=rupiah(hasil.totalMasuk);const totalKeluar=$("totalKeluar");if(totalKeluar)totalKeluar.textContent=rupiah(hasil.totalKeluar);const totalSaldo=$("totalSaldo");if(totalSaldo)totalSaldo.textContent=rupiah(hasil.saldo);const totalSantri=$("totalSantri");if(totalSantri)totalSantri.textContent=hasil.totalSantri.toLocaleString("id-ID");const saldo=$("saldo")||$("saldoSaatIni");if(saldo)saldo.textContent=rupiah(hasil.saldo);const pemasukan=$("pemasukan")||$("jumlahPemasukan");if(pemasukan)pemasukan.textContent=rupiah(hasil.totalMasuk);const pengeluaran=$("pengeluaran")||$("jumlahPengeluaran");if(pengeluaran)pengeluaran.textContent=rupiah(hasil.totalKeluar);try{localStorage.setItem("catatanKasDashboard",JSON.stringify(hasil));}catch(error){console.warn("Gagal menyimpan cache dashboard:",error);}window.catatanKasDashboard=hasil;}
function mulaiPembayaran(){if(unsubscribePayments)unsubscribePayments();unsubscribePayments=onSnapshot(collection(db,"payments"),function(snapshot){semuaPembayaran=snapshot.docs.map(item=>({id:item.id,...item.data()}));tampilkanDashboard();window.dispatchEvent(new CustomEvent("dataKeuanganBerubah",{detail:{tipe:"pembayaran"}}));},function(error){console.error("Gagal membaca payments:",error);});}
function mulaiPengeluaran(){if(unsubscribeExpenses)unsubscribeExpenses();unsubscribeExpenses=onSnapshot(collection(db,"expenses"),function(snapshot){semuaPengeluaran=snapshot.docs.map(item=>({id:item.id,...item.data()}));tampilkanDashboard();window.dispatchEvent(new CustomEvent("dataKeuanganBerubah",{detail:{tipe:"pengeluaran"}}));},function(error){console.error("Gagal membaca expenses:",error);});}
function mulaiSantri(){if(unsubscribeSantri)unsubscribeSantri();unsubscribeSantri=onSnapshot(collection(db,"santri"),function(snapshot){semuaSantri=snapshot.docs.map(item=>({id:item.id,...item.data()}));tampilkanDashboard();},function(error){console.error("Gagal membaca santri:",error);});}
window.refreshDashboard=function(){refreshLogoDanDashboard();};
window.addEventListener("dataKeuanganBerubah",function(){tampilkanDashboard();});
window.addEventListener("refreshDashboard",function(){refreshLogoDanDashboard();});
window.addEventListener("logoDashboardChanged",function(){muatLogoDashboard();});
window.addEventListener("storage",function(event){if(event.key==="catatanKasDataBerubah"||event.key==="logoDashboard"||event.key==="pengaturanAplikasi"||event.key==="jenisKeuanganCustom")refreshLogoDanDashboard();});
function pasangFilter(){const filter=$("filterKategori");if(!filter)return;filter.addEventListener("change",function(){tampilkanDashboard();});}
function pasangTombolDashboardExcel(){if(!document.body)return;if(document.getElementById("btnDashboardExcelCatatanKas"))return;const menuUtama=document.querySelector(".row.g-3.mb-4");if(!menuUtama)return;const kolom=document.createElement("div");kolom.className="col-12";kolom.innerHTML=`<a href="dashboard-excel.html" id="btnDashboardExcelCatatanKas" class="menu-btn" style="background:linear-gradient(135deg,#164c3d,#198754);color:#fff;border-color:#164c3d;"><i class="bi bi-file-earmark-spreadsheet" style="color:#fff;"></i><h6>Dashboard Excel</h6><small style="font-size:.68rem;opacity:.86;">Rekap pembayaran perorang</small></a>`;const pengaturan=menuUtama.querySelector("a[href='pengaturan.html']")?.closest(".col-12");if(pengaturan)menuUtama.insertBefore(kolom,pengaturan);else menuUtama.appendChild(kolom);}
function initApp(){console.log("================================");console.log("CATATAN KAS APP.JS AKTIF");console.log("================================");pasangFilter();muatLogoDashboard();tampilkanDashboard();pasangTombolDashboardExcel();mulaiPembayaran();mulaiPengeluaran();mulaiSantri();}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",initApp);else initApp();
