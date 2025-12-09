import { db, auth } from "./firebase_config.js";
import { doc, getDoc, Timestamp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { getUserAppointments, cancelAppointment, createAppointment, updateAppointment, getAvailableTimeSlots, parseAppointmentDate } from './appt_scheduling.js';
import { openModal, closeModal } from "./modal_controls.js";
import { initializeCalendar } from "./calendar_populate.js";
import { departmentMap } from "./department_loader.js";

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

const visitCodes = {
    "new_patient": "New Patient Visit",
    "consultation": "Consultation",
    "routine_exam": "Routine/Annual Exam",
    "follow_up": "Follow-Up Visit",
    "non_urgent": "Non-Urgent Concern",
    "ongoing_care": "Ongoing Care Management",
    "other": "Other"
};

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
      // Parse the startTime and endTime
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

      const formattedVisitType = (visitCodes[appointment.visitType] || 'Other');
      const formattedLocation = formatPascalCase(departmentMap[appointment.departmentId].location || 'Location to be determined');

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

  appointmentsList.onclick = async (e) => {
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

/* Schedule flow */
const scheduleStep1 = $("#scheduleStep1");
const viewAvailability = $("#view-availability");
const availabilityBackBtn = $("#availabilityBackBtn");
const daySlotsModal = $("#daySlotsModal");
const confirmModal = $("#confirmModal");
const confirmText = $("#confirmText");
const bookAppointmentBtns = document.getElementById("modal-action-1");
const defautlBtn = document.getElementById("modal-action-2");
const confirmationMessage = document.getElementById("confirmation-popup");
const textPreview = document.getElementById("text-preview");
const bookButton = document.getElementById("book-button");

let scheduleCtx = {
  mode: "new",
  apptId: null,
  role: "patient",
  UID: null,
  PID: null,
  purpose: "",
  doctor: "",
  doctorName: ""
};

$("#tileCreateAppt").addEventListener("click", () => startScheduleFlow("new"));

$("#tileModifyAppt").addEventListener("click", () => {
  alert("Use the Change button on a specific appointment to reschedule.");
});

async function startScheduleFlow(mode, apptId = null) {
  scheduleCtx.mode = mode;
  scheduleCtx.apptId = apptId;

  if (mode === "new") {
    $("#visitPurpose").value = "";
    $("#visitDoctor").value = "";
    $("#selectedDoctorId").value = "";
    
    openModal(scheduleStep1);
  } else if (mode === "change") { // skip step 1
    // get the appt that matches given id
    const appt = allScheduledAppts.find(a => a.id === apptId);
    // fill in scheduleCtx fields
    scheduleCtx.purpose = appt.visitType;
    scheduleCtx.doctor = appt.doctorId;
    scheduleCtx.doctorName = appt.doctorName;

    // go straight to calendar for appt's doctor
    $("#view-appointments").classList.add("hidden");
    viewAvailability.classList.remove("hidden");

    await initializeCalendar(scheduleCtx.role, scheduleCtx.doctor,scheduleCtx.doctorName);
  }
}

$("#s1NextBtn").addEventListener("click", async () => {
  const purpose = $("#visitPurpose").value;
  const doctorName = $("#visitDoctor").value;
  const doctor = $("#selectedDoctorId").value;
  if (!purpose || !doctor) {
    alert("Please select both purpose and doctor.");
    return;
  }
  scheduleCtx.purpose = purpose;
  scheduleCtx.doctor = doctor;
  scheduleCtx.doctorName = doctorName;

  closeModal(scheduleStep1);
  $("#view-appointments").classList.add("hidden");
  viewAvailability.classList.remove("hidden");

  await initializeCalendar(scheduleCtx.role, doctor, scheduleCtx.doctorName);
  // console.log(scheduleCtx);
});

availabilityBackBtn.addEventListener("click", () => {
  viewAvailability.classList.add("hidden");
  $("#view-appointments").classList.remove("hidden");
});

async function confirmSlot(startTime, endTime, niceDate, niceTime) {
  closeModal(daySlotsModal);
  viewAvailability.classList.add("hidden");
  $("#view-appointments").classList.remove("hidden");

  const start = Timestamp.fromDate(startTime);
  const end = Timestamp.fromDate(endTime);

  if (scheduleCtx.mode === "change" && scheduleCtx.apptId) {
    await updateAppointment(scheduleCtx.apptId, start, end, scheduleCtx.UID, scheduleCtx.PID, scheduleCtx.doctor, "rescheduled", scheduleCtx.purpose);
    confirmText.textContent = `Your appointment has been updated to ${niceDate} at ${niceTime}.`;
  } else if (scheduleCtx.mode === "new") {
    await createAppointment(start, end, scheduleCtx.UID, scheduleCtx.PID, scheduleCtx.doctor, "scheduled", scheduleCtx.purpose);
    confirmText.textContent = `Your appointment with ${scheduleCtx.doctorName} is scheduled for ${niceDate} at ${niceTime}.`;
  }

  renderAppointments(scheduleCtx.PID);
  openModal(confirmModal);
}

// wrapper to create handler for confirmation button
function createHandler(startTime, endTime, niceDate, niceTime) {
  return async function handler() {
    await confirmSlot(startTime, endTime, niceDate, niceTime);
  };
}

// shows confirmation step to appointment scheduling
export function confirmSlotMessage(btn, startTime, endTime, niceDate, niceTime) {
  // hide confirmation message
  confirmationMessage.style.display = "none";
  bookAppointmentBtns.style.display = "none";
  defautlBtn.style.display = "flex";

  // change selected slot indicator
  document.querySelectorAll(".slot-btn.selected")
  .forEach(b => b.classList.remove("selected"));

  btn.classList.add("selected");

  textPreview.textContent = `${scheduleCtx.doctorName} on ${niceDate} at ${niceTime}.`;

  // display confirmation message
  confirmationMessage.style.display = "flex";
  bookAppointmentBtns.style.display = "flex";
  defautlBtn.style.display = "none";

  // if confirmation button already has a handler, remove
  if (bookButton._handler) {
    bookButton.removeEventListener("click", bookButton._handler);
  }

  // create new handler and add to button
  const handler = createHandler(startTime, endTime, niceDate, niceTime);
  bookButton._handler = handler;

  bookButton.addEventListener("click", handler);
}

daySlotsModal.querySelectorAll("[data-close-modal]").forEach(btn => {
  btn.addEventListener("click", () => {
    confirmationMessage.style.display = "none";
    bookAppointmentBtns.style.display = "none";
    defautlBtn.style.display = "flex";
  });
});

/* Cancel flow */
const cancelSelect = $("#cancelSelectedAppt");
const cancelAppt = $("#cancelApptModal");
const confirmCancelBtn = $("#confirmCancelBtn");

function openCancelSlctdApptModal(preselectId) {
  // Clear the dropdown first to prevent duplicates
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

$("#tileCancelAppt").addEventListener("click", () => openCancelSlctdApptModal());

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

async function loadAccountDetails(patientID, userID) {
  // Check if the user is the guardian or patient
  const patientSection = $("#PatientSection");
  const patientDetails = await fetchPatientDetails(patientID);
  if (patientID === userID) {
    // The user is the patient
      // Show Patient Information section for guardians
      if (patientSection) {
        patientSection.classList.add("hidden");
      }
    // Update account details with patient info
    if (patientDetails) {
      document.getElementById("accountEmail").textContent = patientDetails.email || "N/A";
      document.getElementById("accountName").textContent = `${patientDetails.firstName || ''} ${patientDetails.lastName || ''}`.trim() || "N/A";
      document.getElementById("accountDOB").textContent = patientDetails.dateOfBirth || "N/A";
      document.getElementById("accountAddress").textContent = patientDetails.address || "N/A";      
    }
  }
  else {
    // The user is a guardian
    // Fetch and display guardian details as account info  
    const guardianDetails = await fetchGuardianDetails(userID);
    if (guardianDetails) {
      document.getElementById("accountEmail").textContent = guardianDetails.email || "N/A";
      document.getElementById("accountName").textContent = `${guardianDetails.firstName || ''} ${guardianDetails.lastName || ''}`.trim() || "N/A";
      document.getElementById("accountDOB").textContent = guardianDetails.dateOfBirth || "N/A";
      document.getElementById("accountAddress").textContent = guardianDetails.address || "N/A";      
    }


    if (patientDetails) {
      // Show Patient Information section for guardians
      if (patientSection) {
        patientSection.classList.remove("hidden");
      }
      // Populate patient details
      document.getElementById("patientName").textContent = `${patientDetails.firstName || ''} ${patientDetails.lastName || ''}`.trim() || "N/A";
      document.getElementById("patientDOB").textContent = patientDetails.dateOfBirth || "N/A";
      document.getElementById("patientAddress").textContent = patientDetails.address || "N/A";
    }
    else {
      // Hide Patient Information section if no patient details found
      if (patientSection) {
        patientSection.classList.add("hidden");
      }
    }
  }
}

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
    scheduleCtx.UID = user.uid;
    console.log("User authenticated:", user.uid);
    
    // check if guardian
    try {
      const guardianData = await getDoc(doc(db, "guardians", scheduleCtx.UID));
      if (guardianData.exists()) {
        scheduleCtx.role = "guardian";
        scheduleCtx.PID = guardianData.data().patientId;
        const patientData = await getDoc(doc(db, "patients", scheduleCtx.PID));
      } else {
        scheduleCtx.PID = scheduleCtx.UID;
      }
    } catch (error) {
      scheduleCtx.PID = scheduleCtx.UID;
      console.log(error);
    }

    showView("appointments");
    await renderAppointments(scheduleCtx.PID);
    await loadAccountDetails(scheduleCtx.PID, scheduleCtx.UID);
  });
});
