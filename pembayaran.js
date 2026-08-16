// CATATAN KAS - PEMASUKAN / PEMBAYARAN
import { db, auth } from "./firebase-config.js";
import { collection, addDoc, getDoc, updateDoc, deleteDoc, doc, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

let userAktif = null;
let idEdit = null;
let unsubscribe = null;
const $ = id => document.getElementById(id);
const esc = value => String(value ?? "").replace(/[&<>\"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]));
const rp = value => "Rp " + (Number(value) || 0).toLocaleString("id-ID");
const nominalData = x => Number(x?.nominal ?? x?.jumlah ?? x?.nilai ?? x?.total ?? 0) || 0;
const namaData = x => String(x?.namaSantri ?? x?.nama_santri ?? x?.nama ?? x?.keterangan ?? "-");
const jenisData = x => String(x?.jenis ?? x?.kategori ?? "Lainnya");
function tanggalData(x) { const v=x?.tanggal??x?.createdAt; if(v?.toDate)return v.toDate(); if(typeof v === "string"){const d=new Date(v+"T00:00:00"); if(!Number.isNaN(d.getTime()))return d;} return null; }
function tanggalTeks(x){ const d=tanggalData(x); return d ? d.toLocaleDateString("id-ID") : "-"; }
function ambil(idList){ for(const id of idList){const e=$(id); if(e)return e;} return null; }
function refreshDashboard(){ try{localStorage.setItem("catatanKasDataBerubah",String(Date.now()));}catch(_){} window.dispatchEvent(new Event("refreshDashboard")); window.dispatchEvent(new CustomEvent("dataKeuanganBerubah",{detail:{tipe:"pembayaran",waktu:Date.now()}})); }
function tombolSimpan(){ return ambil(["btnSimpanPembayaran","simpanPembayaran"]) || document.querySelector("button[onclick*='simpanPembayaran']"); }
function kosongkanForm(){ idEdit=null; const nama=ambil(["namaSantriPemasukan","namaSantri","santri","nama","keterangan"]), jenis=ambil(["jenis","jenisPembayaran","kategori"]), nominal=ambil(["nominal","nominalPembayaran","jumlah"]), tanggal=ambil(["tanggalPembayaran","tanggal","tglPembayaran"]); if(nama)nama.value=""; if(jenis)jenis.value=""; if(nominal)nominal.value=""; if(tanggal)tanggal.value=""; const b=tombolSimpan(); if(b){b.disabled=false;b.innerHTML="Simpan Pembayaran";} }

window.simpanPembayaran = async function(){
    if(!userAktif) return alert("Silakan login terlebih dahulu.");
    const nama=ambil(["namaSantriPemasukan","namaSantri","santri","nama","keterangan"])?.value.trim()||"";
    const jenis=ambil(["jenis","jenisPembayaran","kategori"])?.value.trim()||"";
    const nominalEl=ambil(["nominal","nominalPembayaran","jumlah"]);
    const nominal=Number(String(nominalEl?.value||"").replace(/[^0-9]/g,""))||0;
    const tanggal=ambil(["tanggalPembayaran","tanggal","tglPembayaran"])?.value||null;
    if(!nama)return alert("Nama santri / keterangan belum diisi.");
    if(!jenis)return alert("Jenis pembayaran belum dipilih.");
    if(nominal<=0)return alert("Nominal pembayaran belum benar.");
    const b=tombolSimpan(); try{
        if(b){b.disabled=true;b.innerHTML=idEdit?"Menyimpan perubahan...":"Menyimpan...";}
        const data={nama,namaSantri:nama,nama_santri:nama,keterangan:nama,jenis,kategori:jenis,nominal,jumlah:nominal,satuan:"Rupiah",tanggal,uid:userAktif.uid,updatedAt:serverTimestamp()};
        if(idEdit) await updateDoc(doc(db,"payments",idEdit),data); else {data.createdAt=serverTimestamp();await addDoc(collection(db,"payments"),data);}
        alert(idEdit?"Pembayaran berhasil diperbarui.":"Pembayaran berhasil disimpan.");
        kosongkanForm(); refreshDashboard();
    }catch(error){console.error(error);alert("Gagal menyimpan pembayaran.\n\n"+(error.message||error));}
    finally{if(b){b.disabled=false;b.innerHTML="Simpan Pembayaran";}}
};

window.editPembayaran = async function(id){
    try{
        const snap=await getDoc(doc(db,"payments",id)); if(!snap.exists())return alert("Data pembayaran tidak ditemukan.");
        const d=snap.data(); idEdit=id;
        const nama=ambil(["namaSantriPemasukan","namaSantri","santri","nama","keterangan"]),jenis=ambil(["jenis","jenisPembayaran","kategori"]),nominal=ambil(["nominal","nominalPembayaran","jumlah"]),tanggal=ambil(["tanggalPembayaran","tanggal","tglPembayaran"]);
        if(nama)nama.value=namaData(d); if(jenis)jenis.value=d.jenis||d.kategori||""; if(nominal)nominal.value=nominalData(d); if(tanggal)tanggal.value=typeof d.tanggal==="string"?d.tanggal:"";
        const b=tombolSimpan(); if(b)b.innerHTML="Simpan Perubahan"; window.scrollTo({top:0,behavior:"smooth"});
    }catch(error){console.error(error);alert("Gagal membuka pembayaran.\n\n"+(error.message||error));}
};

window.hapusPembayaran = async function(id){
    if(!userAktif)return alert("Silakan login terlebih dahulu.");
    if(!window.confirm("Hapus pembayaran ini?\n\nData yang dihapus tidak dapat dikembalikan."))return;
    try{ await deleteDoc(doc(db,"payments",id)); if(idEdit===id)kosongkanForm(); alert("Pembayaran berhasil dihapus."); refreshDashboard(); }
    catch(error){console.error(error);alert("Gagal menghapus pembayaran.\n\n"+(error.message||error));}
};

function render(snapshot){
    const container=$("daftarPembayaran")||$("riwayatPembayaran")||$("listPembayaran")||$("riwayat"); if(!container)return;
    const data=snapshot.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(tanggalData(b)?.getTime()||0)-(tanggalData(a)?.getTime()||0));
    if(!data.length){container.innerHTML=`<div class="text-center text-muted p-4">Belum ada pemasukan.</div>`;return;}
    container.innerHTML=data.map(item=>`<div class="list-group-item py-3">
        <div class="row g-2 align-items-center">
            <div class="col-3 small text-muted">${esc(tanggalTeks(item))}</div>
            <div class="col-2 small fw-semibold text-success">${esc(jenisData(item))}</div>
            <div class="col-3 fw-semibold">${esc(namaData(item))}</div>
            <div class="col-4 text-end">
                <div class="fw-bold text-success">+${rp(nominalData(item))}</div>
                <div class="mt-1 d-flex gap-1 justify-content-end">
                    <button type="button" class="btn btn-sm btn-outline-primary" data-payment-action="edit" data-id="${esc(item.id)}"><i class="bi bi-pencil"></i> Edit</button>
                    <button type="button" class="btn btn-sm btn-outline-danger" data-payment-action="delete" data-id="${esc(item.id)}"><i class="bi bi-trash"></i> Hapus</button>
                </div>
            </div>
        </div>
    </div>`).join("");
}
function mulaiRealtime(){ if(unsubscribe)unsubscribe(); const c=$("daftarPembayaran")||$("riwayatPembayaran")||$("listPembayaran")||$("riwayat"); if(!c)return; unsubscribe=onSnapshot(collection(db,"payments"),render,error=>{console.error(error);c.innerHTML=`<div class="alert alert-danger m-3">Gagal memuat riwayat pembayaran.<br><small>${esc(error.message||error)}</small></div>`;}); }

document.addEventListener("click",event=>{const b=event.target.closest("[data-payment-action]");if(!b)return;event.preventDefault();event.stopPropagation();const id=b.dataset.id;if(!id)return;if(b.dataset.paymentAction==="edit")window.editPembayaran(id);else if(b.dataset.paymentAction==="delete")window.hapusPembayaran(id);});

document.addEventListener("DOMContentLoaded",()=>{const b=tombolSimpan();if(b)b.addEventListener("click",e=>{e.preventDefault();window.simpanPembayaran();});mulaiRealtime();});
onAuthStateChanged(auth,user=>{userAktif=user||null;});
