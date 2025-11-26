// imports
import { db } from "./firebase_config.js";
import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const departmentMap = {};

// Dynamically load all departments into select field
document.addEventListener('DOMContentLoaded', async () => {
    const departmentElement = document.getElementById("department");

    try {
        // Fetch departments
        const querySnapshot = await getDocs(collection(db, "departments"));
        
        querySnapshot.forEach((doc) => {
            const deptName = doc.data().name;

            // populate map
            departmentMap[doc.id] = deptName;

            // create element for each department
            const option = document.createElement("option");
            option.value = doc.id;
            option.textContent = deptName;
            departmentElement.appendChild(option);
        });
        
    } catch (error) {
        console.error("Error loading departments:", error);
    }
});

export { departmentMap };