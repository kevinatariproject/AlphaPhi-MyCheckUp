// import { auth } from './firebase_config.js';
// import { onAuthStateChanged, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
// import { getUserAppointments } from "./appt_scheduling.js";

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

// Visit Purpose Selection

const visitPurposes = [
  "General Checkup",
  "Physical Exam",
  "Sick/Injury Visit",
  "Follow-up Visit",
  "Consultation",
  "Other"
];

function populateVisitPurposes() {
  const select = $("#visitPurpose");
  select.innerHTML = '<option value="">Select visit purpose</option>';

  visitPurposes.forEach((purpose) => {
    const opt = document.createElement("option");
    opt.value = purpose;
    opt.textContent = purpose;
    select.appendChild(opt);
  });
}



/* Demo appointments */
let appointments = [
  { id: "a1", doctor: "Dr. Jane Doe, MD", date: "October 10th, 2025", time: "1:00 PM", location: "LOCATION" },
  { id: "a2", doctor: "Dr. Jane Doe, MD", date: "November 12th, 2025", time: "3:00 PM", location: "LOCATION" },
  { id: "a3", doctor: "Dr. Jon Doe, MD", date: "November 12th, 2025", time: "8:00 AM", location: "LOCATION" }
];

const demoDaySlots = ["7:30 AM", "8:00 AM", "10:00 AM", "10:30 AM", "11:00 AM"];

// Doctors list for scheduling and search
const allDoctors = [
  { name: "Dr. Jane Doe, MD", specialty: "Primary Care" },
  { name: "Dr. Jon Doe, MD", specialty: "Dermatology" }
];

// Render doctor options into #visitDoctor with optional search term
function renderDoctorOptions() {
  const select = $("#visitDoctor");
  const searchInput = $("#doctorSearch");
  const term = searchInput ? searchInput.value.trim().toLowerCase() : "";

  // Base option
  select.innerHTML = '<option value="">Doctors</option>';

  allDoctors
    .filter((d) => {
      if (!term) return true;
      const text = (d.name + " " + d.specialty).toLowerCase();
      return text.includes(term);
    })
    .forEach((d) => {
      const opt = document.createElement("option");
      opt.value = d.name;
      opt.textContent = `${d.name} – ${d.specialty}`;
      select.appendChild(opt);
    });
}

/* Drawer */
const drawer = $("#drawer");
const scrim = $("#scrim");
const btnOpen = $("#openDrawer");

function openDrawer() {
  document.body.classList.add("drawer-open");
  drawer.hidden = false;
  scrim.hidden = false;
  btnOpen.setAttribute("aria-expanded", "true");
}

function closeDrawer() {
  document.body.classList.remove("drawer-open");
  drawer.hidden = true;
  scrim.hidden = true;
  btnOpen.setAttribute("aria-expanded", "false");
}

if (btnOpen) {
  btnOpen.addEventListener("click", () => {
    if (drawer.hidden) openDrawer();
    else closeDrawer();
  });
}

if (scrim) {
  scrim.addEventListener("click", closeDrawer);
}

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !drawer.hidden) closeDrawer();
});

/* Navigation */
function showView(view) {
  $$(".sidenav .nav-item").forEach((b) =>
    b.classList.toggle("active", b.dataset.view === view)
  );

  $("#view-appointments").classList.add("hidden");
  $("#view-search").classList.add("hidden");
  $("#view-account").classList.add("hidden");
  $("#view-availability").classList.add("hidden");

  if (view === "appointments") $("#view-appointments").classList.remove("hidden");
  if (view === "search") $("#view-search").classList.remove("hidden");
  if (view === "account") $("#view-account").classList.remove("hidden");

  closeDrawer();
}

$$(".sidenav .nav-item").forEach((btn) => {
  btn.addEventListener("click", () => {
    const view = btn.dataset.view;
    if (view) showView(view);
  });
});

