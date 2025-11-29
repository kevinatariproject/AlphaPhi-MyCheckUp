import { db, auth } from "./firebase_config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { getUserAppointments, cancelAppointment } from './appt_scheduling.js';

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

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

let allScheduledAppts = [];

/* Helper function to parse appointment dates */
function parseAppointmentDate(dateValue) {
  let parsedDate;
  
  // Check if it's a Firestore Timestamp object
  if (dateValue?.seconds) {
    parsedDate = new Date(dateValue.seconds * 1000);
  } else if (typeof dateValue === 'string' && dateValue.includes(' at ')) {
    // Parse Firestore date string format: "November 6, 2025 at 2:00:00 PM UTC-5"
    // Extract the date and time parts, ignoring the stored timezone
    const timeMatch = dateValue.match(/^(.+?) at (.+?) UTC/);
    
    if (timeMatch) {
      // Parse as UTC then convert to local timezone
      const dateUTC = new Date(timeMatch[1] + ' ' + timeMatch[2] + ' UTC');
      parsedDate = dateUTC;
    } else {
      // Fallback: parse directly
      parsedDate = new Date(dateValue);
    }
  } else {
    // ISO string or other format
    parsedDate = new Date(dateValue);
  }
  
  return parsedDate;
}

/* Appointments list */
async function renderAppointments(userId) {

  const appointmentsList = $("#appointmentList");
  appointmentsList.innerHTML = '<p class="sub">Loading appointments...</p>';

  try {
    // Get all appointments for the user and filter by status in JavaScript
    const allUserAppts = await getUserAppointments(userId);
    console.log("All User Appointments:", allUserAppts);
    
    // Filter for scheduled and rescheduled appointments
    allScheduledAppts = allUserAppts.filter(appt => 
      appt.status === "scheduled" || appt.status === "rescheduled"
    );
    console.log("Filtered Appointments (scheduled/rescheduled):", allScheduledAppts);

    if (allScheduledAppts.length === 0) {
      appointmentsList.innerHTML = '<p class="sub">You have no upcoming appointments.</p>';
      return;
    }

    // Fetch doctor details for each appointment
    const appointmentsWithDoctors = await Promise.all(
      allScheduledAppts.map(async (appointment) => {
        try {
          const doctorDoc = await getDoc(doc(db, "doctors", appointment.doctorId));
          if (doctorDoc.exists()) {
            const doctorData = doctorDoc.data();
            return {
              ...appointment,
              doctorName: `Dr. ${doctorData.firstName} ${doctorData.lastName}, ${doctorData.credentials || 'MD'}`,
              departmentId: doctorData.departmentId
            };
          }
          return { ...appointment, doctorName: "Unknown Doctor", departmentId: null };
        } catch (error) {
          console.error("Error fetching doctor:", error);
          return { ...appointment, doctorName: "Unknown Doctor", departmentId: null };
        }
      })
    );

    allScheduledAppts = appointmentsWithDoctors;

    appointmentsList.innerHTML = "";

    appointmentsWithDoctors.forEach((appointment) => {
      // Parse the startTime and endTime using the helper function
      const startDate = parseAppointmentDate(appointment.startTime);
      const endDate = parseAppointmentDate(appointment.endTime);

      console.log("Appointment dates:", { 
        startTime: appointment.startTime, 
        endTime: appointment.endTime,
        parsedStart: startDate.toString(),
        parsedEnd: endDate.toString()
      });

      // Format date and time in user's local timezone
      const formattedDate = startDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric"
      });

      const formattedStartTime = startDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true
      });

      const formattedEndTime = endDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true
      });

      // Format Visit Type and Location as Pascal Case
      const formatPascalCase = (str) => {
        return str
          .toLowerCase()
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }

      const formattedVisitType = formatPascalCase(appointment.visitType || 'General Visit');
      const formattedLocation = formatPascalCase(appointment.location || 'Location to be determined');

      const card = document.createElement("article");
      card.className = "card";
      card.setAttribute("role", "listitem");
      card.innerHTML = `
        <div class="meta">
          <div class="title">${appointment.doctorName}</div>
          <div class="sub">${formattedVisitType || 'General Visit'}</div>
        </div>
        <div class="right">
          <div class="sub">${formattedDate}</div>
          <div class="sub">${formattedStartTime} - ${formattedEndTime}</div>
          <div class="sub">${formattedLocation || 'Location to be determined'}</div>
          <div class="actions-inline">
            <button class="secondary" data-id="${appointment.id}" data-act="change">Change</button>
            <button class="primary" data-id="${appointment.id}" data-act="cancel">Cancel</button>
          </div>
        </div>
      `;
      appointmentsList.appendChild(card);
    });
  } catch (error) {
    console.error("Error rendering appointments:", error);
    appointmentsList.innerHTML = '<p class="sub">Error loading appointments. Please try again.</p>';
    return;
  }

  appointmentsList.onclick = (e) => {
    const btn = e.target.closest("button[data-id]");
    if (!btn) return;
    const id = btn.dataset.id;
    if (btn.dataset.act === "cancel") {
      openCancelApptModal(id);
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
const scheduleStep1 = $("#scheduleStep1");
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
  $("#selectedDoctorId").value = "";
  
  openModal(scheduleStep1);
}

$("#s1NextBtn").addEventListener("click", () => {
  const purpose = $("#visitPurpose").value;
  const doctor = $("#selectedDoctorId").value;
  if (!purpose || !doctor) {
    alert("Please select both purpose and doctor.");
    return;
  }
  scheduleCtx.purpose = purpose;
  scheduleCtx.doctor = doctor;

  closeModal(scheduleStep1);
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

  const user = auth.currentUser;
  if (user) {
    renderAppointments(user.uid);
  }
  openModal(confirmModal);
}

/* Cancel flow */
const cancelSelect = $("#cancelSelectedAppt");
const cancelAppt = $("#cancelApptModal");
const confirmCancelBtn = $("#confirmCancelBtn");

function openCancelSlctdApptModal(preselectId) {
  cancelSelect.innerHTML = "";

  if (allScheduledAppts.length === 0) {
    const apptOptions = document.createElement("option");
    apptOptions.value = "";
    apptOptions.textContent = "No upcoming appointments";
    cancelSelect.appendChild(apptOptions);
  }
  else {
    allScheduledAppts.forEach((appt) => {
      const option = document.createElement("option");
      const startDate = parseAppointmentDate(appt.startTime);
      const formattedDate = startDate.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
      const formattedTime = startDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true
      });
      option.value = appt.id;
      option.textContent = `${appt.doctorName} - ${formattedDate} at ${formattedTime}`;
      cancelSelect.appendChild(option);
    });
  }

  if (preselectId) {
    cancelSelect.value = preselectId;
  } 
    
  openModal($("#cancelSlctdApptModal"));
}

