// KEUANGAN - jenis/pos keuangan bersama untuk pembayaran, pengeluaran, dan dashboard.
// Jenis awal kosong. Pengguna menambahkan sendiri dari Pengaturan.
// Jenis pengeluaran selalu memakai daftar jenis pembayaran yang sama.
(() => {
  "use strict";
  const KEY = "jenisKeuanganCustom";
  const MIGRATION_KEY = "jenisKeuanganLegacyDefaultsRemoved_v1";
  const LEGACY_DEFAULTS = new Set(["spp","syahriyyah","infaq","kas","beras","lainnya","uang kegiatan","uang kegiatan lainnya"]);
  const norm = value => String(value ?? "").trim().replace(/\s+/g, " ");
  const key = value => norm(value).toLocaleLowerCase("id-ID");

  function getCustom() {
    try {
      const data = JSON.parse(localStorage.getItem(KEY) || "[]");
      return Array.isArray(data) ? data.map(norm).filter(Boolean) : [];
    } catch (_) { return []; }
  }

  function migrateLegacyDefaults() {
    try {
      if (localStorage.getItem(MIGRATION_KEY) === "1") return;
      const current = getCustom();
      const cleaned = current.filter(x => !LEGACY_DEFAULTS.has(key(x)));
      localStorage.setItem(KEY, JSON.stringify(cleaned));
      localStorage.setItem(MIGRATION_KEY, "1");
    } catch (_) {}
  }

  function saveCustom(list) {
    const seen = new Set(), clean = [];
    for (const item of list) {
      const value = norm(item), k = key(value);
      if (!value || seen.has(k)) continue;
      seen.add(k); clean.push(value);
    }
    localStorage.setItem(KEY, JSON.stringify(clean));
    window.dispatchEvent(new CustomEvent("jenisKeuanganBerubah", { detail: { jenis: clean } }));
    return clean;
  }

  function allTypes() { return getCustom(); }

  function addCustom(value) {
    const name = norm(value);
    if (!name) return "";
    if (getCustom().some(x => key(x) === key(name))) return name;
    saveCustom([...getCustom(), name]);
    return name;
  }

  function removeCustom(value) {
    const k = key(value);
    saveCustom(getCustom().filter(x => key(x) !== k));
  }

  function typeSelect(select) {
    if (!select || select.tagName !== "SELECT") return;
    const current = norm(select.value);
    const types = allTypes();
    const placeholder = select.id === "filterKategori" ? "Semua" : "Pilih jenis";
    select.innerHTML = "";
    const first = document.createElement("option");
    first.value = select.id === "filterKategori" ? "Semua" : "";
    first.textContent = placeholder;
    select.appendChild(first);
    types.forEach(type => {
      const option = document.createElement("option");
      option.value = type; option.textContent = type;
      select.appendChild(option);
    });
    if (current && [...select.options].some(o => key(o.value) === key(current))) select.value = current;
    else if (select.id === "filterKategori") select.value = "Semua";
    else select.value = "";
  }

  function populate(select) { if (select?.tagName === "SELECT") typeSelect(select); }
  function resolve(selectOrIds) { const select = typeof selectOrIds === "string" ? document.getElementById(selectOrIds) : selectOrIds; return select ? norm(select.value) : ""; }
  function reset(selectOrIds) { const select = typeof selectOrIds === "string" ? document.getElementById(selectOrIds) : selectOrIds; if (select) select.value = ""; }
  function updateDashboardFilter() { const select = document.getElementById("filterKategori"); if (select) typeSelect(select); }

  function injectSettingsManager() {
    if (!document.body || document.getElementById("ckJenisKeuanganManager")) return;
    const anchor = document.querySelector("#simpanPengaturanButton")?.closest(".d-grid") || document.querySelector("#namaPondok")?.closest(".card")?.parentElement;
    if (!anchor) return;
    const section = document.createElement("section"); section.id = "ckJenisKeuanganManager"; section.className = "card custom-card";
    section.innerHTML = `<div class="card-body"><h5 class="fw-bold mb-2"><i class="bi bi-list-check text-success"></i> Jenis Pembayaran & Pengeluaran</h5><p class="text-muted small">Tambahkan jenis pembayaran sesuai kebutuhan lembaga. Jenis yang sama otomatis tersedia pada Pengeluaran.</p><div class="input-group mb-3"><input id="ckTambahJenisInput" class="form-control" maxlength="80" placeholder="Contoh: SPP, Infaq, Listrik"><button id="ckTambahJenisButton" class="btn btn-success" type="button"><i class="bi bi-plus-lg"></i> Tambahkan</button></div><div id="ckDaftarJenis"></div></div>`;
    anchor.parentNode?.insertBefore(section, anchor); renderSettingsTypes();
    document.getElementById("ckTambahJenisButton")?.addEventListener("click", () => { const input=document.getElementById("ckTambahJenisInput"); const name=norm(input?.value); if(!name)return alert("Nama jenis belum diisi."); addCustom(name); if(input)input.value=""; renderSettingsTypes(); });
    document.getElementById("ckTambahJenisInput")?.addEventListener("keydown", e => { if(e.key==="Enter")document.getElementById("ckTambahJenisButton")?.click(); });
  }

  function renderSettingsTypes() {
    const box=document.getElementById("ckDaftarJenis"); if(!box)return;
    const types=allTypes();
    if(!types.length){box.innerHTML=`<div class="text-center text-muted border rounded-3 p-3">Belum ada jenis pembayaran. Tekan <b>Tambahkan</b> untuk membuatnya.</div>`;return;}
    box.innerHTML=types.map(type=>`<div class="d-flex align-items-center justify-content-between border rounded-3 p-2 mb-2"><span class="fw-semibold">${escapeHtml(type)}</span><button type="button" class="btn btn-sm btn-outline-danger" data-hapus-jenis="${escapeHtml(type)}"><i class="bi bi-trash"></i></button></div>`).join("");
    box.querySelectorAll("[data-hapus-jenis]").forEach(btn=>btn.addEventListener("click",()=>{const name=btn.getAttribute("data-hapus-jenis");if(!confirm(`Hapus jenis \"${name}\" dari daftar? Data transaksi lama tidak dihapus.`))return;removeCustom(name);renderSettingsTypes();}));
  }
  function escapeHtml(v){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]));}
  function generalizeLabels(){const map=[["Pembayaran Santri","Pembayaran"],["Data Santri","Data Peserta Didik"],["Daftar Santri","Daftar Peserta Didik"],["Tambah Santri Baru","Tambah Peserta Didik"],["Tambah Santri","Tambah Peserta Didik"],["Kelola data santri pondok","Kelola data peserta didik"],["Nama Santri","Nama Siswa / Peserta Didik"],["Nama santri / keterangan","Nama siswa / peserta didik / keterangan"]];const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);const nodes=[];let node;while((node=walker.nextNode()))nodes.push(node);nodes.forEach(n=>{let text=n.nodeValue||"";map.forEach(([from,to])=>{text=text.replaceAll(from,to)});n.nodeValue=text;});}
  function init(){migrateLegacyDefaults();["jenis","jenisPembayaran","jenisPengeluaran","kategoriPengeluaran","kategori"].forEach(id=>{const el=document.getElementById(id);if(el?.tagName==="SELECT")populate(el);});updateDashboardFilter();if(location.pathname.endsWith("pengaturan.html"))injectSettingsManager();generalizeLabels();}
  window.ckJenisKeuangan={allTypes,addCustom,removeCustom,populate,resolve,reset,init,getCustom};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();setTimeout(init,300);setTimeout(init,1000);
  window.addEventListener("jenisKeuanganBerubah",()=>{init();renderSettingsTypes();});
})();