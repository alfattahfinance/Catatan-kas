// ======================================
// SYAHRIYYAH APP
// THEME MANAGER
// ======================================

function ambilTema() {

    const data =
        JSON.parse(
            localStorage.getItem("pengaturanAplikasi")
        ) || {};

    const tema =
        data.tema || "light";

    if (tema === "dark") {
        return true;
    }

    if (tema === "system") {

        return window.matchMedia(
            "(prefers-color-scheme: dark)"
        ).matches;

    }

    return false;
}


// ======================================
// TERAPKAN TEMA
// ======================================

function terapkanTemaGlobal() {

    const gunakanGelap =
        ambilTema();

    document.documentElement.classList.toggle(
        "dark-mode",
        gunakanGelap
    );

    if (document.body) {

        document.body.classList.toggle(
            "dark-mode",
            gunakanGelap
        );

    }

}


// ======================================
// TERAPKAN SECEPAT MUNGKIN
// ======================================

terapkanTemaGlobal();


// ======================================
// JIKA TEMA SYSTEM BERUBAH
// ======================================

const mediaQuery =
    window.matchMedia(
        "(prefers-color-scheme: dark)"
    );

mediaQuery.addEventListener(
    "change",
    () => {

        const data =
            JSON.parse(
                localStorage.getItem(
                    "pengaturanAplikasi"
                )
            ) || {};

        if (data.tema === "system") {

            terapkanTemaGlobal();

        }

    }
);
