// Populates the calendar with either:
// [Patient/Guardian] Available appointment time slots
// [Doctor] Scheduled appointments

import { buildCalendar } from "./calendar_base.js";
import { getMonthAppts, getDoctorSchedule } from "./calendar_fetch.js";
import { openModal } from "./modal_controls.js";

const dayCodes = [
    "Su",
    "M",
    "Tu",
    "W",
    "Th",
    "F",
    "Sa"
];

// global variables
let today = new Date();
let pointerYear = today.getFullYear();
let pointerMonth = today.getMonth();

let role = null;
let DID = null;
let monthData = {};

const bookAppointmentBtns = document.getElementById("modal-action-1");
const defautlBtn = document.getElementById("modal-action-2");
const confirmationMessage = document.getElementById("confirmation-popup");
const textPreview = document.getElementById("text-preview");
const bookButton = document.getElementById("book-button");

// renders the selected day's schedule
function openDaySchedule(userType, day) {
    const slotsDateLabel = document.getElementById("slotsDateLabel");
    const daySlotsList = document.getElementById("daySlotsList");
                
    confirmationMessage.style.display = "none";
    bookAppointmentBtns.style.display = "none";
    defautlBtn.style.display = "flex";
    
    // create Date object for selected day
    const date = new Date(pointerYear, pointerMonth, day);
    // spelled out date
    const nice = date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
    });

    slotsDateLabel.textContent = nice;
    daySlotsList.innerHTML = "";

    // get the day's slots
    const daySlots = monthData[day];

    // create button for each slot
    daySlots.forEach(slot => {
        const slotDate = slot.startTime;
        // convert start time to 12-hour format
        const stdTime = slotDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });

        const btn = document.createElement("button");
        btn.textContent = stdTime;
        btn.classList.add("slot-btn"); // <-- add this class

        if (userType == "patient" || userType == "guardian") {
            btn.addEventListener("click", async () => {

                document.querySelectorAll(".slot-btn.selected")
                .forEach(b => b.classList.remove("selected"));

                btn.classList.add("selected");

                // dynamic import of confirm slot function and potetnial appointment information
                const { confirmSlot, confirmSlotLabel } = await import("./user_dashboard.js");
                textPreview.textContent = confirmSlotLabel(slot.startTime, slot.endTime, nice, stdTime);

                confirmationMessage.style.display = "flex";
                bookAppointmentBtns.style.display = "flex";
                defautlBtn.style.display = "none";

            });
            
            bookButton.addEventListener("click", async() => {
                const { confirmSlot } = await import("./user_dashboard.js");
                confirmSlot(slot.startTime, slot.endTime, nice, stdTime);
            })

        }
        daySlotsList.appendChild(btn);
    });

    openModal(daySlotsModal);
}

// helper function to parse string "hour:minute" and given day into Date object
function parseTime(date, timeString) {
    const [h, m] = timeString.split(":");
    const time = new Date(date);
    time.setHours(h, m, 0);
    return time;
}

// [Patient/Guardian] generate all the available time slots for the month
function buildSlots(year, month, docSchedule, blockList) {
    const availableSlots = {};
    const initialList = [];

    // get the number of days in the month
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // iterate through each day
    for (let day = 1; day <= daysInMonth; day++) {
        const pointerDay = new Date(year, month, day);
        // get the day of the week from dayCodes array
        const pointerDayCode = dayCodes[pointerDay.getDay()];

        // if the day is in the doctor's schedule
        if (docSchedule[pointerDayCode]) {
            // create key in map
            availableSlots[day] = [];

            // if future day (no same-day appointments)
            if (pointerDay > today) {
                // process each time chunk of the day
                docSchedule[pointerDayCode].forEach(chunk => {
                    let timePointer = parseTime(pointerDay, chunk["start"]);
                    const end = parseTime(pointerDay, chunk["end"]);

                    // divide chunk into 30 min slots
                    while (timePointer < end) {
                        const next = new Date(timePointer.getTime() + 30*60*1000); // add 30 min
                        // push onto initial list of slots
                        initialList.push({ startTime: new Date(timePointer), endTime: next });
                        timePointer = next;
                    }
                });
            }
        }
    }
    // filter out all slots that are blocked
    const filteredList = initialList.filter(slot => {
        return !blockList.some(block =>
            slot.startTime < block.endTime.toDate() && slot.endTime > block.startTime.toDate()
        );
    });

    // assign each slot to its day
    filteredList.forEach(slot => {
        const day = slot.startTime.getDate();
        availableSlots[day].push(slot);
    })

    // console.log(availableSlots);
    return availableSlots;
}

