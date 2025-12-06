import { db } from './firebase_config.js';
import { getDoc, doc, getDocs, collection } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

async function fetchPatientDetails(userID) {
  try {
      const patientRef = doc(db, "patients", userID);
      const patientSnapshot = await getDoc(patientRef);
      if (patientSnapshot.exists()) {
          console.log("Patient data:", patientSnapshot.data());
          return patientSnapshot.data();
      } else {
          console.error("No such patient information found");
          return null;
      }
  } catch (error) {
      console.error("Error fetching patient details: ", error);
      return null;
  }
}

async function getGuardianIdsFromPatientId(patientID) {
  try {
      const patientRef = doc(db, "patients", patientID);
      const patientSnapshot = await getDoc(patientRef);
      if (patientSnapshot.exists()) {
        const guardianRef = collection(db, "patients", patientID, "guardians");
        const guardianSnapshot = await getDocs(guardianRef);
        if (!guardianSnapshot.empty) {
          // Return a list of guardian IDs and their relationship to the patient
          const patientGuardians = [];
          guardianSnapshot.forEach((doc) => {
            patientGuardians.push({
              guardianId: doc.id,
              relationship: doc.data().relationship
            });
          });
          console.log("Guardian IDs linked to patient:", patientGuardians);
          return patientGuardians;
        } else {
          console.error("No guardian linked to this patient");
          return null;
        }
      } else {
          console.error("No such patient found");
          return null;
      }
  } catch (error) {
      console.error("Error fetching guardian ID: ", error);
      return null;
  }
}

async function fetchGuardianDetails(userID) {
  try {
      const guardianRef = doc(db, "guardians", userID);
      const guardianSnapshot = await getDoc(guardianRef);
      if (guardianSnapshot.exists()) {
          const guardianData = guardianSnapshot.data();
          console.log("Guardian data:", guardianData);
          return guardianData;
      } else {
          console.error("No such guardian information found");
          return null;
      }
  } catch (error) {
      console.error("Error fetching guardian details: ", error);
      return null;
  }
}

// Small enhancement: allow toggling the active item (purely visual in this static mock)
document.querySelectorAll(".sidenav .nav").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".sidenav .nav")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

export { fetchPatientDetails, fetchGuardianDetails, getGuardianIdsFromPatientId};
