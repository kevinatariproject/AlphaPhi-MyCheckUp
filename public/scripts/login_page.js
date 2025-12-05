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
    const userType = document.getElementById("user-type").value;

    try { //Success
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;
        
        try {
            const collections = {
                "patients": "user_dashboard.html",
                "doctors": "doctor_dashboard.html",
                "admins": "Admin_dashboard.html"
            };
            
            // see if user exists in specified collection
            const snap = await getDoc(doc(db, userType, uid));
            if (snap.exists()) { // redirect on success
                window.location.href = collections[userType];
            } else {
                throw new Error("WrongLoginPage");
            }
        } catch (error) {
            // if logging in from patient page, try guardian next
            if (userType == "patients") {
                try {
                    const snap = await getDoc(doc(db, "guardians", uid));
                    if (snap.exists()) {
                        window.location.href = "user_dashboard.html";
                    } else { // if guardian also failure, means wrong login page
                        throw new Error("WrongLoginPage");
                    }
                } catch (error) {
                    throw error;
                }
            } else if (userType == "admins") {
                // throw accurate error for wrong login from admin page
                throw new Error("WrongLoginPage");
            } else { // throw same error from try block
                throw error;
            }
        }
    } catch (error) { //Login Failure
        console.log(error);
        loginHolder.style.marginTop = "15px";
        loginErrorMsgHolder.style.display = "grid";
        loginErrorMsg.style.opacity = "100";
        loginForm.reset();
    }
});