// [Doctor] organize the month's appointments by day
function buildAppointments(appointmentList) {
    const scheduledAppts = {};

    // assign each appointment to its day
    appointmentList.forEach(appt => {
        // replace Firestore Timestamps with equivalent Date object
        appt.startTime = appt.startTime.toDate();
        appt.endTime = appt.endTime.toDate();

        const day = appt.startTime.getDate();
        // if not already there, create entry for the day
        if (!scheduledAppts[day]) scheduledAppts[day] = [];
        scheduledAppts[day].push(appt);
    })

    // console.log(scheduledAppts);
    return scheduledAppts;
}

async function populateCalendar(userType, doctorId) {
    // render base calendar
    buildCalendar(today, pointerYear, pointerMonth);

    if (userType == "patient" || userType == "guardian") {
        // get selected doctor's schedule and blocks for the month
        let [docSchedule, blockList] = await getDoctorSchedule(doctorId, pointerYear, pointerMonth);
        // build structure of available slots
        monthData = buildSlots(pointerYear, pointerMonth, docSchedule, blockList);
    } else if (userType == "doctor") {
        // get doctor's appointments for the month
        let appointmentList = await getMonthAppts(doctorId, pointerYear, pointerMonth);
        // build structure of appointments
        monthData = buildAppointments(appointmentList);
    }
    
    // fill calendar with appointment indicators
    for (const [day, slotList] of Object.entries(monthData)) {
        // get cell of day from document
        const dayCell = document.getElementById(`day-${day}`);
        
        // create view appointments button for each day that has slots/appts
        const viewAppts = document.createElement("div");
        viewAppts.id = `view-${day}`;
        viewAppts.classList.add("slot");
        
        if (userType == "patient" || userType == "guardian") {
            // check if there are slots available
            if (slotList.length > 0) {
                viewAppts.textContent = "Appointments Available";
                viewAppts.addEventListener("click", () => openDaySchedule(userType, day));
            } else {
                viewAppts.classList.add("unavailable");
                viewAppts.textContent = "No Available Appointments";
            }
        } else if (userType == "doctor") {
            viewAppts.textContent = "View Appointments";
            viewAppts.addEventListener("click", () => openDaySchedule(userType, day));
        }

        dayCell.appendChild(viewAppts);
    }
}

// changes the month to current month
async function todayMonth() {
    // update today
    today = new Date();
    // assign today values to pointers
    pointerYear = today.getFullYear();
    pointerMonth = today.getMonth();
    // render UI
    populateCalendar(role, DID);
}

// changes the month by the indicated difference
async function changeMonth(monthDiff) {
    // update today
    today = new Date();
    // get new month by adding difference to month
    const newMonth = new Date(pointerYear, pointerMonth + monthDiff, 1);
    // assign resulting values to pointers
    pointerYear = newMonth.getFullYear();
    pointerMonth = newMonth.getMonth();
    // render UI
    populateCalendar(role, DID);
}

async function initializeCalendar(userType, doctorId) {
    // set global variables
    role = userType;
    DID = doctorId;

    // set to today
    todayMonth();
}

// month navigation
const prevMonth = document.getElementById("prevMonth");
const nextMonth = document.getElementById("nextMonth");
const todayBtn = document.getElementById("todayBtn");

prevMonth.addEventListener("click", () => {
    changeMonth(-1);
});

nextMonth.addEventListener("click", () => {
    changeMonth(1);
});

// return to today
todayBtn.addEventListener("click", () => {
    todayMonth();
});

export { initializeCalendar };