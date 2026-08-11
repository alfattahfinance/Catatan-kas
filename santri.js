import { db } from "./firebase-config.js";
import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    updateDoc,
    doc
    
}from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

const daftarSantri = document.getElementById("daftarSantri");

tampilkan();

window.simpanSantri = async function () {

    const id = document.getElementById("idSantri").value;

    const nama = document.getElementById("nama").value.trim();
    const kelas = document.getElementById("kelas").value.trim();
    const wali = document.getElementById("wali").value.trim();


    if (!nama || !kelas) {
        alert("Nama dan kelas harus diisi!");
        return;
    }


    try {

        if(id){

            await updateDoc(doc(db,"santri",id),{
                nama,
                kelas,
                wali
            });

            alert("Data santri berhasil diperbarui.");

        } else {


            await addDoc(collection(db, "santri"), {
                nama,
                kelas,
                wali
            });

            alert("Santri berhasil ditambahkan.");

        }


        document.getElementById("nama").value="";
        document.getElementById("kelas").value="";
        document.getElementById("wali").value="";
        document.getElementById("idSantri").value="";


        document.querySelector("button").textContent="Tambah Santri";


        tampilkan();


    } catch(error){

        console.error(error);

        alert("Gagal menyimpan data.");

    }

};

async function tampilkan() {

    daftarSantri.innerHTML = "";

    try {

        const snapshot = await getDocs(collection(db, "santri"));

        if (snapshot.empty) {

            daftarSantri.innerHTML =
                "<li class='list-group-item'>Belum ada data santri.</li>";

            return;
        }

        snapshot.forEach((item) => {

            const s = item.data();

            daftarSantri.innerHTML += `

            <li class="list-group-item d-flex justify-content-between align-items-center">

                <div>

                    <strong>${s.nama}</strong><br>

                    ${s.kelas}<br>

                    ${s.wali || "-"}

                </div>

                <div class="d-flex gap-1">


                <div class="d-flex gap-1">

                    <button
                    class="btn btn-warning btn-sm"
                    onclick="editSantri('${item.id}','${s.nama}','${s.kelas}','${s.wali || ""}')">
                    Edit
                    </button>

                    <button
                    class="btn btn-danger btn-sm"
                    onclick="hapusSantri('${item.id}')">
                    Hapus
                    </button>

                </div>

            </li>
            
            `;
            
     });

    } catch (error) {

        console.error(error);

        daftarSantri.innerHTML =
            "<li class='list-group-item text-danger'>Gagal memuat data.</li>";

    }

}


window.hapusSantri = async function(id){

    if(!confirm("Yakin ingin menghapus santri ini?")) return;

    try {

        await deleteDoc(doc(db, "santri", id));

        tampilkan();

    } catch (error) {

        console.error(error);

        alert("Gagal menghapus data.");

    }

}

window.editSantri = function(id, nama, kelas, wali){

    document.getElementById("idSantri").value = id;

    document.getElementById("nama").value = nama;
    document.getElementById("kelas").value = kelas;
    document.getElementById("wali").value = wali;


    const tombol = document.querySelector(".card button");

    if(tombol){
        tombol.textContent = "Update Santri";
    }


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

};
