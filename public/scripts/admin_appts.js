// Renders appointment information for the admin dashboard

import { getUser, getUserAppts, get24hrAppts } from "./admin_appts_fetch.js";
import { departmentMap } from "./department_loader.js";
import { cancelAppointment } from "./appt_scheduling.js";

// ===== Helpers =====
const $ = (s, ctx = document) => ctx.querySelector(s);
const $$ = (s, ctx = document) => Array.from(ctx.querySelectorAll(s));

// Scoped DOM elements
const section = $("#appointments");
const toggleButtons = $$(".toggle-row .toggle-btn", section);
const searchFilter = $("#va-search-filter", section);
const searchBtn = $("#va-search-btn", section);
const statusFilter = $("#va-status-filter", section);
const refreshBtn = $("#va-refresh-btn", section);
const viewLabel = $("#va-view-label", section);
const lastUpdated = $("#va-last-updated", section);
const tableTitle = $("#va-table-title", section);
const headEl = $("#va-appointments-head", section);
const bodyEl = $("#va-appointments-body", section);

// globals
let appointments = [];
let currentView = "create";

const visitCodes = {
    "new_patient": "New Patient Visit",
    "consultation": "Consultation",
    "routine_exam": "Routine/Annual Exam",
    "follow_up": "Follow-Up Visit",
    "non_urgent": "Non-Urgent Concern",
    "ongoing_care": "Ongoing Care Management",
    "other": "Other"
};

//  SECTION 1: Real-Time Appointments (View_appointments logic)

// ===== Small modal helper =====
const smallModal = $("#smallModal");
if (smallModal) {
    // back button close modal
    $("#backSmall").addEventListener("click", () =>
        smallModal.classList.add("hidden")
    );
}

function openSmall(title, body, apptId) {
    if (!smallModal) return;
    $("#smallTitle").textContent = title;
    $("#smallBody").textContent = body;

    // confirm appointment cancellation
    $("#confirmSmall").addEventListener("click", async () => {
        await cancelAppointment(apptId);
        smallModal.classList.add("hidden");
        alert("Appointment successfully canceled");
        refreshData();
    }, { once: true }); // remove listener right after firing

    smallModal.classList.remove("hidden");
}

// helper function to format timestamps
function formatTimestamp(timestamp) {
    const date = timestamp.toDate();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');

    return `${year}-${month}-${day} ${hour}:${minute}`;
}

// view appointment details
async function viewDetails(index, element) {
    // get appt from array
    const appt = appointments[index];
    // console.log(appt);

    // get row element of appointment
    const apptTr = $(`#a${appt.id}`, section);
    if (apptTr) { // toggle hidden if it already exists
        if (apptTr.classList.contains("hidden"))
            apptTr.classList.remove("hidden");
        else
            apptTr.classList.add("hidden");
    } else { // otherwise build the row
        // get data from firestore of doctor, patient, and guardian if applicable
        const doctorData = await getUser(appt.doctorId, "doctors");
        const patientData = await getUser(appt.patientId, "patients");
        let guardianData;
        if (patientData.guardianId)
            guardianData = await getUser(patientData.guardianId, "guardians");

        // construct names
        const doctorName = `${doctorData.firstName} ${doctorData.lastName}`;
        const patientName = `${patientData.firstName} ${patientData.lastName}`;
        let guardianName;
        if (guardianData)
            guardianName = `${guardianData.firstName} ${guardianData.lastName}`;

        // make table row for appointment details
        const tr = document.createElement("tr");
        // set id to appointment id (add a in front to avoid starting with number)
        tr.id = `a${appt.id}`;

        // add cell to hold appointment details
        const td = document.createElement("td");
        td.colSpan = 6;
        td.classList.add("appt-info");

        // appointment details header
        const titleDiv = document.createElement("div");
        titleDiv.classList.add("appt-info-row");
        titleDiv.innerHTML = `<p><b>Appointment Details</b></p>`;
        td.appendChild(titleDiv);
        
        // 1st row of info
        const div1 = document.createElement("div");
        div1.classList.add("appt-info-row");
        let row1info = `<p><b>Doctor:</b> ${doctorName}</p><p><b>Patient:</b> ${patientName}</p>`;
        if (guardianData) row1info += `<p><b>Guardian:</b> ${guardianName}</p>`;
        div1.innerHTML = row1info;
        td.appendChild(div1);

        // 2nd row of info
        const div2 = document.createElement("div");
        div2.classList.add("appt-info-row");
        div2.innerHTML = `
        <p><b>Department:</b> ${departmentMap[doctorData.departmentId].name}</p>
        <p><b>Location:</b> ${departmentMap[doctorData.departmentId].location}</p>
        <p><b>Visit Type:</b> ${visitCodes[appt.visitType]}</p>
        `;
        td.appendChild(div2);

        if (appt.status != "cancelled") { // if appointment not cancelled
            // row to hold cancel button
            const div3 = document.createElement("div");
            div3.classList.add("cancel-btn-row");
            const cancelBtn = document.createElement("button");
            cancelBtn.classList.add("action-btn");
            cancelBtn.textContent = "Cancel this appointment";
            // add listener to trigger confirmation popup
            cancelBtn.addEventListener("click", () => {
                openSmall("Cancel Appointment", "Confirm cancellation of this appointment?", appt.id);
            });
            div3.appendChild(cancelBtn);
            td.appendChild(div3);
        }

        tr.appendChild(td);

        element.after(tr);
    }
}

