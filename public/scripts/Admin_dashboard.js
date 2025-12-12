import { refreshData as initAppointmentsSection } from "./admin_appts.js";
import { 
  getAllAppointments, 
  modifyAppointmentData, 
  initFilters, 
  getFilteredRows, 
  renderSummary, 
  renderTable, 
  updateMeta, 
  generateAndDownloadCsv 
} from "./admin_report_generator.js";
import { db, functions } from "./firebase_config.js";
import { doc, getDoc, getDocs, collection } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-functions.js";
import { getAuth, onAuthStateChanged  } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

const auth = getAuth(); // initialize auth instance
let UID = null;

// ===== Helpers =====
const $ = (s, ctx = document) => ctx.querySelector(s);
const $$ = (s, ctx = document) => Array.from(ctx.querySelectorAll(s));

const email = document.getElementById("email");
const name = document.getElementById("name");
const lastLogin = document.getElementById("last-login");

// ===== Nav: switch main views =====
$$(".nav-item").forEach((btn) => {
  btn.addEventListener("click", () => {
    $$(".nav-item").forEach((b) => b.classList.toggle("active", b === btn));
    const target = btn.dataset.target;
    $$(".view").forEach((v) => v.classList.toggle("show", v.id === target));
  });
});

// ===== Mobile sidebar toggle =====
const menuToggle = $("#menuToggle");
const sidebar = $("#sidebar");

if (menuToggle && sidebar) {
  menuToggle.addEventListener("click", () => {
    const open = sidebar.classList.toggle("open");
    document.body.classList.toggle("menu-open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
  });

  $$(".nav-item").forEach((btn) =>
    btn.addEventListener("click", () => {
      if (window.matchMedia("(max-width: 980px)").matches) {
        sidebar.classList.remove("open");
        document.body.classList.remove("menu-open");
        menuToggle.setAttribute("aria-expanded", "false");
      }
    })
  );
}

window.addEventListener("DOMContentLoaded", () => {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      console.log("No user logged in");
      return;
    }
    console.log("user Signed In");
    UID = user.uid;

    try {
      const adminData = await getDoc(doc(db, "admins", UID));
      const adminInfo = adminData.data();
      
      email.textContent = adminInfo?.email || "No Email Provided";
      lastLogin.textContent = user?.metadata?.lastSignInTime || "Last Login Unknown";
      name.textContent = adminInfo?.firstName + ' ' + adminInfo?.lastName;
    }catch (error) {
      console.log(error);
    }
  });
});

initAppointmentsSection();

//  SECTION 2: Account Management (Account_management logic)

