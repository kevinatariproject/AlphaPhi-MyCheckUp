const modalOverlay = document.getElementById("modalOverlay");

function openModal(modal) {
    modal.classList.remove("hidden");
    modal.classList.add("open");
    modalOverlay.classList.remove("hidden");
    modalOverlay.classList.add("open");
}

function closeModal(modal) {
    modal.classList.remove("open");
    modal.classList.add("hidden");
    const anyOpen = document.querySelector(".modal.open");
    if (!anyOpen) {
        modalOverlay.classList.remove("open");
        modalOverlay.classList.add("hidden");
    }
}

document.addEventListener("click", (e) => {
    if (e.target.matches("[data-close-modal]")) {
        const m = e.target.closest(".modal");
        if (m) closeModal(m);
    }
});

modalOverlay.addEventListener("click", () => {
    document.querySelectorAll(".modal.open").forEach((m) => closeModal(m));
});

window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        document.querySelectorAll(".modal.open").forEach((m) => closeModal(m));
    }
});

export { openModal, closeModal };