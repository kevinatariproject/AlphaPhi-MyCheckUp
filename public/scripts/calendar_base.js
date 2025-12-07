// Builds the base calendar

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

function buildCalendar(today, pointerYear, pointerMonth) {
    const calendar = document.getElementById("calendar");
    const monthLabel = document.getElementById("monthLabel");

    // set month label for pointer month
    monthLabel.textContent = `${monthNames[pointerMonth]} ${pointerYear}`;
    // always have day of the week headers
    calendar.innerHTML = `
        <div class="cal-dow">Sunday</div>
        <div class="cal-dow">Monday</div>
        <div class="cal-dow">Tuesday</div>
        <div class="cal-dow">Wednesday</div>
        <div class="cal-dow">Thursday</div>
        <div class="cal-dow">Friday</div>
        <div class="cal-dow">Saturday</div>
    `;

    // get the date for today
    const todayDate = today.getDate();    
    // create Date object for first day of month
    const first = new Date(pointerYear, pointerMonth, 1);
    // day of week of 1st
    const startDow = first.getDay();
    // # of days in month
    const daysInMonth = new Date(pointerYear, pointerMonth + 1, 0).getDate();

    // leading muted cells
    for (let i = 0; i < startDow; i++) {
        const cell = document.createElement("div");
        cell.classList.add("cal-cell");
        cell.classList.add("muted");
        calendar.appendChild(cell);
    }

    // month's day cells
    for (let day = 1; day <= daysInMonth; day++) {
        // create cell
        const cell = document.createElement("div");
        cell.id = `day-${day}`;
        cell.classList.add("cal-cell");

        // add date number
        const dateNumber = document.createElement("div");
        dateNumber.classList.add("cal-date");
        dateNumber.textContent = day;

        // current day indicator, check for same day, month, and year
        if (day == todayDate &&
            pointerMonth == today.getMonth() &&
            pointerYear == today.getFullYear()
        ) {
            dateNumber.classList.add("today");
            cell.classList.add("today");
        }

        cell.appendChild(dateNumber);

        calendar.appendChild(cell);
    }

    // trailing muted cells
    const totalCells = calendar.children.length;
    const remainder = totalCells % 7;
    if (remainder !== 0) {
        for (let i = 0; i < 7 - remainder; i++) {
            const cell = document.createElement("div");
            cell.classList.add("cal-cell");
            cell.classList.add("muted");
            calendar.appendChild(cell);
        }
    }
}

export { buildCalendar };