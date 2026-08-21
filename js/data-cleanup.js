import { db, auth } from "../firebase-config.js";
import { collection, getDocs, deleteDoc, doc, query, where } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

const COLLECTIONS = ["payments", "expenses"];
const esc=v=>String(v??"").replace(/[&<>\"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]));
let userAktif=null;
function toast(msg){ alert(msg); }
function buatPanel(){
  if(document.getElementById("panelKelolaData")) return;
  const anchor=document.querySelector(".mobile-container")||document.body;
  const panel=document.createElement("div");
  panel.id="panelKelolaData";
  panel.className="card custom-card mb-3";
  panel.innerHTML=`<div class="card-body p-3"><div class="d-flex align-items-center justify-content-between gap-2 flex-wrap"><div><strong><i class="bi bi-database-check text-success"></i> Kelola Data</strong><div class="small text-muted">Jika ada data lama yang tidak terlihat di riwayat, gunakan tombol di bawah untuk menampilkan dan membersihkannya.</div></div><button id="btnTampilkanSemuaData" class="btn btn-outline-success btn-sm">Periksa Data</button></div><div id="hasilKelolaData" class="mt-3"></div></div>`;
  const riwayat=document.querySelector("#daftarPembayaran,#daftarPengeluaran");
  if(riwayat?.closest(".card")) riwayat.closest(".card").before(panel); else anchor.prepend(panel);
  document.getElementById("btnTampilkanSemuaData")?.addEventListener("click", tampilkanSemuaData);
}
async function bacaSemua(){
  if(!userAktif) throw new Error("Belum login.");
  const hasil={payments:[],expenses:[]};
  for(const name of COLLECTIONS){
    const snap=await getDocs(query(collection(db,name),where("uid","==",userAktif.uid)));
    hasil[name]=snap.docs.map(d=>({id:d.id,...d.data()}));
  }
  return hasil;
}
function label(x,type){
  if(type==="payments") return `${x.tanggal||"-"} · ${x.nama||x.namaSantri||x.keterangan||"-"} · ${x.jenis||x.kategori||"Lainnya"}`;
  return `${x.tanggal||"-"} · ${x.keterangan||x.nama||x.deskripsi||"-"} · ${x.jenis||x.kategori||"Lainnya"}`;
}
async function tampilkanSemuaData(){
  const out=document.getElementById("hasilKelolaData"),btn=document.getElementById("btnTampilkanSemuaData");
  if(!out)return;
  try{
    btn.disabled=true; btn.textContent="Memeriksa...";
    const data=await bacaSemua();
    const total=data.payments.length+data.expenses.length;
    out.innerHTML=`<div class="alert alert-light border mb-2"><strong>${total}</strong> transaksi ditemukan: <strong>${data.payments.length}</strong> pembayaran dan <strong>${data.expenses.length}</strong> pengeluaran.</div>`;
    const list=[...data.payments.map(x=>({...x,_type:"payments"})),...data.expenses.map(x=>({...x,_type:"expenses"}))];
    if(list.length){
      const box=document.createElement("div"); box.className="border rounded p-2"; box.style.maxHeight="260px"; box.style.overflowY="auto";
      list.slice().reverse().forEach(x=>{const row=document.createElement("div");row.className="d-flex align-items-center justify-content-between gap-2 border-bottom py-2";row.innerHTML=`<span class="small">${esc(x._type==="payments"?"Pemasukan":"Pengeluaran")}: ${esc(label(x,x._type))}</span><button class="btn btn-outline-danger btn-sm" data-clean-one="${esc(x.id)}" data-clean-type="${esc(x._type)}">Hapus</button>`;box.appendChild(row)});
      out.appendChild(box);
      const all=document.createElement("button");all.className="btn btn-danger btn-sm mt-2";all.textContent="Hapus Semua Transaksi Akun";all.addEventListener("click",hapusSemua);out.appendChild(all);
    }
    out.querySelectorAll("[data-clean-one]").forEach(b=>b.addEventListener("click",async()=>{await hapusSatu(b.dataset.cleanType,b.dataset.cleanOne);await tampilkanSemuaData()}));
  }catch(e){out.innerHTML=`<div class="alert alert-danger">Gagal membaca data: ${esc(e.message||e)}</div>`}
  finally{btn.disabled=false;btn.textContent="Periksa Data"}
}
async function hapusSatu(type,id){
  if(!userAktif||!COLLECTIONS.includes(type)||!id)return;
  if(!confirm("Hapus transaksi ini secara permanen?"))return;
  await deleteDoc(doc(db,type,id));
  localStorage.setItem("catatanKasDataBerubah",String(Date.now()));
  window.dispatchEvent(new CustomEvent("dataKeuanganBerubah"));
}
async function hapusSemua(){
  if(!userAktif)return;
  const data=await bacaSemua(); const total=data.payments.length+data.expenses.length;
  if(!total)return toast("Tidak ada transaksi untuk dihapus.");
  if(!confirm(`Anda akan menghapus ${total} transaksi dari akun ini. Lanjutkan?`))return;
  if(!confirm("PERINGATAN: semua pembayaran dan pengeluaran akun ini akan dihapus permanen. Pengaturan dan data santri tidak ikut dihapus. Lanjutkan?"))return;
  const btn=document.querySelector("#hasilKelolaData .btn-danger:last-child"); if(btn)btn.disabled=true;
  for(const type of COLLECTIONS) for(const x of data[type]) await deleteDoc(doc(db,type,x.id));
  localStorage.setItem("catatanKasDataBerubah",String(Date.now()));
  window.dispatchEvent(new CustomEvent("dataKeuanganBerubah"));
  toast(`Berhasil menghapus ${total} transaksi.`);
  await tampilkanSemuaData();
}
onAuthStateChanged(auth,u=>{userAktif=u||null;if(userAktif&&document.readyState!=="loading")buatPanel()});
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",buatPanel);else buatPanel();