$("#tileCancel").addEventListener("click", () => openCancelSlctdApptModal());

function openCancelApptModal(preselectId) {
  if (preselectId) {
    cancelAppt.value = preselectId;
  }
  openModal($("#cancelApptModal"));
} 

cancelApptBtn.addEventListener("click", async () => {
  const apptId = cancelAppt.value;
  const user = auth.currentUser;
  if (!user) {
    alert("You must be logged in to cancel appointments.");
    return;
  }
  
  try {
    await cancelAppointment(apptId);
    closeModal(cancelAppt);
    await renderAppointments(user.uid);
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    alert("Failed to cancel appointment. Please try again.");
  }
});

confirmCancelBtn.addEventListener("click", async () => {
  const apptId = cancelSelect.value;
  if (!apptId) {
    alert("Please select an appointment to cancel.");
    return;
  }

  const user = auth.currentUser;
  if (!user) {
    alert("You must be logged in to cancel appointments.");
    return;
  }

  try {
    await cancelAppointment(apptId);
    closeModal($("#cancelSlctdApptModal"));
    
    confirmText.textContent = "Your appointment has been cancelled.";
    openModal(confirmModal);
    
    await renderAppointments(user.uid);
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    alert("Failed to cancel appointment. Please try again.");
  }
});

/* Init */
window.addEventListener("DOMContentLoaded", () => {
  // Wait for Firebase Auth to initialize
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      console.warn("No user logged in - redirecting to login");
      // Redirect to login page or show login prompt
      window.location.href = "./patient_login_page.html";
      return;
    }

    console.log("User authenticated:", user.uid);

    showView("appointments");
    await renderAppointments(user.uid);
    buildCalendar();
  });
});
