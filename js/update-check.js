// ==========================================
// CATATAN KEUANGAN
// AUTO UPDATE CHECK
// ==========================================

(function () {

    const CURRENT_VERSION =
        window.APP_VERSION || "1.0.0";

    const CHECK_INTERVAL =
        60 * 1000; // 1 menit


    // ==========================================
    // CEK UPDATE
    // ==========================================

    async function cekUpdate() {

        try {

            const response = await fetch(
                "version.json?t=" + Date.now(),
                {
                    cache: "no-store"
                }
            );


            if (!response.ok) {
                return;
            }


            const data =
                await response.json();


            if (!data.version) {
                return;
            }


            console.log(
                "Versi aplikasi:",
                CURRENT_VERSION
            );

            console.log(
                "Versi terbaru:",
                data.version
            );


            if (
                data.version !==
                CURRENT_VERSION
            ) {

                tampilkanUpdate(data);

            }

        } catch (error) {

            console.warn(
                "Gagal mengecek pembaruan:",
                error
            );

        }

    }


    // ==========================================
    // TAMPILKAN NOTIFIKASI UPDATE
    // ==========================================

    function tampilkanUpdate(data) {

        if (
            document.getElementById(
                "updateAppBox"
            )
        ) {
            return;
        }


        const box =
            document.createElement("div");


        box.id =
            "updateAppBox";


        box.innerHTML = `

            <div class="update-app-inner">

                <div class="update-app-icon">
                    <i class="bi bi-arrow-repeat"></i>
                </div>

                <div class="update-app-content">

                    <strong>
                        Pembaruan tersedia
                    </strong>

                    <div class="update-app-message">
                        ${data.message || "Versi terbaru aplikasi tersedia."}
                    </div>

                    <small>
                        Versi baru: ${data.version}
                    </small>

                </div>

                <button
                    type="button"
                    id="btnUpdateApp"
                    class="update-app-button"
                >
                    Update
                </button>

            </div>

        `;


        document.body.appendChild(box);


        document
            .getElementById("btnUpdateApp")
            .addEventListener(
                "click",
                lakukanUpdate
            );

    }


    // ==========================================
    // UPDATE APLIKASI
    // ==========================================

    function lakukanUpdate() {

        const tombol =
            document.getElementById(
                "btnUpdateApp"
            );


        if (tombol) {

            tombol.disabled = true;

            tombol.textContent =
                "Memuat...";

        }


        // Tambahkan timestamp agar browser
        // mengambil halaman terbaru

        const url =
            window.location.pathname +
            "?update=" +
            Date.now();


        window.location.replace(url);

    }


    // ==========================================
    // CSS NOTIFIKASI
    // ==========================================

    const style =
        document.createElement("style");


    style.textContent = `

        #updateAppBox {

            position: fixed;

            left: 16px;

            right: 16px;

            bottom: 18px;

            z-index: 99999;

            animation:
                updateSlideUp
                .3s ease;

        }


        .update-app-inner {

            max-width: 600px;

            margin: auto;

            background: #ffffff;

            border-radius: 18px;

            padding: 14px 16px;

            display: flex;

            align-items: center;

            gap: 12px;

            box-shadow:
                0 8px 30px
                rgba(0, 0, 0, .18);

            border:
                1px solid
                rgba(25, 135, 84, .18);

        }


        .update-app-icon {

            width: 42px;

            height: 42px;

            min-width: 42px;

            border-radius: 12px;

            display: flex;

            align-items: center;

            justify-content: center;

            background:
                rgba(25, 135, 84, .12);

            color: #198754;

            font-size: 20px;

        }


        .update-app-content {

            flex: 1;

            min-width: 0;

        }


        .update-app-content strong {

            display: block;

            color: #198754;

            font-size: 15px;

        }


        .update-app-message {

            font-size: 12px;

            color: #666;

            margin-top: 2px;

        }


        .update-app-content small {

            font-size: 11px;

            color: #888;

        }


        .update-app-button {

            border: none;

            border-radius: 10px;

            background: #198754;

            color: white;

            padding: 9px 14px;

            font-weight: 600;

            cursor: pointer;

        }


        .update-app-button:hover {

            background: #146c43;

        }


        .update-app-button:disabled {

            opacity: .7;

        }


        @keyframes updateSlideUp {

            from {

                opacity: 0;

                transform:
                    translateY(30px);

            }

            to {

                opacity: 1;

                transform:
                    translateY(0);

            }

        }


        body.dark-mode
        .update-app-inner {

            background: #1e1e1e;

            border-color: #444;

        }


        body.dark-mode
        .update-app-message {

            color: #bbb;

        }


        body.dark-mode
        .update-app-content small {

            color: #999;

        }

    `;


    document.head.appendChild(style);


    // ==========================================
    // JALANKAN SAAT HALAMAN SIAP
    // ==========================================

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            cekUpdate
        );

    } else {

        cekUpdate();

    }


    // Cek lagi setiap 1 menit

    setInterval(
        cekUpdate,
        CHECK_INTERVAL
    );


})();
