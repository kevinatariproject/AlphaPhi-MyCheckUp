import { auth } from "./firebase_config.js";
import { onAuthStateChanged, deleteUser } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

let currentUser = null;

// Wait for auth to load current user
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        console.log("User signed in:", user.uid);
    } else {
        console.log("No user signed in");
    }
});

document.querySelectorAll(".delete-account").forEach(btn => {
    const overlay = document.getElementById("delete-overlay");
    const confirmBtn = document.getElementById("delete-confirm");
    const cancelBtn = document.getElementById("delete-cancel");
    const popupWin = document.getElementById("delete-popup")

    btn.addEventListener("click", (e) => {
        e.preventDefault();
        overlay.style.display = "flex";
        popupWin.style.display = "grid";
        
        confirmBtn.addEventListener("click", () => {
            deleteUser(currentUser).then(() => {
                window.location.href = "account_deletion_page.html"
            })
        })
        cancelBtn.addEventListener("click", () => {
            overlay.style.display = "none";
            popupWin.style.display = "none";
        })

    });
});