(function initAccountManagementSection() {
  const section = $("#manage");
  if (!section) return;

  const deleteUserFunc = httpsCallable(functions, "deleteUser");
  const checkUserLoginFunc = httpsCallable(functions, "checkUserLogin");

  // In-memory storage for demo
  const dataStore = {
    patient: [],
    guardian: [],
    doctor: [],
  };

  let currentUser = null;

  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    console.log("Current user:", currentUser?.uid); //logging for current user
  });

  let currentType = "patient"; // "patient" or "doctor"

  // DOM elements (scoped)
  const typeButtons = [
    $("#am-toggle-patient", section),
    $("#am-toggle-guardian", section),
    $("#am-toggle-doctor", section),
  ];
  const userTypeInput = $("#am-user-type", section);
  const formTitle = $("#am-form-title", section);
  const tableTitle = $("#am-table-title", section);
  const extraLabel = $("#am-extra-label", section);
  const extraHeader = $("#am-extra-header", section);
  const extraFieldRow = $("#am-extra-field-row", section);

  const form = $("#am-account-form", section);
  const fullNameInput = $("#am-full-name", section);
  const emailInput = $("#am-email", section);
  const phoneInput = $("#am-phone", section);
  const extraFieldInput = $("#am-extra-field", section);
  const statusSelect = $("#am-status", section);
  const searchInput = $("#am-search-input", section);
  const tableBody = $("#am-accounts-body", section);

  //checks if the current user signed in is an admin or not
  async function isCurrentUserAdmin() {
  if (!currentUser) return false; // user not signed in

  try {
    const adminDoc = await getDoc(doc(db, "admins", currentUser.uid));
    return adminDoc.exists();
  } catch (err) {
    console.error("Error checking admin status:", err);
    return false;
  }
}
  // Toggle Patients / Doctors
  typeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const type = btn.dataset.type;
      if (!type || type === currentType) return;

      currentType = type;
      userTypeInput.value = type;

      typeButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      if (type === "patient") {
        formTitle.textContent = "Create Patient Account";
        tableTitle.textContent = "Patient Accounts";
        extraLabel.textContent = "Patient ID";
        extraHeader.textContent = "Patient ID";
        extraFieldInput.placeholder = "Enter Patient ID";
        extraFieldRow.style.display = "flex";
      } else if (type === "guardian") {
        formTitle.textContent = "Create Guardian Account";
        tableTitle.textContent = "Guardian Accounts";
        extraLabel.textContent = "Guardian ID";
        extraHeader.textContent = "Guardian ID";
        extraFieldInput.placeholder = "Enter Guardian ID";
        extraFieldRow.style.display = "flex";
      } else {
        formTitle.textContent = "Create Doctor Account";
        tableTitle.textContent = "Doctor Accounts";
        extraLabel.textContent = "Specialty";
        extraHeader.textContent = "Specialty";
        extraFieldInput.placeholder = "e.g., Cardiologist";
        extraFieldRow.style.display = "flex";
      }

      searchInput.value = "";
      form.reset();
      statusSelect.value = "Active";

      fetchData(currentType);
      renderTable();
    });
  });

  // Handle create account
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const fullName = fullNameInput.value.trim();
    const email = emailInput.value.trim();
    const phone = phoneInput.value.trim();
    const extra = extraFieldInput.value.trim();
    const status = statusSelect.value;

    if (!fullName || !email) {
      alert("Name and email are required.");
      return;
    }

    const list = dataStore[currentType];

    const newRecord = {
      id: Date.now(),
      fullName,
      email,
      phone,
      extra,
      status,
    };

    list.push(newRecord);
    form.reset();
    statusSelect.value = "Active";

    renderTable();
  });

  let isLoading = false;
  // Delete handler
  async function fetchData(type) {
    isLoading = true;
    renderTable(); // Re-render instantly to show loading row

    try {
      const colRef = collection(db, type + "s");
      const snapshot = await getDocs(colRef);

      const tempData = [];

      for (const docSnap of snapshot.docs) {
        const docData = docSnap.data();
        const uid = docSnap.id;

        let status = docData.status || "Inactive";

        // Call Cloud Function to check if user exists in Firebase Auth
        try {
          const result = await checkUserLoginFunc({ uid });
          if (result.data.canLogin) {
            status = "Active";

          } else {
            status = "Inactive";
          }
        } catch (err) {
          console.error(`Error checking login for UID ${uid}:`, err);
          status = "Inactive";
        }

        tempData.push({
          id: uid,
          fullName: (docData.firstName || "") + " " + (docData.lastName || ""),
          email: docData.email,
          phone: docData.phone || "",
          extra: docData.extra || "",
          status
        });
      }

      dataStore[type] = tempData;
      renderTable();

    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Failed to fetch data. Check console for details.");
    }
    
    isLoading = false;
    renderTable();
  }

  // Render table
  function renderTable() {
    const list = dataStore[currentType];
    const searchTerm = searchInput.value.trim().toLowerCase();
    tableBody.innerHTML = "";

    const filtered = list.filter((item) => {
      if (!searchTerm) return true;
      return (
        item.fullName.toLowerCase().includes(searchTerm) ||
        item.email.toLowerCase().includes(searchTerm)
      );
    });

    if (isLoading) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = 7;
      cell.textContent = "Loading user data...";
      cell.style.fontStyle = "italic";
      row.appendChild(cell);
      tableBody.appendChild(row);
    return; 
  }

    if (filtered.length === 0) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = 7;
      cell.textContent = "No accounts found.";
      row.appendChild(cell);
      tableBody.appendChild(row);
      return;
    }

    filtered.forEach((item, index) => {
      const row = document.createElement("tr");
      
      const deleteDisabled = item.status === "Inactive" ? "disabled" : "";

      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${item.fullName}</td>
        <td>${item.email}</td>
        <td>${item.phone || "-"}</td>
        <td>${item.extra || "-"}</td>
        <td>
          <span class="badge ${item.status.toLowerCase()}">
            ${item.status}
          </span>
        </td>
        <td>
          <button class="action-btn" data-id="${item.id}" ${deleteDisabled}>
            Delete
          </button>
        </td>
      `;
      
      if (deleteDisabled) {
        const btn = row.querySelector(".action-btn");
        btn.style.opacity = 0.5;
        btn.style.cursor = "not-allowed";
      }

      tableBody.appendChild(row);
    });

    // Attach delete listeners
    $$(".action-btn", section).forEach((btn) => {

      btn.addEventListener("click", async () => {
        if (btn.disabled) return; // Skip disabled buttons

        const uidToDelete = btn.dataset.id;

        // Check if current user is admin
        const admin = await isCurrentUserAdmin();
        if (!admin) {
          alert("You are not authorized to delete users.");
          return;
        }

        if (!btn.dataset.confirming) {
          // First click: change appearance to confirm deletion
          btn.dataset.confirming = "true";
          btn.textContent = "Confirm Deletion";
          btn.style.backgroundColor = "#28a745"; // Green
          btn.style.color = "#fff";

          let cancelBtn = document.createElement("button");
          cancelBtn.textContent = "Cancel";
          cancelBtn.className = "cancel-btn";
          cancelBtn.style.marginLeft = "5px";
          btn.parentNode.appendChild(cancelBtn);

        // Cancel button listener
          cancelBtn.addEventListener("click", () => {
          // Reset delete button
          btn.dataset.confirming = "";
          btn.textContent = "Delete";
          btn.style.backgroundColor = "";
          btn.style.color = "";
          // Remove cancel button
          cancelBtn.remove();
          });

          return;
        }

        // Call the deleteUser function
        try {
          const result = await deleteUserFunc({ uid: uidToDelete });
          console.log(result.data.message);

          fetchData(currentType);
        } catch (error) {
          console.error("Error deleting user:", error);
          alert(error.message || "Failed to delete user. Only admins can perform this action.");
        }
      });
    });
  }

  // Search listener
  searchInput.addEventListener("input", () => {
    renderTable();
  });

  async function handleFetch() {
    setLoading(true);        // show "Loading..."
    await fetchData(currentType);
    setLoading(false);       // hide "Loading..."
}

  fetchData(currentType);
})();

//  SECTION 3: Reports (admin_report logic)

(async function initReportsSection() {
  const section = $("#reports");
  if (!section) return;

  // DOM refs (scoped)
  const banner = $("#ar-report-banner", section);
  const bannerClose = $("#ar-banner-close", section);

  const doctorFilter = $("#ar-doctor-filter", section);
  const patientFilter = $("#ar-patient-filter", section);
  const dateFrom = $("#ar-date-from", section);
  const dateTo = $("#ar-date-to", section);

  const generateBtn = $("#ar-generate-btn", section);

  const metaPeriod = $("#ar-meta-period", section);
  const metaUpdated = $("#ar-meta-updated", section);

  const totalPatientsEl = $("#ar-total-patients", section);
  const totalDoctorsEl = $("#ar-total-doctors", section);
  const totalAppointmentsEl = $("#ar-total-appointments", section);

  const reportBody = $("#ar-report-body", section);

  // Store all appointment data
  let allAppointments = [];

  // Helper to get current filter values
  function getFilters() {
    return {
      doctorValue: doctorFilter.value,
      patientValue: patientFilter.value,
      fromValue: dateFrom.value ? new Date(dateFrom.value) : null,
      toValue: dateTo.value ? new Date(dateTo.value) : null,
    };
  }

  // Wrapper functions that use imported functions
  function renderSummaryWrapper() {
    const filters = getFilters();
    const rows = getFilteredRows(allAppointments, filters);
    renderSummary(rows, {
      totalPatientsEl,
      totalDoctorsEl,
      totalAppointmentsEl,
    });
  }

  function renderTableWrapper() {
    const filters = getFilters();
    const rows = getFilteredRows(allAppointments, filters);
    renderTable(rows, reportBody);
  }

  function updateMetaWrapper() {
    updateMeta(
      { metaPeriod, metaUpdated },
      dateFrom.value,
      dateTo.value
    );
  }

  // Generate report and download as CSV
  async function generateReport() {
    const filters = getFilters();
    const rows = getFilteredRows(allAppointments, filters);
    
    if (rows.length === 0) {
      alert("No appointments found with the current filters. Please adjust your selection.");
      return;
    }
    
    generateAndDownloadCsv(rows);
    banner.style.display = "flex";
  }

  // Load appointment data from Firebase
  async function loadAppointmentData() {
    try {
      reportBody.innerHTML = '<tr><td colspan="11" style="text-align: center; padding: 20px;">Loading appointments...</td></tr>';
      
      const appointments = await getAllAppointments();
      allAppointments = await modifyAppointmentData(appointments);
      
      // Initialize filters with the data
      initFilters(doctorFilter, patientFilter, allAppointments);
      
      // Render initial view
      renderSummaryWrapper();
      renderTableWrapper();
      updateMetaWrapper();
    } catch (error) {
      console.error("Error loading appointment data:", error);
      reportBody.innerHTML = '<tr><td colspan="11" style="text-align: center; padding: 20px; color: red;">Error loading appointments. Please refresh the page.</td></tr>';
    }
  }

  // Listeners
  bannerClose.addEventListener("click", () => {
    banner.style.display = "none";
  });

  [doctorFilter, patientFilter, dateFrom, dateTo].forEach(
    (el) => {
      el.addEventListener("change", () => {
        renderSummaryWrapper();
        renderTableWrapper();
        updateMetaWrapper();
      });
    }
  );

  generateBtn.addEventListener("click", generateReport);

  // INIT
  banner.style.display = "none"; // Hide banner by default
  await loadAppointmentData();
})();
// JS content from previous response (trimmed for brevity in this tool run)