// Table header
function renderHeader() {
    headEl.innerHTML = "";
    const tr = document.createElement("tr");

    if (currentView === "create")
        tr.innerHTML = `
            <th>Last Updated</th>
            <th class="va-active">Created</th>
            <th>Scheduled for</th>
            <th>Doctor ID</th>
            <th>Patient ID</th>
            <th>Status</th>
        `;
    else if (currentView === "update")
        tr.innerHTML = `
            <th class="va-active">Last Updated</th>
            <th>Created</th>
            <th>Scheduled for</th>
            <th>Doctor ID</th>
            <th>Patient ID</th>
            <th>Status</th>
        `;
    else
        tr.innerHTML = `
            <th>Last Updated</th>
            <th>Created</th>
            <th>Scheduled for</th>
            <th>Doctor ID</th>
            <th>Patient ID</th>
            <th>Status</th>
        `;
    
    headEl.appendChild(tr);
}

// Status -> CSS class
function getStatusClass(status) {
    switch (status) {
    case "scheduled":
        return "status-scheduled";
    case "rescheduled":
        return "status-rescheduled";
    case "no-show":
        return "status-no-show";
    case "completed":
        return "status-completed";
    case "cancelled":
        return "status-canceled";
    default:
        return "";
    }
}

// Table body
async function renderBody() {
    bodyEl.innerHTML = "";

    const search = searchFilter.value.trim();
    // if something in search field, do ID lookup
    if (search) appointments = await getUserAppts(currentView, search);
    // otherwise get appts for past 24 hours
    else appointments = await get24hrAppts(currentView);

    const sFilter = statusFilter.value;
    // filter by appt statsu
    const filtered = appointments.filter((a) => {
        if (sFilter && a.status !== sFilter) return false;
        return true;
    });

    // no results
    if (filtered.length === 0) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 6;
        td.textContent = "No appointments found for the selected filters.";
        tr.appendChild(td);
        bodyEl.appendChild(tr);
        return;
    }

    // create table row for each appt
    filtered.forEach((a, i) => {
        const tr = document.createElement("tr");
        const statusClass = getStatusClass(a.status);
        
        // capitalize 1st letter of status
        const createTime = formatTimestamp(a.createdAt);
        const scheduledTime = formatTimestamp(a.startTime);
        const status = a.status.charAt(0).toUpperCase() + a.status.slice(1);

        let updateTime;
        // if no lastUpdatedAt, make it same as createdAt
        if (a.lastUpdatedAt)
            updateTime = formatTimestamp(a.lastUpdatedAt);
        else
            updateTime = createTime;

        tr.innerHTML = `
        <td>${updateTime}</td>
        <td>${createTime}</td>
        <td>${scheduledTime}</td>
        <td>${a.doctorId}</td>
        <td>${a.patientId}</td>
        <td><span class="status-pill ${statusClass}">${status}</span></td>
        `;

        tr.classList.add("appt-list");
        // click on row to view details
        tr.addEventListener("click", async (e) => { viewDetails(i, e.target.closest("tr")); });

        bodyEl.appendChild(tr);
    });
}

// Meta text
function updateMeta() {
    viewLabel.textContent =
    currentView === "create"
        ? "Current view: New Appointments"
        : "Current view: Updated Appointments";

    const search = searchFilter.value.trim();
    if (search) tableTitle.textContent = `Appointments for User ID: ${search}`;
    else
    tableTitle.textContent =
    currentView === "create"
        ? "Appointments Created in Last 24 Hours"
        : "Appointments Updated in Last 24 Hours";

    const now = new Date();
    lastUpdated.textContent =
    "Last updated: " +
    now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Refresh handler
export async function refreshData() {
    if (!section) return;
    renderHeader();
    await renderBody();
    updateMeta();
}

// Toggle view buttons
toggleButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
        const view = btn.dataset.view;
        if (!view || view === currentView) return;

        currentView = view;
        toggleButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        refreshData();
    });
});

// Filter listeners
statusFilter.addEventListener("input", () => {
    refreshData();
});

searchBtn.addEventListener("click", () => {
    refreshData();
});

// Manual refresh
refreshBtn.addEventListener("click", () => {
    refreshData();
});

// Optional: auto refresh every 30s
// setInterval(refreshData, 30000);
