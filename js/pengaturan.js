import { db, auth } from "../firebase-config.js";
import { doc, getDoc, setDoc, deleteField } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

const $ = id => document.getElementById(id);
// SATU-SATUNYA logo bawaan aplikasi.
const DEFAULT_LOGO = "Photoroom_20260812_224807.png?v=20260826";
const DEFAULT = { namaLembaga: "", subJudul: "", mataUang: "Rupiah", tema: "system" };
let uid = "";
let loading = false;
const key = base => uid ? `${base}_${uid}` : base;
const read = () => { try { return JSON.parse(localStorage.getItem(key("pengaturanAplikasi")) || "{}") || {}; } catch (_) { return {}; } };
const write = data => { try { localStorage.setItem(key("pengaturanAplikasi"), JSON.stringify(data)); return true; } catch (_) { return false; } };

function normalize(data = {}) {
  const namaLembaga = String(data.namaLembaga ?? data.namaPondok ?? data.namaSekolah ?? data.lembaga ?? "").trim();
  const subJudul = String(data.subJudul ?? data.subjudul ?? data.subTitle ?? "").trim();
  return { ...data, namaLembaga, subJudul };
}
function cleanLocal(data) {
  const out = { ...data };
  delete out.namaPondok; delete out.namaSekolah; delete out.lembaga; delete out.subjudul; delete out.subTitle;
  return out;
}
function validCustomLogo(value) {
  const v = String(value || "").trim();
  if (!v) return false;
  // Tolak seluruh logo lama/referensi lama. Logo bawaan hanya boleh DEFAULT_LOGO.
  if (/logo-catatan-kas\.(?:jpg|jpeg|png|webp)$/i.test(v)) return false;
  return /^data:image\//i.test(v) || /^https?:\/\//i.test(v) || /^(?:\.\/)?[\w./-]+\.(?:png|jpe?g|webp|gif|svg)(?:\?.*)?$/i.test(v);
}
function logoRead(data) {
  const fromData = String(data?.logoDashboard || "").trim();
  if (validCustomLogo(fromData)) return fromData;
  try {
    const saved = String(localStorage.getItem(key("logoDashboard")) || "").trim();
    if (validCustomLogo(saved)) return saved;
  } catch (_) {}
  return DEFAULT_LOGO;
}
function status(text, error = false) { const e = $("statusPengaturan"); if (!e) return; e.textContent = text; e.classList.toggle("text-danger", error); e.classList.toggle("text-success", !error); }
function applyTheme(value, persist = true) {
  const t = ["light", "dark", "system"].includes(value) ? value : "system";
  if (window.themeManager?.setTheme) { window.themeManager.setTheme(t, persist); return; }
  const resolved = t === "system" ? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : t;
  document.documentElement.classList.toggle("dark-mode", resolved === "dark");
  document.documentElement.classList.toggle("light-mode", resolved === "light");
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;
  try { localStorage.setItem(key("themeMode"), t); } catch (_) {}
}
function fill(data) {
  const d = normalize(data);
  if ($("namaSekolah")) $("namaSekolah").value = d.namaLembaga;
  if ($("subJudul")) $("subJudul").value = d.subJudul;
  if ($("mataUang")) $("mataUang").value = d.mataUang || "Rupiah";
  if ($("tema")) $("tema").value = ["light", "dark", "system"].includes(d.tema) ? d.tema : "system";
  const preview = $("previewLogoDashboard");
  if (preview) { preview.removeAttribute("srcset"); preview.removeAttribute("data-src"); preview.src = logoRead(d); preview.onerror = () => { preview.onerror = null; preview.src = DEFAULT_LOGO; }; }
  applyTheme($("tema")?.value || "system", false);
}
async function load(userUid) {
  uid = userUid || "";
  let data = normalize({ ...DEFAULT, ...read() });
  if (uid) {
    try { const snap = await getDoc(doc(db, "settings", uid)); if (snap.exists()) data = normalize({ ...data, ...snap.data() }); }
    catch (e) { console.warn("Gagal membaca pengaturan akun; data perangkat tetap digunakan.", e); }
  }
  data = cleanLocal(data);
  write(data);
  if (validCustomLogo(data.logoDashboard)) { try { localStorage.setItem(key("logoDashboard"), data.logoDashboard); } catch (_) {} }
  fill(data);
  window.dispatchEvent(new Event("settingsChanged")); window.dispatchEvent(new Event("logoDashboardChanged"));
}
async function save() {
  if (loading) return;
  const namaLembaga = $("namaSekolah")?.value?.trim() || "";
  const subJudul = $("subJudul")?.value?.trim() || "";
  const data = cleanLocal({ ...read(), namaLembaga, subJudul, mataUang: $("mataUang")?.value || "Rupiah", tema: $("tema")?.value || "system", updatedAt: new Date().toISOString() });
  if (!write(data)) { status("Penyimpanan perangkat penuh. Pengaturan belum tersimpan.", true); return; }
  applyTheme(data.tema, true); window.dispatchEvent(new Event("settingsChanged"));
  if (!uid) { status("Pengaturan tersimpan di perangkat."); return; }
  loading = true;
  try { await setDoc(doc(db, "settings", uid), { ...data, namaLembaga, subJudul, namaPondok: deleteField(), namaSekolah: deleteField(), lembaga: deleteField(), subjudul: deleteField(), subTitle: deleteField() }, { merge: true }); status("Pengaturan tersimpan."); }
  catch (e) { console.error(e); status("Pengaturan tersimpan di perangkat, tetapi gagal sinkron ke akun.", true); }
  finally { loading = false; }
}
function makeSmallImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader(); reader.onerror = reject;
    reader.onload = () => { const img = new Image(); img.onload = () => { const max = 512, scale = Math.min(1, max / Math.max(img.width, img.height)); const w = Math.max(1, Math.round(img.width * scale)), h = Math.max(1, Math.round(img.height * scale)); const canvas = document.createElement("canvas"); canvas.width = w; canvas.height = h; const ctx = canvas.getContext("2d"); ctx.drawImage(img, 0, 0, w, h); resolve(canvas.toDataURL("image/jpeg", 0.82)); }; img.onerror = reject; img.src = reader.result; };
    reader.readAsDataURL(file);
  });
}
async function changeLogo(file) {
  if (!file) return;
  if (!file.type?.startsWith("image/")) { status("File logo harus berupa gambar.", true); return; }
  try {
    const src = await makeSmallImage(file);
    try { localStorage.setItem(key("logoDashboard"), src); } catch (_) { status("Logo tidak dapat disimpan di perangkat.", true); return; }
    const data = { ...cleanLocal(read()), logoDashboard: src, updatedAt: new Date().toISOString() }; write(data);
    const preview = $("previewLogoDashboard"); if (preview) { preview.removeAttribute("srcset"); preview.removeAttribute("data-src"); preview.src = src; }
    if (uid) { try { await setDoc(doc(db, "settings", uid), { logoDashboard: src, updatedAt: new Date().toISOString() }, { merge: true }); } catch (e) { console.error(e); status("Logo tersimpan di perangkat, tetapi gagal sinkron ke akun.", true); } }
    window.dispatchEvent(new Event("logoDashboardChanged")); window.dispatchEvent(new Event("settingsChanged")); status("Logo berhasil disimpan.");
  } catch (e) { console.error(e); status("Logo tidak dapat diproses. Pilih gambar lain.", true); }
}
async function resetLogo() {
  try { localStorage.removeItem(key("logoDashboard")); } catch (_) {}
  const data = { ...cleanLocal(read()) }; delete data.logoDashboard; write(data);
  const preview = $("previewLogoDashboard"); if (preview) { preview.removeAttribute("srcset"); preview.removeAttribute("data-src"); preview.src = DEFAULT_LOGO; }
  if (uid) { try { await setDoc(doc(db, "settings", uid), { logoDashboard: deleteField(), updatedAt: new Date().toISOString() }, { merge: true }); } catch (e) { console.error(e); } }
  window.dispatchEvent(new Event("logoDashboardChanged")); window.dispatchEvent(new Event("settingsChanged")); status("Logo bawaan berhasil digunakan.");
}
async function resetAll() {
  if (!confirm("Kembalikan pengaturan awal?")) return;
  const data = { ...DEFAULT, updatedAt: new Date().toISOString() }; write(data);
  try { localStorage.removeItem(key("logoDashboard")); } catch (_) {}
  fill(data); applyTheme("system", true);
  if (uid) { try { await setDoc(doc(db, "settings", uid), { ...data, logoDashboard: deleteField(), namaPondok: deleteField(), namaSekolah: deleteField(), lembaga: deleteField(), subjudul: deleteField(), subTitle: deleteField() }, { merge: true }); } catch (e) { console.error(e); status("Pengaturan perangkat direset, tetapi akun gagal disinkronkan.", true); return; } }
  window.dispatchEvent(new Event("logoDashboardChanged")); window.dispatchEvent(new Event("settingsChanged")); status("Pengaturan dikembalikan ke awal.");
}
$("simpanPengaturanButton")?.addEventListener("click", e => { e.preventDefault(); save(); });
$("tema")?.addEventListener("change", () => save());
["namaSekolah", "subJudul", "mataUang"].forEach(id => $(id)?.addEventListener("change", () => save()));
$("logoDashboardInput")?.addEventListener("change", e => changeLogo(e.target.files?.[0]));
$("resetLogoButton")?.addEventListener("click", e => { e.preventDefault(); resetLogo(); });
$("resetPengaturanButton")?.addEventListener("click", e => { e.preventDefault(); resetAll(); });
onAuthStateChanged(auth, user => { uid = user?.uid || ""; const email = $("emailAkun"); if (email) email.textContent = user?.email || "Belum login — mode umum"; load(uid); });
window.addEventListener("themeChanged", e => { const t = e.detail?.theme || "system"; if ($("tema")) $("tema").value = t; });
