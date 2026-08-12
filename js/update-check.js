(function () {

    "use strict";

    // ==========================================
    // PENGATURAN UPDATE
    // ==========================================
   const VERSION_URL =
    "https://raw.githubusercontent.com/alfattahfinance/Catatan-kas/main/version.json";
    
    const CURRENT_VERSION =
        window.APP_VERSION || "2.0";


    // ==========================================
    // BANDINGKAN VERSI
    // ==========================================

    function versiLebihBaru(versiTerbaru, versiSekarang) {

        const terbaru =
            String(versiTerbaru)
                .split(".")
                .map(Number);

        const sekarang =
            String(versiSekarang)
                .split(".")
                .map(Number);


        const panjang =
            Math.max(
                terbaru.length,
                sekarang.length
            );


        for (let i = 0; i < panjang; i++) {

            const a =
                terbaru[i] || 0;

            const b =
                sekarang[i] || 0;


            if (a > b) {
                return true;
            }


            if (a < b) {
                return false;
            }

        }


        return false;

    }


    // ==========================================
    // TAMPILKAN NOTIFIKASI UPDATE
    // ==========================================

    function tampilkanUpdate(data) {

        const lama =
            document.getElementById(
                "updateAppModal"
            );


        if (lama) {
            lama.remove();
        }


        const modal =
            document.createElement("div");


        modal.id =
            "updateAppModal";


        modal.innerHTML = `

            <div style="
                position:fixed;
                inset:0;
                z-index:99999;
                background:rgba(0,0,0,.55);
                display:flex;
                align-items:center;
                justify-content:center;
                padding:20px;
            ">

                <div style="
                    width:100%;
                    max-width:420px;
                    background:white;
                    border-radius:22px;
                    padding:25px;
                    box-shadow:0 15px 50px rgba(0,0,0,.25);
                    text-align:center;
                ">

                    <div style="
                        width:65px;
                        height:65px;
                        margin:0 auto 15px;
                        border-radius:18px;
                        background:#198754;
                        color:white;
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        font-size:30px;
                    ">
                        ↑
                    </div>

                    <h4 style="
                        font-weight:800;
                        margin-bottom:8px;
                    ">
                        Update Tersedia
                    </h4>

                    <p style="
                        color:#6c757d;
                        margin-bottom:8px;
                    ">
                        Versi baru Keuangan tersedia.
                    </p>

                    <div style="
                        background:#f1f8f4;
                        border-radius:12px;
                        padding:12px;
                        margin:15px 0;
                    ">

                        <div>
                            Versi sekarang:
                            <strong>${CURRENT_VERSION}</strong>
                        </div>

                        <div>
                            Versi terbaru:
                            <strong>${data.version}</strong>
                        </div>

                    </div>

                    <p style="
                        font-size:.9rem;
                        color:#6c757d;
                    ">
                        ${data.message || "Versi terbaru tersedia."}
                    </p>

                    <div style="
                        display:flex;
                        gap:10px;
                        margin-top:20px;
                    ">

                        <button
                            id="updateLaterButton"
                            style="
                                flex:1;
                                border:1px solid #dee2e6;
                                background:white;
                                border-radius:12px;
                                padding:12px;
                            "
                        >
                            Nanti
                        </button>

                        <button
                            id="updateNowButton"
                            style="
                                flex:1;
                                border:0;
                                background:#198754;
                                color:white;
                                border-radius:12px;
                                padding:12px;
                                font-weight:700;
                            "
                        >
                            Update
                        </button>

                    </div>

                </div>

            </div>

        `;


        document.body.appendChild(modal);


        const nanti =
            document.getElementById(
                "updateLaterButton"
            );


        const update =
            document.getElementById(
                "updateNowButton"
            );


        nanti.addEventListener(
            "click",
            function () {

                modal.remove();

            }
        );


        update.addEventListener(
            "click",
            function () {

                if (
                    data.downloadUrl &&
                    data.downloadUrl.trim() !== ""
                ) {

                    window.open(
                        data.downloadUrl,
                        "_blank"
                    );

                } else {

                    alert(
                        "Link update belum tersedia. APK versi terbaru belum dipublikasikan."
                    );

                }

            }
        );

    }


    // ==========================================
    // CEK UPDATE
    // ==========================================

    async function cekUpdate() {

        try {

            const response =
                await fetch(
                    VERSION_URL +
                    "?t=" +
                    Date.now(),
                    {
                        cache: "no-store"
                    }
                );


            if (!response.ok) {

                throw new Error(
                    "Gagal mengambil version.json"
                );

            }


            const data =
                await response.json();


            if (!data.version) {
                return;
            }


            if (
                versiLebihBaru(
                    data.version,
                    CURRENT_VERSION
                )
            ) {

                tampilkanUpdate(data);

            }

        } catch (error) {

            console.warn(
                "Pengecekan update gagal:",
                error
            );

        }

    }


    // ==========================================
    // JALANKAN SETELAH HALAMAN SIAP
    // ==========================================

    document.addEventListener(
        "DOMContentLoaded",
        function () {

            setTimeout(
                cekUpdate,
                1500
            );

        }
    );


    // ==========================================
    // GLOBAL
    // ==========================================

    window.cekUpdateAplikasi =
        cekUpdate;


})();
