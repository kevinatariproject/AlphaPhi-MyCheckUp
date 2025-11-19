// Sample data: each row = one appointment with full info
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
    clinic_location: "Clinic A - Room 101"
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
    clinic_location: "Clinic A - Room 102"
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
    clinic_location: "Clinic B - Room 203"
  }
];

// DOM references
const banner = document.getElementById("report-banner");
const bannerClose = document.getElementById("banner-close");

const doctorFilter = document.getElementById("doctor-filter");
const paymentStatusFilter = document.getElementById("payment-status-filter");
const searchFilter = document.getElementById("search-filter");
const dateFrom = document.getElementById("date-from");
const dateTo = document.getElementById("date-to");

const generateBtn = document.getElementById("generate-btn");
const downloadBtn = document.getElementById("download-btn");

const metaPeriod = document.getElementById("meta-period");
const metaUpdated = document.getElementById("meta-updated");

const totalPatientsEl = document.getElementById("total-patients");
const totalDoctorsEl = document.getElementById("total-doctors");
const totalAppointmentsEl = document.getElementById("total-appointments");
const totalRevenueEl = document.getElementById("total-revenue");

const reportBody = document.getElementById("report-body");

// Initialize doctor filter
function initFilters() {
  const doctors = Array.from(new Set(reportRows.map(r => r.doctor_name))).sort();
  doctors.forEach(name => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    doctorFilter.appendChild(opt);
  });
}

// Apply filters to data
function getFilteredRows() {
  const doctorValue = doctorFilter.value;
  const paymentValue = paymentStatusFilter.value;
  const searchValue = searchFilter.value.trim().toLowerCase();
  const fromValue = dateFrom.value ? new Date(dateFrom.value) : null;
  const toValue = dateTo.value ? new Date(dateTo.value) : null;

  return reportRows.filter(row => {
    if (doctorValue && row.doctor_name !== doctorValue) return false;
    if (paymentValue && row.payment_status !== paymentValue) return false;

    if (fromValue || toValue) {
      const apptDate = new Date(row.appointment_date);
      if (fromValue && apptDate < fromValue) return false;
      if (toValue && apptDate > toValue) return false;
    }

    if (searchValue) {
      const text =
        (
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
  const patientIds = new Set(rows.map(r => r.patient_id));
  const doctorIds = new Set(rows.map(r => r.doctor_id));
  const totalRevenue = rows.reduce((sum, r) => sum + (r.payment_amount || 0), 0);

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

  rows.forEach(row => {
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
      <td><span class="status-pill ${statusClass}">${row.appointment_status}</span></td>
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
    metaPeriod.textContent = `Period: ${fromValue || "…"} to ${toValue || "…"}`;
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

// Download CSV with full info
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
    "clinic_location"
  ];

  const lines = [];
  lines.push(header.join(","));

  rows.forEach(r => {
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
      `"${r.clinic_location || ""}"`
    ];
    lines.push(row.join(","));
  });

  const csvContent = lines.join("\n");
  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;"
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

[doctorFilter, paymentStatusFilter, searchFilter, dateFrom, dateTo].forEach(el => {
  el.addEventListener("input", () => {
    renderSummary();
    renderTable();
  });
});

generateBtn.addEventListener("click", generateReport);
downloadBtn.addEventListener("click", downloadCsv);

// Init
initFilters();
generateReport();
