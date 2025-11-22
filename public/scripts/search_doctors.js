// Functions to handle searching doctors by name and department for user dash
// might need to be refactored for use elsewhere

// imports
import { db } from "./firebase_config.js";
import { departmentMap } from "./department_loader.js";
import {
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const practitionerSearch = document.getElementById("practitionerSearch");
const department = document.getElementById("department");
const doctorList = document.getElementById("doctorList");
const visitDoctor = document.getElementById("visitDoctor");
const doctorDropdown = document.getElementById("doctorDropdown");
const selectedDoctorId = document.getElementById("selectedDoctorId");

let doctorMap = {};

// queries database for doctors matching search input
async function searchDoctors(searchText, departmentId = null) {
    const normalized = searchText.toLowerCase().trimStart();

    // if both fields empty, return "noquery"
    if (!normalized && !departmentId) return "noquery";

    // build query depending on if department selected
    let q;
    if (departmentId) {
        q = query(
            collection(db, "doctors"),
            where("status", "==", "active"),
            where("departmentId", "==", departmentId)
        );
    } else {
        q = query(
            collection(db, "doctors"),
            where("status", "==", "active")
        );
    }

    try {
        // get snapshot of query
        const snap = await getDocs(q);
        // convert to map
        doctorMap = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
        console.error("Error retrieving doctors:", error);
        return;
    }
    
    // if no search text, return all drs in department
    if (!normalized) return doctorMap;

    // filters doctors by matching start of each name or name combo
    return doctorMap.filter(doc => {
        // normalize each name
        const first = (doc.firstName || "").toLowerCase();
        const preferred = (doc.preferredName || "").toLowerCase();
        const last = (doc.lastName || "").toLowerCase();

        // create name combos
        const firstAndLast = `${first} ${last}`;
        const preferredAndLast = `${preferred} ${last}`;

        // match with OR
        return (
            first.startsWith(normalized) ||
            preferred.startsWith(normalized) ||
            last.startsWith(normalized) ||
            firstAndLast.startsWith(normalized) ||
            preferredAndLast.startsWith(normalized)
        );
    });
}

// displays visit search results to UI
function renderVisitSearch(doctorResults) {
    // clear list
    doctorDropdown.innerHTML = "";

    // if both fields empty, hide dropdown
    if (doctorResults == "noquery") {
        doctorDropdown.classList.add("hidden");
        return;
    }

    // if no results, display message
    if (doctorResults.length === 0) {
        doctorDropdown.innerHTML = `<div>No matches</div>`;
        // show list
        doctorDropdown.classList.remove("hidden");
        return;
    }

    // create list of results for dropdown
    let divList = "";
    doctorResults.forEach(doc => {
        let nameText;
        if (doc.preferredName == "")
            nameText = `${doc.firstName} ${doc.lastName}, ${doc.credentials}`;
        else
            nameText = `${doc.firstName} "${doc.preferredName}" ${doc.lastName}, ${doc.credentials}`;

        divList += `<div class="dropdown-item" data-id="${doc.id}">${nameText}</div>`;
    });

    // add list to html
    doctorDropdown.innerHTML = divList;
    // show list
    doctorDropdown.classList.remove("hidden");
}

// displays search page results to UI
function renderSearchPage(doctorResults) {
    // clear list
    doctorList.innerHTML = "";

    // if both fields empty, do nothing
    if (doctorResults == "noquery") return;

    // if no results, display message
    if (doctorResults.length === 0) {
        doctorList.innerHTML = `<p>There are no doctors that match your search</p>`;
        return;
    }

    // create card for each doctor in results
    doctorResults.forEach(doc => {
        let nameText;
        if (doc.preferredName == "")
            nameText = `${doc.firstName} ${doc.lastName}, ${doc.credentials}`;
        else
            nameText = `${doc.firstName} "${doc.preferredName}" ${doc.lastName}, ${doc.credentials}`;

        const card = document.createElement("article");
        card.classList.add("card");

        card.innerHTML = `
        <div class="meta">
          <div class="title">${nameText}</div>
          <div class="sub">${departmentMap[doc.departmentId]}</div>
        </div>
        <div class="right">
          <div class="bioText">${doc.bio}</div>
        </div>
        `;

        doctorList.appendChild(card);
    });
}

// controls which search is activated
async function updateSearch(target) {
    let text, dept, results;
    
    // determine if from visit search or search page
    if (target == visitDoctor) {
        // clear value from hidden field
        selectedDoctorId.value = "";

        text = visitDoctor.value;
        results = await searchDoctors(text);
        renderVisitSearch(results);
    } else {
        text = practitionerSearch.value;
        dept = department.value || null;
        results = await searchDoctors(text, dept);
        renderSearchPage(results);
    }
}

// update search results whenever user types or selects department
practitionerSearch.addEventListener("input", (e) => updateSearch(e.target));
department.addEventListener("change", (e) => updateSearch(e.target));
visitDoctor.addEventListener("input", (e) => updateSearch(e.target));

// clear and hide visit search dropdown when clicking elsewhere
document.addEventListener("click", (e) => {
    if (!doctorDropdown.contains(e.target) && e.target !== visitDoctor) {
        doctorDropdown.innerHTML = "";
        doctorDropdown.classList.add("hidden");
    }
});

// when doctor selected from visit search, set hidden field and fill search field
doctorDropdown.addEventListener("click", (e) => {
    const item = e.target.closest(".dropdown-item");
    
    if (!item) return;

    const doctorId = item.dataset.id;
    const doctorName = item.textContent;

    // set hidden field value to doctor's firestore id
    selectedDoctorId.value = doctorId;
    // fill search field with doctor's name
    visitDoctor.value = doctorName;

    // clear and hide dropdown
    doctorDropdown.innerHTML = "";
    doctorDropdown.classList.add("hidden");
});