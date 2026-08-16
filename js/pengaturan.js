// ======================================
// PENGATURAN APLIKASI - JS
// ======================================

const PENGATURAN_DEFAULT = {
    namaPondok: "Ribath Madrasah Al-Fattah",
    subJudul: "Dashboard Keuangan Pondok",
    mataUang: "Rupiah",
    tema: "light"
};

const LOGO_DEFAULT = "assets/logo-catatan-kas.jpg";
const SETTINGS_KEY = "pengaturanAplikasi";
const LOGO_KEY = "logoDashboard";

function bacaPengaturan() {
    try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        const data = raw ? JSON.parse(raw) : {};
        return { ...PENGATURAN_DEFAULT, ...(data || {}) };
    } catch (error) {
        console.warn("Pengaturan tidak valid, memakai bawaan.", error);
        return { ...PENGATURAN_DEFAULT };
    }
}

function simpanDataPengaturan(data) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
        ...PENGATURAN_DEFAULT,
        ...data
    }));
}

function terapkanTema(tema) {
    const mode = tema || "light";
    let gelap = mode === "dark";

    if (mode === "system") {
        gelap = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches === true;
    }

    document.documentElement.classList.toggle("dark-mode", gelap);
    document.body?.classList.toggle("dark-mode", gelap);
}

function logoTersimpan() {
    return localStorage.getItem(LOGO_KEY) || LOGO_DEFAULT;
}

function tampilkanLogo() {
    const logo = logoTersimpan();
    document.querySelectorAll(
        "#previewLogoDashboard, #logoPreviewV2, #logoPreview, [data-dashboard-logo]"
    ).forEach((el) => {
        el.src = logo;
    });
}

function kompresLogo(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("File gambar tidak dapat dibaca."));
        reader.onload = () => {
            const img = new Image();
            img.onerror = () => reject(new Error("File bukan gambar yang valid."));
            img.onload = () => {
                const max = 512;
                const scale = Math.min(1, max / Math.max(img.width, img.height));
                const canvas = document.createElement("canvas");
                canvas.width = Math.max(1, Math.round(img.width * scale));
                canvas.height = Math.max(1, Math.round(img.height * scale));
                const ctx = canvas.getContext("2d");
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL("image/jpeg", 0.82));
            };
            img.src = reader.result;
        };
        reader.readAsDataURL(file);
    });
}

async function simpanLogo(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
        throw new Error("Silakan pilih file gambar.");
    }
    if (file.size > 10 * 1024 * 1024) {
        throw new Error("Ukuran file terlalu besar. Maksimal 10 MB.");
    }

    const dataUrl = await kompresLogo(file);
    try {
        localStorage.setItem(LOGO_KEY, dataUrl);
    } catch (error) {
        throw new Error("Logo tidak dapat disimpan. Penyimpanan perangkat mungkin penuh.");
    }
    tampilkanLogo();
}

function resetLogo() {
    localStorage.removeItem(LOGO_KEY);
    tampilkanLogo();
}

function muatFormPengaturan() {
    const data = bacaPengaturan();
    const nama = document.getElementById("namaPondok");
    const sub = document.getElementById("subJudul");
    const mata = document.getElementById("mataUang");
    const tema = document.getElementById("tema");

    if (nama) nama.value = data.namaPondok;
    if (sub) sub.value = data.subJudul;
    if (mata) mata.value = data.mataUang;
    if (tema) tema.value = data.tema;

    terapkanTema(data.tema);
    tampilkanLogo();
}

async function simpanPengaturan() {
    const btn = document.getElementById("simpanPengaturanButton");
    const spinner = document.getElementById("loadingSpinner");
    const btnText = document.getElementById("btnText");

    const data = {
        namaPondok: document.getElementById("namaPondok")?.value.trim() || "",
        subJudul: document.getElementById("subJudul")?.value.trim() || "",
        mataUang: document.getElementById("mataUang")?.value || "Rupiah",
        tema: document.getElementById("tema")?.value || "light"
    };

    if (!data.namaPondok) {
        alert("Nama pondok belum diisi.");
        return;
    }

    btn && (btn.disabled = true);
    spinner?.classList.remove("d-none");
    if (btnText) btnText.innerHTML = " Menyimpan...";

    try {
        simpanDataPengaturan(data);
        terapkanTema(data.tema);

        const file = document.getElementById("logoDashboardInput")?.files?.[0];
        if (file) await simpanLogo(file);

        alert("✅ Pengaturan berhasil disimpan!");
    } catch (error) {
        console.error(error);
        alert("❌ " + error.message);
    } finally {
        btn && (btn.disabled = false);
        spinner?.classList.add("d-none");
        if (btnText) btnText.innerHTML = '<i class="bi bi-save"></i> Simpan Pengaturan';
    }
}

function resetSemuaPengaturan() {
    if (!confirm("Kembalikan pengaturan awal? Data transaksi tidak akan dihapus.")) return;
    simpanDataPengaturan(PENGATURAN_DEFAULT);
    resetLogo();
    muatFormPengaturan();
    alert("✅ Pengaturan dikembalikan ke awal. Data transaksi tetap aman.");
}

// Dipanggil halaman lain untuk membaca pengaturan.
window.CatatanKasSettings = {
    get: bacaPengaturan,
    getLogo: logoTersimpan,
    applyTheme: terapkanTema,
    applyLogo: tampilkanLogo
};

document.addEventListener("DOMContentLoaded", () => {
    muatFormPengaturan();

    document.getElementById("simpanPengaturanButton")?.addEventListener("click", simpanPengaturan);
    document.getElementById("resetPengaturanButton")?.addEventListener("click", resetSemuaPengaturan);
    document.getElementById("resetLogoButton")?.addEventListener("click", () => {
        resetLogo();
        const input = document.getElementById("logoDashboardInput");
        if (input) input.value = "";
        alert("✅ Logo bawaan digunakan kembali.");
    });

    document.getElementById("logoDashboardInput")?.addEventListener("change", async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        try {
            await simpanLogo(file);
            alert("✅ Logo berhasil dipilih. Tekan Simpan Pengaturan untuk menyimpan pengaturan lainnya.");
        } catch (error) {
            event.target.value = "";
            alert("❌ " + error.message);
        }
    });

    document.getElementById("tema")?.addEventListener("change", (event) => {
        terapkanTema(event.target.value);
    });
});

window.matchMedia?.("(prefers-color-scheme: dark)")?.addEventListener?.("change", () => {
    const data = bacaPengaturan();
    if (data.tema === "system") terapkanTema("system");
});
