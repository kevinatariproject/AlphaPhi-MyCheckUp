// In-memory storage for demo
const dataStore = {
  patient: [],
  doctor: []
};

let currentType = "patient"; // "patient" or "doctor"

// DOM elements
const typeButtons = document.querySelectorAll(".toggle-btn");
const userTypeInput = document.getElementById("user-type");
const formTitle = document.getElementById("form-title");
const tableTitle = document.getElementById("table-title");
const extraLabel = document.getElementById("extra-label");
const extraHeader = document.getElementById("extra-header");
const extraFieldRow = document.getElementById("extra-field-row");

const form = document.getElementById("account-form");
const fullNameInput = document.getElementById("full-name");
const emailInput = document.getElementById("email");
const phoneInput = document.getElementById("phone");
const extraFieldInput = document.getElementById("extra-field");
const statusSelect = document.getElementById("status");
const searchInput = document.getElementById("search-input");
const tableBody = document.getElementById("accounts-body");

// Toggle Patients / Doctors
typeButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const type = btn.dataset.type;
    if (type === currentType) return;

    currentType = type;
    userTypeInput.value = type;

    // Update active button
    typeButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    // Update labels
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

    // Clear search & form
    searchInput.value = "";
    form.reset();
    statusSelect.value = "Active";

    renderTable();
  });
});

// Handle create account
form.addEventListener("submit", event => {
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
    id: Date.now(), // simple unique id
    fullName,
    email,
    phone,
    extra,
    status
  };

  list.push(newRecord);
  form.reset();
  statusSelect.value = "Active";

  renderTable();
});

// Handle delete
function deleteRecord(type, id) {
  dataStore[type] = dataStore[type].filter(item => item.id !== id);
  renderTable();
}

// Render table
function renderTable() {
  const list = dataStore[currentType];
  const searchTerm = searchInput.value.trim().toLowerCase();
  tableBody.innerHTML = "";

  const filtered = list.filter(item => {
    if (!searchTerm) return true;
    return (
      item.fullName.toLowerCase().includes(searchTerm) ||
      item.email.toLowerCase().includes(searchTerm)
    );
  });

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
        <button class="action-btn" data-id="${item.id}">
          Delete
        </button>
      </td>
    `;

    tableBody.appendChild(row);
  });

  // Attach delete listeners
  document.querySelectorAll(".action-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.id);
      deleteRecord(currentType, id);
    });
  });
}

// Search listener
searchInput.addEventListener("input", () => {
  renderTable();
});

// Initial demo data (optional, so the table is not empty)
dataStore.patient.push(
  {
    id: 1,
    fullName: "John Doe",
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    extra: "P-1001",
    status: "Active"
  },
  {
    id: 2,
    fullName: "Jane Smith",
    email: "jane.smith@example.com",
    phone: "+1 (555) 987-6543",
    extra: "P-1002",
    status: "Inactive"
  }
);

dataStore.doctor.push({
  id: 3,
  fullName: "Dr. Emily Carter",
  email: "emily.carter@hospital.com",
  phone: "+1 (555) 222-3333",
  extra: "Cardiologist",
  status: "Active"
});

// First render
renderTable();
