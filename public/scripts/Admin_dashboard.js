import { refreshData as initAppointmentsSection } from "./admin_appts.js";
import { db, functions } from "./firebase_config.js";
import { doc, getDoc, getDocs, collection } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-functions.js";
import { getAuth, onAuthStateChanged  } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

const auth = getAuth(); // initialize auth instance

// ===== Helpers =====
const $ = (s, ctx = document) => ctx.querySelector(s);
const $$ = (s, ctx = document) => Array.from(ctx.querySelectorAll(s));

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

  // Seed demo data
  // dataStore.patient.push(
  //   {
  //     id: 1,
  //     fullName: "John Doe",
  //     email: "john.doe@example.com",
  //     phone: "+1 (555) 123-4567",
  //     extra: "P-1001",
  //     status: "Active",
  //   },
  //   {
  //     id: 2,
  //     fullName: "Jane Smith",
  //     email: "jane.smith@example.com",
  //     phone: "+1 (555) 987-6543",
  //     extra: "P-1002",
  //     status: "Inactive",
  //   }
  // );

  dataStore.doctor.push({
    id: 3,
    fullName: "Dr. Emily Carter",
    email: "emily.carter@hospital.com",
    phone: "+1 (555) 222-3333",
    extra: "Cardiologist",
    status: "Active",
  });

  async function handleFetch() {
    setLoading(true);        // show "Loading..."
    await fetchData(currentType);
    setLoading(false);       // hide "Loading..."
}

  fetchData(currentType);
})();

//  SECTION 3: Reports (admin_report logic)

