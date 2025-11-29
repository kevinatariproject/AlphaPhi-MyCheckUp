import { auth } from "./firebase_config.js";
import { populateCalendar } from "./calendar_populate.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

let UID = null;

const $ = (q, ctx = document) => ctx.querySelector(q);
const $$ = (q, ctx = document) => Array.from(ctx.querySelectorAll(q));

/* View switching */

function switchView(viewId) {
  $$(".nav-item").forEach((btn) =>
    btn.classList.toggle("active", btn.dataset.view === viewId)
  );
  $$(".view").forEach((v) =>
    v.classList.toggle("visible", v.id === `view-${viewId}`)
  );
}

$$(".nav-item").forEach((btn) => {
  btn.addEventListener("click", () => switchView(btn.dataset.view));
});

$$(".btn.back").forEach((btn) => {
  btn.addEventListener("click", () => switchView("dashboard"));
});

/* Upcoming appointments (matches mock layout) */

const appts = [
  {
    patient: "Patient Name",
    date: "October 10th, 2025",
    time: "1:00PM",
    location: "LOCATION",
  },
  {
    patient: "Patient Name",
    date: "November 12th, 2025",
    time: "3:00PM",
    location: "LOCATION",
  },
  {
    patient: "Patient Name",
    date: "November 12th, 2025",
    time: "8:00AM",
    location: "LOCATION",
  },
];

function renderAppointments() {
  const wrap = $("#appt-list");
  wrap.innerHTML = "";

  appts.forEach((a) => {
    const card = document.createElement("div");
    card.className = "appt-card";
    card.innerHTML = `
      <div class="appt-left">Patient Name</div>
      <div class="appt-right">
        <span class="date">${a.date}</span>
        <span class="time">${a.time}</span>
        <span class="loc">${a.location}</span>
      </div>
    `;
    wrap.appendChild(card);
  });
}

const scheduleTab = document.querySelector('.nav-item[data-view="schedule"]');
scheduleTab.addEventListener("click", async () => {
  await populateCalendar("doctor", UID);
});

window.addEventListener("DOMContentLoaded", () => {
  // Wait for Firebase Auth to initialize
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      console.warn("No user logged in - redirecting to login");
      // Redirect to login page or show login prompt
      window.location.href = "./practioner_login_page.html";
      return;
    }
    UID = user.uid;
    console.log("User authenticated:", UID);

    renderAppointments();
    switchView("dashboard");
  });
});
