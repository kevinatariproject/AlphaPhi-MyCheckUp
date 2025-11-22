console.log("test");

import { auth } from "./firebase_config.js";
import { signOut } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

document.querySelectorAll(".logout").forEach(btn => {
    
    const overlay = document.getElementById("overlay");
    const confirmBtn = document.getElementById("confirm");
    const cancelBtn = document.getElementById("cancel");
    const popupWin = document.getElementById("logout-popup")

    btn.addEventListener("click", (e) => {
        e.preventDefault();
        overlay.style.display = "flex";
        popupWin.style.display = "grid";

        confirmBtn.addEventListener("click", () => {
            e.preventDefault();
            signOut(auth).then(() => {
                confirmBtn.style.display = "none";
                cancelBtn.style.display = "none";
                popupWin.querySelector("h3").textContent = "You have been successfully logged out.";
                setTimeout(() => {
                    window.location.href = "landing_page.html";
                }, 1500);
            }) .catch((error) => {
                alert("Signout failed");
            })
        })
        cancelBtn.addEventListener("click", () => {
            overlay.style.display = "none";
            popupWin.style.display = "none";
        })
        //const confirmed = confirm("Are you sure you want to logout?")

    });
});