/* Appointments list */
function renderAppointments() {
  const list = $("#appointments");
  list.innerHTML = "";

  if (!appointments.length) {
    list.innerHTML = '<p class="sub">You have no upcoming appointments.</p>';
    return;
  }

  appointments.forEach((a) => {
    const card = document.createElement("article");
    card.className = "card";
    card.setAttribute("role", "listitem");
    card.innerHTML = `
      <div class="meta">
        <div class="title">${a.doctor}</div>
        <div class="sub">Specialty</div>
      </div>
      <div class="right">
        <div class="sub">${a.date}</div>
        <div class="sub">${a.time}</div>
        <div class="sub">${a.location}</div>
        <div class="actions-inline">
          <button class="secondary" data-id="${a.id}" data-act="change">Change</button>
          <button class="primary" data-id="${a.id}" data-act="cancel">Cancel</button>
        </div>
      </div>
    `;
    list.appendChild(card);
  });

  list.onclick = (e) => {
    const btn = e.target.closest("button[data-id]");
    if (!btn) return;
    const id = btn.dataset.id;
    if (btn.dataset.act === "cancel") {
      openCancelModal(id);
    } else if (btn.dataset.act === "change") {
      startScheduleFlow("change", id);
    }
  };
}

/* Modal helpers */
const modalOverlay = $("#modalOverlay");

function openModal(modal) {
  modal.classList.remove("hidden");
  modal.classList.add("open");
  modalOverlay.classList.remove("hidden");
  modalOverlay.classList.add("open");
}

function closeModal(modal) {
  modal.classList.remove("open");
  modal.classList.add("hidden");
  const anyOpen = document.querySelector(".modal.open");
  if (!anyOpen) {
    modalOverlay.classList.remove("open");
    modalOverlay.classList.add("hidden");
  }
}

document.addEventListener("click", (e) => {
  if (e.target.matches("[data-close-modal]")) {
    const m = e.target.closest(".modal");
    if (m) closeModal(m);
  }
});

modalOverlay.addEventListener("click", () => {
  document.querySelectorAll(".modal.open").forEach((m) => closeModal(m));
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document.querySelectorAll(".modal.open").forEach((m) => closeModal(m));
  }
});

/* Schedule flow */
const selectPurpose = $("#selectPurpose");
const viewAvailability = $("#view-availability");
const availabilityBackBtn = $("#availabilityBackBtn");
const monthLabel = $("#monthLabel");
const calendarBody = $("#calendarBody");
const daySlotsModal = $("#daySlotsModal");
const slotsDateLabel = $("#slotsDateLabel");
const daySlotsList = $("#daySlotsList");
const confirmModal = $("#confirmModal");
const confirmText = $("#confirmText");

let scheduleCtx = {
  mode: "new",
  apptId: null,
  purpose: "",
  doctor: "",
};

$("#tileSchedule").addEventListener("click", () => startScheduleFlow("new"));

$("#tileChange").addEventListener("click", () => {
  alert("Use the Change button on a specific appointment to reschedule.");
});

function startScheduleFlow(mode, apptId) {
  scheduleCtx = { mode, apptId: apptId || null, purpose: "", doctor: "" };
  $("#visitPurpose").value = "";
  $("#visitDoctor").value = "";
  if ($("#doctorSearch")) $("#doctorSearch").value = "";
  renderDoctorOptions();
  openModal(selectPurpose);
}

$("#s1NextBtn").addEventListener("click", () => {
  const purpose = $("#visitPurpose").value;
  if (!purpose) {
    alert("Please select a reason for your visit.");
    return;
  }
  scheduleCtx.purpose = purpose;

  closeModal(selectPurpose);
  $("#view-appointments").classList.add("hidden");
  viewAvailability.classList.remove("hidden");
  buildCalendar();
});

availabilityBackBtn.addEventListener("click", () => {
  viewAvailability.classList.add("hidden");
  $("#view-appointments").classList.remove("hidden");
});

/* Availability calendar */
let currentYear = 2025;
let currentMonth = 9; // October

