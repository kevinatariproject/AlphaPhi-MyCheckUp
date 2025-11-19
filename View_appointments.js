// Simple demo data for appointments
const appointments = [
  {
    id: 1,
    time: "09:00 AM",
    date: "2025-11-18",
    patient: "John Doe",
    doctor: "Dr. Emily Carter",
    type: "Consultation",
    location: "Clinic A - Room 101",
    status: "Scheduled"
  },
  {
    id: 2,
    time: "09:30 AM",
    date: "2025-11-18",
    patient: "Jane Smith",
    doctor: "Dr. Emily Carter",
    type: "Follow-up",
    location: "Clinic A - Room 102",
    status: "In Progress"
  },
  {
    id: 3,
    time: "10:00 AM",
    date: "2025-11-18",
    patient: "Michael Brown",
    doctor: "Dr. Rahul Patel",
    type: "Lab Review",
    location: "Clinic B - Room 203",
    status: "Completed"
  },
  {
    id: 4,
    time: "10:30 AM",
    date: "2025-11-18",
    patient: "John Doe",
    doctor: "Dr. Rahul Patel",
    type: "EKG",
    location: "Clinic B - Room 205",
    status: "Scheduled"
  },
  {
    id: 5,
    time: "11:00 AM",
    date: "2025-11-18",
    patient: "Sara Lee",
    doctor: "Dr. Emily Carter",
    type: "Check-up",
    location: "Clinic A - Room 101",
    status: "Canceled"
  }
];

let currentView = "patient"; // 'patient' or 'doctor'

// DOM elements
const toggleButtons = document.querySelectorAll(".toggle-btn");
const patientFilter = document.getElementById("patient-filter");
const doctorFilter = document.getElementById("doctor-filter");
const statusFilter = document.getElementById("status-filter");
const searchFilter = document.getElementById("search-filter");
const refreshBtn = document.getElementById("refresh-btn");
const viewLabel = document.getElementById("view-label");
const lastUpdated = document.getElementById("last-updated");
const tableTitle = document.getElementById("table-title");
const headEl = document.getElementById("appointments-head");
const bodyEl = document.getElementById("appointments-body");

// Initialize filters with unique names
function initFilters() {
  const patients = Array.from(new Set(appointments.map(a => a.patient))).sort();
  const doctors = Array.from(new Set(appointments.map(a => a.doctor))).sort();

  patients.forEach(name => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    patientFilter.appendChild(opt);
  });

  doctors.forEach(name => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    doctorFilter.appendChild(opt);
  });
}

// Build table header based on current view
function renderHeader() {
  headEl.innerHTML = "";

  const tr = document.createElement("tr");
  if (currentView === "patient") {
    tr.innerHTML = `
      <th>Time</th>
      <th>Patient</th>
      <th>Doctor</th>
      <th>Type</th>
      <th>Location</th>
      <th>Status</th>
    `;
  } else {
    tr.innerHTML = `
      <th>Time</th>
      <th>Doctor</th>
      <th>Patient</th>
      <th>Type</th>
      <th>Location</th>
      <th>Status</th>
    `;
  }
  headEl.appendChild(tr);
}

// Build table rows
function renderBody() {
  bodyEl.innerHTML = "";

  const pFilter = patientFilter.value;
  const dFilter = doctorFilter.value;
  const sFilter = statusFilter.value;
  const search = searchFilter.value.trim().toLowerCase();

  const filtered = appointments.filter(a => {
    if (pFilter && a.patient !== pFilter) return false;
    if (dFilter && a.doctor !== dFilter) return false;
    if (sFilter && a.status !== sFilter) return false;

    if (search) {
      const text = (
        a.patient +
        " " +
        a.doctor +
        " " +
        a.type +
        " " +
        a.location
      ).toLowerCase();
      if (!text.includes(search)) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 6;
    td.textContent = "No appointments found for the selected filters.";
    tr.appendChild(td);
    bodyEl.appendChild(tr);
    return;
  }

  filtered.forEach(a => {
    const tr = document.createElement("tr");
    const statusClass = getStatusClass(a.status);

    if (currentView === "patient") {
      tr.innerHTML = `
        <td>${a.date} ${a.time}</td>
        <td>${a.patient}</td>
        <td>${a.doctor}</td>
        <td>${a.type}</td>
        <td>${a.location}</td>
        <td><span class="status-pill ${statusClass}">${a.status}</span></td>
      `;
    } else {
      tr.innerHTML = `
        <td>${a.date} ${a.time}</td>
        <td>${a.doctor}</td>
        <td>${a.patient}</td>
        <td>${a.type}</td>
        <td>${a.location}</td>
        <td><span class="status-pill ${statusClass}">${a.status}</span></td>
      `;
    }

    bodyEl.appendChild(tr);
  });
}

// Map status to class
function getStatusClass(status) {
  switch (status) {
    case "Scheduled":
      return "status-scheduled";
    case "In Progress":
      return "status-in-progress";
    case "Completed":
      return "status-completed";
    case "Canceled":
      return "status-canceled";
    default:
      return "";
  }
}

// Update meta text
function updateMeta() {
  viewLabel.textContent =
    currentView === "patient"
      ? "Current view: By Patient"
      : "Current view: By Doctor";

  tableTitle.textContent =
    currentView === "patient"
      ? "Appointments by Patient"
      : "Appointments by Doctor";

  const now = new Date();
  lastUpdated.textContent =
    "Last updated: " + now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Refresh handler (for real-time feel you can call backend here later)
function refreshData() {
  // In a real app, call API here. Right now we just re-render.
  renderHeader();
  renderBody();
  updateMeta();
}

// Toggle view
toggleButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const view = btn.dataset.view;
    if (view === currentView) return;

    currentView = view;

    toggleButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    refreshData();
  });
});

// Filter listeners
[patientFilter, doctorFilter, statusFilter, searchFilter].forEach(el => {
  el.addEventListener("input", () => {
    renderBody();
  });
});

refreshBtn.addEventListener("click", () => {
  refreshData();
});

// Optional: auto refresh every 30 seconds for a "real-time" feel
setInterval(refreshData, 30000);

// Init
initFilters();
renderHeader();
renderBody();
updateMeta();
