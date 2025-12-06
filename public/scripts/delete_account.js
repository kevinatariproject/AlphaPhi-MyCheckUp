console.log("test");

import { auth } from "./firebase_config.js";
import { deleteUser } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

// user = auth.currentUser;

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
            window.location.href = "account_deletion_page.html"

            // deleteUser(user).then(() => {
            //     window.location.href = "account_deletion_page.html"
            //     setTimeout(() => {
            //         window.location.href = "landing_page.html";
            //     }, 2000);
            // })
        })
        cancelBtn.addEventListener("click", () => {
            overlay.style.display = "none";
            popupWin.style.display = "none";
        })

    });
});

