import { db, auth } from "./firebase_config.js";
import { onAuthStateChanged, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const loginErrorMsg = document.getElementById("login-error-msg");
const loginHolder = document.getElementById("login-holder");
const loginErrorMsgHolder = document.getElementById("login-error-msg-holder");
const loginForm = document.getElementById("login-form");

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email-field").value;
    const password = document.getElementById("password-field").value;
    
    try { //Success
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;
        const collections = ["patients", "doctors", "admins"];

        for (const col of collections) {
            alert("logged in via firestore")
            const userRef = doc(db, col, uid);
            const snap = await getDoc(userRef);
            if (snap.exists()) {       
                if (col == "patients") {
                    window.location.href = "user_dashboard.html";
                } else if (col == "doctors") {
                    window.location.href = "doctor_dashboard.html";
                } else{
                    window.location.href = "Admin_dashboard.html";
                }
                break;
            }
        }
    } catch (error) { //Login Failure
        loginHolder.style.marginTop = "15px";
        loginErrorMsgHolder.style.display = "grid";
        loginErrorMsg.style.opacity = "100";
        loginForm.reset();
    }
});


