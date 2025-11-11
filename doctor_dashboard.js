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

/* Availability calendar (View Schedule) */

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const dow = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// Demo availability to match screenshot:
// Tuesdays: 7AM – 3PM, Thursdays: 8AM – 10PM for October 2025
const availabilitySlots = {};
(function seedAvailability() {
  const y = 2025;
  const m = 9; // October
  const days = new Date(y, m + 1, 0).getDate();
  for (let d = 1; d <= days; d++) {
    const date = new Date(y, m, d);
    const key = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(
      2,
      "0"
    )}`;
    if (date.getDay() === 2) {
      // Tuesday
      availabilitySlots[key] = ["7AM – 3PM"];
    }
    if (date.getDay() === 4) {
      // Thursday
      availabilitySlots[key] = ["8AM – 10PM"];
    }
  }
})();

let curYear = 2025;
let curMonth = 9; // October

function buildCalendar() {
  const cal = $("#calendar");
  const label = $("#monthLabel");
  cal.innerHTML = "";

  // header row
  dow.forEach((d) => {
    const h = document.createElement("div");
    h.className = "cal-dow";
    h.textContent = d;
    cal.appendChild(h);
  });

  const first = new Date(curYear, curMonth, 1);
  const startDow = first.getDay();
  const daysInMonth = new Date(curYear, curMonth + 1, 0).getDate();

  // leading muted cells
  for (let i = 0; i < startDow; i++) {
    const c = document.createElement("div");
    c.className = "cal-cell muted";
    cal.appendChild(c);
  }

  // days
  for (let day = 1; day <= daysInMonth; day++) {
    const c = document.createElement("div");
    c.className = "cal-cell";

    const dateEl = document.createElement("div");
    dateEl.className = "cal-date";
    dateEl.textContent = day;
    c.appendChild(dateEl);

    const key = `${curYear}-${String(curMonth + 1).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;
    const slots = availabilitySlots[key];
    if (slots) {
      slots.forEach((s) => {
        const el = document.createElement("div");
        el.className = "slot";
        el.textContent = s;
        c.appendChild(el);
      });
    }

    cal.appendChild(c);
  }

  // trailing muted cells
  const totalCells = cal.children.length;
  const remainder = totalCells % 7;
  if (remainder !== 0) {
    for (let i = 0; i < 7 - remainder; i++) {
      const c = document.createElement("div");
      c.className = "cal-cell muted";
      cal.appendChild(c);
    }
  }

  label.textContent = `${monthNames[curMonth]} ${curYear}`;
}

// month navigation
$("#prevMonth").addEventListener("click", () => {
  curMonth--;
  if (curMonth < 0) {
    curMonth = 11;
    curYear--;
  }
  buildCalendar();
});

$("#nextMonth").addEventListener("click", () => {
  curMonth++;
  if (curMonth > 11) {
    curMonth = 0;
    curYear++;
  }
  buildCalendar();
});

/* Init */

window.addEventListener("DOMContentLoaded", () => {
  renderAppointments();
  buildCalendar();
  switchView("dashboard");
});