(function initReportsSection() {
  const section = $("#reports");
  if (!section) return;

  // Sample data for report
  const reportRows = [
    {
      appointment_id: "APT-1001",
      appointment_date: "2025-11-18",
      appointment_time: "09:00",
      patient_id: "P-001",
      patient_name: "John Doe",
      patient_email: "john@example.com",
      patient_phone: "+1 (555) 111-2222",
      doctor_id: "D-010",
      doctor_name: "Dr. Emily Carter",
      doctor_specialty: "Cardiology",
      appointment_type: "Consultation",
      appointment_status: "Completed",
      payment_amount: 120.0,
      payment_status: "Paid",
      payment_method: "Credit Card",
      clinic_location: "Clinic A - Room 101",
    },
    {
      appointment_id: "APT-1002",
      appointment_date: "2025-11-18",
      appointment_time: "10:00",
      patient_id: "P-002",
      patient_name: "Jane Smith",
      patient_email: "jane@example.com",
      patient_phone: "+1 (555) 333-4444",
      doctor_id: "D-010",
      doctor_name: "Dr. Emily Carter",
      doctor_specialty: "Cardiology",
      appointment_type: "Follow-up",
      appointment_status: "Scheduled",
      payment_amount: 80.0,
      payment_status: "Pending",
      payment_method: "Cash",
      clinic_location: "Clinic A - Room 102",
    },
    {
      appointment_id: "APT-1003",
      appointment_date: "2025-11-18",
      appointment_time: "11:30",
      patient_id: "P-003",
      patient_name: "Michael Brown",
      patient_email: "michael@example.com",
      patient_phone: "+1 (555) 777-8888",
      doctor_id: "D-011",
      doctor_name: "Dr. Rahul Patel",
      doctor_specialty: "Internal Medicine",
      appointment_type: "Lab Review",
      appointment_status: "Completed",
      payment_amount: 150.0,
      payment_status: "Paid",
      payment_method: "Insurance",
      clinic_location: "Clinic B - Room 203",
    },
  ];

  // DOM refs (scoped)
  const banner = $("#ar-report-banner", section);
  const bannerClose = $("#ar-banner-close", section);

  const doctorFilter = $("#ar-doctor-filter", section);
  const paymentStatusFilter = $("#ar-payment-status-filter", section);
  const searchFilter = $("#ar-search-filter", section);
  const dateFrom = $("#ar-date-from", section);
  const dateTo = $("#ar-date-to", section);

  const generateBtn = $("#ar-generate-btn", section);
  const downloadBtn = $("#ar-download-btn", section);

  const metaPeriod = $("#ar-meta-period", section);
  const metaUpdated = $("#ar-meta-updated", section);

  const totalPatientsEl = $("#ar-total-patients", section);
  const totalDoctorsEl = $("#ar-total-doctors", section);
  const totalAppointmentsEl = $("#ar-total-appointments", section);
  const totalRevenueEl = $("#ar-total-revenue", section);

  const reportBody = $("#ar-report-body", section);

  // Initialize doctor filter
  function initFilters() {
    const doctors = Array.from(
      new Set(reportRows.map((r) => r.doctor_name))
    ).sort();
    doctors.forEach((name) => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      doctorFilter.appendChild(opt);
    });
  }

  // Apply filters
  function getFilteredRows() {
    const doctorValue = doctorFilter.value;
    const paymentValue = paymentStatusFilter.value;
    const searchValue = searchFilter.value.trim().toLowerCase();
    const fromValue = dateFrom.value ? new Date(dateFrom.value) : null;
    const toValue = dateTo.value ? new Date(dateTo.value) : null;

    return reportRows.filter((row) => {
      if (doctorValue && row.doctor_name !== doctorValue) return false;
      if (paymentValue && row.payment_status !== paymentValue) return false;

      if (fromValue || toValue) {
        const apptDate = new Date(row.appointment_date);
        if (fromValue && apptDate < fromValue) return false;
        if (toValue && apptDate > toValue) return false;
      }

      if (searchValue) {
        const text = (
          row.patient_name +
          " " +
          row.patient_email +
          " " +
          row.patient_phone +
          " " +
          row.doctor_name +
          " " +
          row.doctor_specialty +
          " " +
          row.appointment_type +
          " " +
          row.appointment_status
        ).toLowerCase();
        if (!text.includes(searchValue)) return false;
      }

      return true;
    });
  }

  // Summary cards
  function renderSummary() {
    const rows = getFilteredRows();
    const patientIds = new Set(rows.map((r) => r.patient_id));
    const doctorIds = new Set(rows.map((r) => r.doctor_id));
    const totalRevenue = rows.reduce(
      (sum, r) => sum + (r.payment_amount || 0),
      0
    );

    totalPatientsEl.textContent = patientIds.size;
    totalDoctorsEl.textContent = doctorIds.size;
    totalAppointmentsEl.textContent = rows.length;
    totalRevenueEl.textContent = `$${totalRevenue.toFixed(2)}`;
  }

  // Table
  function renderTable() {
    const rows = getFilteredRows();
    reportBody.innerHTML = "";

    if (rows.length === 0) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 16;
      td.textContent = "No data found for the selected filters.";
      tr.appendChild(td);
      reportBody.appendChild(tr);
      return;
    }

    rows.forEach((row) => {
      const tr = document.createElement("tr");

      const statusClass =
        row.appointment_status === "Completed"
          ? "status-completed"
          : row.appointment_status === "Scheduled"
          ? "status-scheduled"
          : row.appointment_status === "Canceled"
          ? "status-canceled"
          : "";

      let paymentClass = "";
      if (row.payment_status === "Paid") paymentClass = "badge-paid";
      else if (row.payment_status === "Pending") paymentClass = "badge-pending";
      else if (row.payment_status === "Failed") paymentClass = "badge-failed";

      tr.innerHTML = `
        <td>${row.appointment_id}</td>
        <td>${row.appointment_date}</td>
        <td>${row.appointment_time}</td>
        <td>${row.patient_id}</td>
        <td>${row.patient_name}</td>
        <td>${row.patient_email || ""}</td>
        <td>${row.patient_phone || ""}</td>
        <td>${row.doctor_id}</td>
        <td>${row.doctor_name}</td>
        <td>${row.doctor_specialty || ""}</td>
        <td>${row.appointment_type}</td>
        <td><span class="status-pill ${statusClass}">${
        row.appointment_status
      }</span></td>
        <td>$${row.payment_amount.toFixed(2)}</td>
        <td><span class="${paymentClass}">${row.payment_status}</span></td>
        <td>${row.payment_method}</td>
        <td>${row.clinic_location || ""}</td>
      `;

      reportBody.appendChild(tr);
    });
  }

  // Meta info
  function updateMeta() {
    const fromValue = dateFrom.value;
    const toValue = dateTo.value;

    if (!fromValue && !toValue) {
      metaPeriod.textContent = "Period: All Time";
    } else {
      metaPeriod.textContent = `Period: ${fromValue || "…"} to ${
        toValue || "…"
      }`;
    }

    const now = new Date();
    metaUpdated.textContent =
      "Last generated: " +
      now.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
  }

  // Generate report (re-render)
  function generateReport() {
    renderSummary();
    renderTable();
    updateMeta();
    banner.style.display = "flex";
  }

  // Download CSV
  function downloadCsv() {
    const rows = getFilteredRows();
    if (rows.length === 0) {
      alert("No data to export for the selected filters.");
      return;
    }

    const header = [
      "appointment_id",
      "appointment_date",
      "appointment_time",
      "patient_id",
      "patient_name",
      "patient_email",
      "patient_phone",
      "doctor_id",
      "doctor_name",
      "doctor_specialty",
      "appointment_type",
      "appointment_status",
      "payment_amount",
      "payment_status",
      "payment_method",
      "clinic_location",
    ];

    const lines = [];
    lines.push(header.join(","));

    rows.forEach((r) => {
      const row = [
        r.appointment_id,
        r.appointment_date,
        r.appointment_time,
        r.patient_id,
        `"${r.patient_name}"`,
        r.patient_email || "",
        r.patient_phone || "",
        r.doctor_id,
        `"${r.doctor_name}"`,
        `"${r.doctor_specialty || ""}"`,
        `"${r.appointment_type}"`,
        r.appointment_status,
        r.payment_amount.toFixed(2),
        r.payment_status,
        r.payment_method,
        `"${r.clinic_location || ""}"`,
      ];
      lines.push(row.join(","));
    });

    const csvContent = lines.join("\n");
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "mycheckup_full_appointments_report.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Listeners
  bannerClose.addEventListener("click", () => {
    banner.style.display = "none";
  });

  [doctorFilter, paymentStatusFilter, searchFilter, dateFrom, dateTo].forEach(
    (el) => {
      el.addEventListener("input", () => {
        renderSummary();
        renderTable();
      });
    }
  );

  generateBtn.addEventListener("click", generateReport);
  downloadBtn.addEventListener("click", downloadCsv);

  // INIT
  initFilters();
  generateReport();
})();
// JS content from previous response (trimmed for brevity in this tool run)
