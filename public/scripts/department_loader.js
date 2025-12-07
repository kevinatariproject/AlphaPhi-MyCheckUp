// imports
import { db } from "./firebase_config.js";
import {
    collection,
    getDocs,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const departmentMap = {};

// Dynamically load all departments into select field
document.addEventListener('DOMContentLoaded', async () => {
    const departmentElement = document.getElementById("department");

    try {
        // order query by name
        const q = query(
            collection(db, "departments"),
            orderBy("name")
        );
        // Fetch departments
        const querySnapshot = await getDocs(q);
        
        querySnapshot.forEach((doc) => {
            const deptName = doc.data().name;
            const deptFloor = doc.data().floor;
            const deptLocation = doc.data().location;

            // populate map
            departmentMap[doc.id] = {
                name: deptName,
                location: `Floor ${deptFloor}, ${deptLocation}`
            };

            // create element for each department
            if (departmentElement) {
                const option = document.createElement("option");
                option.value = doc.id;
                option.textContent = deptName;
                departmentElement.appendChild(option);
            }
        });
        
    } catch (error) {
        console.error("Error loading departments:", error);
    }
});

export { departmentMap };