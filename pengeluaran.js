// CATATAN KAS - PENGELUARAN
import { db, auth } from "./firebase-config.js";
import { collection, addDoc, getDoc, updateDoc, deleteDoc, doc, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
let userAktif=null,idEdit=null,unsubscribe=null;
const $=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>\"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]));
const rp=v=>"Rp "+(Number(v)||0).toLocaleString("id-ID");
const amount=x=>Number(x?.nominal??x?.jumlah??x?.nilai??x?.total??0)||0;
const jenis=x=>String(x?.jenis??x?.kategori??"Lainnya");
const ket=x=>String(x?.keterangan??x?.nama??x?.deskripsi??x?.uraian??"Pengeluaran");
function dateOf(x){const v=x?.tanggal??x?.createdAt;if(v?.toDate)return v.toDate();if(typeof v==="string"){const d=new Date(v+"T00:00:00");if(!Number.isNaN(d.getTime()))return d;}return null;}
function dateText(x){const d=dateOf(x);return d?d.toLocaleDateString("id-ID"):"-";}
function ambil(ids){for(const id of ids){const e=$(id);if(e)return e;}return null;}
function btn(){return ambil(["btnSimpanPengeluaran","simpanPengeluaran"])||document.querySelector("button[onclick*='simpanPengeluaran']");}
function refresh(){try{localStorage.setItem("catatanKasDataBerubah",String(Date.now()));}catch(_){}window.dispatchEvent(new Event("refreshDashboard"));window.dispatchEvent(new CustomEvent("dataKeuanganBerubah",{detail:{tipe:"pengeluaran",waktu:Date.now()}}));}
function reset(){idEdit=null;const k=ambil(["keteranganPengeluaran","keterangan","namaPengeluaran","nama","deskripsi"]),n=ambil(["nominalPengeluaran","nominal","jumlah","total"]),t=ambil(["tanggalPengeluaran","tanggal","tglPengeluaran"]);if(k)k.value="";if(n)n.value="";if(t)t.value="";const b=btn();if(b){b.disabled=false;b.innerHTML="Simpan Pengeluaran";}}
function parseNominal(v){return Number(String(v??"").replace(/[^0-9]/g,""))||0;}
window.simpanPengeluaran=async function(){
 if(!userAktif)return alert("Silakan login terlebih dahulu.");
 const k=ambil(["keteranganPengeluaran","keterangan","namaPengeluaran","nama","deskripsi"])?.value.trim()||"";
 const j=ambil(["jenisPengeluaran","jenis","kategoriPengeluaran","kategori"])?.value.trim()||"Lainnya";
 const n=parseNominal(ambil(["nominalPengeluaran","nominal","jumlah","total"])?.value);
 const t=ambil(["tanggalPengeluaran","tanggal","tglPengeluaran"])?.value||null;
 const s=ambil(["satuanPengeluaran","satuan"])?.value||"Rupiah";
 if(!k)return alert("Keterangan pengeluaran belum diisi.");if(n<=0)return alert("Nominal pengeluaran belum benar.");
 const b=btn();try{if(b){b.disabled=true;b.innerHTML=idEdit?"Menyimpan perubahan...":"Menyimpan...";}const data={keterangan:k,nama:k,deskripsi:k,jenis:j,kategori:j,nominal:n,jumlah:n,total:n,satuan:s,tanggal:t,uid:userAktif.uid,updatedAt:serverTimestamp()};if(idEdit)await updateDoc(doc(db,"expenses",idEdit),data);else{data.createdAt=serverTimestamp();await addDoc(collection(db,"expenses"),data);}alert(idEdit?"Pengeluaran berhasil diperbarui.":"Pengeluaran berhasil disimpan.");reset();refresh();}catch(e){console.error(e);alert("Gagal menyimpan pengeluaran.\n\n"+(e.message||e));}finally{if(b){b.disabled=false;b.innerHTML="Simpan Pengeluaran";}}};
window.editPengeluaran=async function(id){try{const snap=await getDoc(doc(db,"expenses",id));if(!snap.exists())return alert("Data pengeluaran tidak ditemukan.");const d=snap.data();idEdit=id;const k=ambil(["keteranganPengeluaran","keterangan","namaPengeluaran","nama","deskripsi"]),j=ambil(["jenisPengeluaran","jenis","kategoriPengeluaran","kategori"]),n=ambil(["nominalPengeluaran","nominal","jumlah","total"]),t=ambil(["tanggalPengeluaran","tanggal","tglPengeluaran"]),s=ambil(["satuanPengeluaran","satuan"]);if(k)k.value=ket(d);if(j)j.value=d.jenis||d.kategori||"Lainnya";if(n)n.value=amount(d);if(t)t.value=typeof d.tanggal==="string"?d.tanggal:"";if(s)s.value=d.satuan||"Rupiah";const b=btn();if(b)b.innerHTML="Simpan Perubahan";window.scrollTo({top:0,behavior:"smooth"});}catch(e){console.error(e);alert("Gagal membuka pengeluaran.\n\n"+(e.message||e));}};
window.hapusPengeluaran=async function(id){if(!userAktif)return alert("Silakan login terlebih dahulu.");if(!window.confirm("Hapus data pengeluaran ini?\n\nData yang dihapus tidak dapat dikembalikan."))return;try{await deleteDoc(doc(db,"expenses",id));if(idEdit===id)reset();alert("Pengeluaran berhasil dihapus.");refresh();}catch(e){console.error(e);alert("Gagal menghapus pengeluaran.\n\n"+(e.message||e));}};
function render(snapshot){const c=$("daftarPengeluaran");if(!c)return;const data=snapshot.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(dateOf(b)?.getTime()||0)-(dateOf(a)?.getTime()||0));if(!data.length){c.innerHTML=`<div class="text-center text-muted p-4">Belum ada pengeluaran.</div>`;return;}c.innerHTML=data.map(x=>`<div class="list-group-item py-3"><div class="row g-2 align-items-center"><div class="col-3 small text-muted">${esc(dateText(x))}</div><div class="col-2 small fw-semibold text-danger">${esc(jenis(x))}</div><div class="col-3 fw-semibold">${esc(ket(x))}</div><div class="col-4 text-end"><div class="fw-bold text-danger">-${rp(amount(x))}</div><div class="mt-1 d-flex gap-1 justify-content-end"><button type="button" class="btn btn-sm btn-outline-primary" data-expense-action="edit" data-id="${esc(x.id)}"><i class="bi bi-pencil"></i> Edit</button><button type="button" class="btn btn-sm btn-outline-danger" data-expense-action="delete" data-id="${esc(x.id)}"><i class="bi bi-trash"></i> Hapus</button></div></div></div></div>`).join("");}
function start(){if(unsubscribe)unsubscribe();const c=$("daftarPengeluaran");if(!c)return;unsubscribe=onSnapshot(collection(db,"expenses"),render,e=>{console.error(e);c.innerHTML=`<div class="alert alert-danger m-3">Gagal memuat riwayat pengeluaran.<br><small>${esc(e.message||e)}</small></div>`;});}
document.addEventListener("click",e=>{const b=e.target.closest("[data-expense-action]");if(!b)return;e.preventDefault();e.stopPropagation();const id=b.dataset.id;if(!id)return;if(b.dataset.expenseAction==="edit")window.editPengeluaran(id);else if(b.dataset.expenseAction==="delete")window.hapusPengeluaran(id);});
document.addEventListener("DOMContentLoaded",()=>{const b=btn();if(b)b.addEventListener("click",e=>{e.preventDefault();window.simpanPengeluaran();});start();});
onAuthStateChanged(auth,user=>{userAktif=user||null;});
