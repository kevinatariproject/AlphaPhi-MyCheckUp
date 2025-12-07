//need to add this script to each dashboard
import { db, auth } from "./firebase_config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

export function authenticateLogin(userType, userName) {
  const usernameField = document.getElementById(userName);
  onAuthStateChanged(auth, async (user) => {
        if (user) {
          const uid = user.uid;
          const userRef = doc(db, userType, uid);
          try {
            const snap = await getDoc(userRef);
            if (snap.exists()) {
              // if admin, set username to admin
              if (userType === "admins") usernameField.textContent = "Admin";
              else { // otherwise get first name
                const userData = snap.data();
                usernameField.textContent = userData.firstName;
              }
            } else { // throw error if not retrieved
              throw new Error("Incorrect user type");
            }
          } catch (error) {
            try { // in the case of guardians
              const snap = await getDoc(doc(db, "guardians", uid));
              if (snap.exists()) {
                const userData = snap.data();
                usernameField.textContent = userData.firstName;
              } else {
                throw new Error("Incorrect user type");
              }
            } catch (error) {
              console.log(error);
            }
          }
        } else {
        }
  });
}