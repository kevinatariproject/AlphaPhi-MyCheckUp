import { db, auth } from "./firebase_config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { getUserAppointments } from './appt_scheduling.js';
import { openModal, closeModal } from "./modal_controls.js";
import { populateCalendar } from "./calendar_populate.js";

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

/* Demo appointments */
let appointments = [
  { id: "a1", doctor: "Dr. Jane Doe, MD", date: "October 10th, 2025", time: "1:00 PM", location: "LOCATION" },
  { id: "a2", doctor: "Dr. Jane Doe, MD", date: "November 12th, 2025", time: "3:00 PM", location: "LOCATION" },
  { id: "a3", doctor: "Dr. Jon Doe, MD", date: "November 12th, 2025", time: "8:00 AM", location: "LOCATION" }
];

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
async function renderAppointments(userId) {

  const appointmentsList = $("#appointmentList");
  appointmentsList.innerHTML = '<p class="sub">Loading appointments...</p>';

  try {
    // Get all appointments for the user and filter by status in JavaScript
    const allUserAppts = await getUserAppointments(userId);
    console.log("All User Appointments:", allUserAppts);
    
    // Filter for scheduled and rescheduled appointments
    const allAppts = allUserAppts.filter(appt => 
      appt.status === "scheduled" || appt.status === "rescheduled"
    );
    console.log("Filtered Appointments (scheduled/rescheduled):", allAppts);

    if (allAppts.length === 0) {
      appointmentsList.innerHTML = '<p class="sub">You have no upcoming appointments.</p>';
      return;
    }

    // Fetch doctor details for each appointment
    const appointmentsWithDoctors = await Promise.all(
      allAppts.map(async (appointment) => {
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

    appointmentsList.innerHTML = "";

    appointmentsWithDoctors.forEach((appointment) => {
      // Parse the startTime and endTime from Firestore format: "November 6, 2025 at 2:00:00 PM UTC-5"
      let startDate, endDate;
      
      // Check if it's a Firestore Timestamp object
      if (appointment.startTime?.seconds) {
        startDate = new Date(appointment.startTime.seconds * 1000);
        endDate = new Date(appointment.endTime.seconds * 1000);
      } else if (typeof appointment.startTime === 'string' && appointment.startTime.includes(' at ')) {
        // Parse Firestore date string format: "November 6, 2025 at 2:00:00 PM UTC-5"
        // Extract the date and time parts, ignoring the stored timezone
        const timeMatch = appointment.startTime.match(/^(.+?) at (.+?) UTC/);
        const endTimeMatch = appointment.endTime.match(/^(.+?) at (.+?) UTC/);
        
        if (timeMatch && endTimeMatch) {
          // Parse as UTC then convert to local timezone
          const startUTC = new Date(timeMatch[1] + ' ' + timeMatch[2] + ' UTC');
          const endUTC = new Date(endTimeMatch[1] + ' ' + endTimeMatch[2] + ' UTC');
          startDate = startUTC;
          endDate = endUTC;
        } else {
          // Fallback: parse directly
          startDate = new Date(appointment.startTime);
          endDate = new Date(appointment.endTime);
        }
      } else {
        // ISO string or other format
        startDate = new Date(appointment.startTime);
        endDate = new Date(appointment.endTime);
      }

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
      openCancelModal(id);
    } else if (btn.dataset.act === "change") {
      startScheduleFlow("change", id);
    }
  };
}

/* Schedule flow */
const scheduleStep1 = $("#scheduleStep1");
const viewAvailability = $("#view-availability");
const availabilityBackBtn = $("#availabilityBackBtn");
const daySlotsModal = $("#daySlotsModal");
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
  populateCalendar("patient", doctor);
});

availabilityBackBtn.addEventListener("click", () => {
  viewAvailability.classList.add("hidden");
  $("#view-appointments").classList.remove("hidden");
});

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
  });
});