function buildCalendar() {
  const first = new Date(currentYear, currentMonth, 1);
  const startDay = first.getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  monthLabel.textContent = first.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  calendarBody.innerHTML = "";
  let day = 1;

  for (let r = 0; r < 6; r++) {
    const tr = document.createElement("tr");

    for (let c = 0; c < 7; c++) {
      const td = document.createElement("td");

      if ((r === 0 && c < startDay) || day > daysInMonth) {
        td.classList.add("disabled");
      } else {
        const num = document.createElement("span");
        num.className = "day-number";
        num.textContent = day;
        td.appendChild(num);

        const weekday = (startDay + day - 1) % 7;

        if (weekday === 2) {
          const range = document.createElement("div");
          range.className = "avail-range";
          range.textContent = "7AM – 3PM";
          range.addEventListener("click", () => openDaySlots(day));
          td.appendChild(range);
        } else if (weekday === 4) {
          const range = document.createElement("div");
          range.className = "avail-range";
          range.textContent = "8AM – 10PM";
          range.addEventListener("click", () => openDaySlots(day));
          td.appendChild(range);
        }

        day++;
      }

      tr.appendChild(td);
    }

    calendarBody.appendChild(tr);
    if (day > daysInMonth) break;
  }
}

$("#prevMonth").addEventListener("click", () => {
  currentMonth--;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  buildCalendar();
});

$("#nextMonth").addEventListener("click", () => {
  currentMonth++;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  buildCalendar();
});

function openDaySlots(day) {
  const date = new Date(currentYear, currentMonth, day);
  const nice = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  slotsDateLabel.textContent = nice;
  daySlotsList.innerHTML = "";

  demoDaySlots.forEach((time) => {
    const btn = document.createElement("button");
    btn.textContent = time;
    btn.addEventListener("click", () => confirmSlot(nice, time));
    daySlotsList.appendChild(btn);
  });

  openModal(daySlotsModal);
}

function confirmSlot(date, time) {
  closeModal(daySlotsModal);
  viewAvailability.classList.add("hidden");
  $("#view-appointments").classList.remove("hidden");

  if (scheduleCtx.mode === "change" && scheduleCtx.apptId) {
    appointments = appointments.map((a) =>
      a.id === scheduleCtx.apptId ? { ...a, date, time } : a
    );
    confirmText.textContent = `Your appointment has been updated to ${date} at ${time}.`;
  } else {
    const id = "a" + Math.floor(Math.random() * 1e6);
    appointments.push({
      id,
      doctor: scheduleCtx.doctor,
      date,
      time,
      location: "LOCATION",
    });
    confirmText.textContent = `Your appointment with ${scheduleCtx.doctor} is scheduled for ${date} at ${time}.`;
  }

  renderAppointments();
  openModal(confirmModal);
}

/* Cancel flow */
const cancelSelect = $("#cancelSelect");
const confirmCancelBtn = $("#confirmCancelBtn");

function openCancelModal(preselectId) {
  cancelSelect.innerHTML = "";

  if (!appointments.length) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "No upcoming appointments";
    cancelSelect.appendChild(opt);
  } else {
    appointments.forEach((a) => {
      const opt = document.createElement("option");
      opt.value = a.id;
      opt.textContent = `${a.doctor} – ${a.date} at ${a.time}`;
      cancelSelect.appendChild(opt);
    });
  }

  if (preselectId) cancelSelect.value = preselectId;
  openModal($("#cancelModal"));
}

$("#tileCancel").addEventListener("click", () => openCancelModal());

confirmCancelBtn.addEventListener("click", () => {
  const id = cancelSelect.value;
  if (!id) {
    alert("Please select an appointment to cancel.");
    return;
  }

  appointments = appointments.filter((a) => a.id !== id);
  closeModal($("#cancelModal"));
  renderAppointments();

  confirmText.textContent = "Your appointment has been cancelled.";
  openModal(confirmModal);
});

/* Init */
window.addEventListener("DOMContentLoaded", () => {
  showView("appointments");
  renderAppointments();
  populateVisitPurposes();
  buildCalendar();
  

  // Initialize doctor dropdown for scheduling
  if (typeof renderDoctorOptions === "function") {
    renderDoctorOptions();
  }

  const doctorSearchInput = $("#doctorSearch");
  if (doctorSearchInput) {
    doctorSearchInput.addEventListener("input", renderDoctorOptions);
  }
});
