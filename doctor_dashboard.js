// Simple view switching
const $ = (q, ctx=document) => ctx.querySelector(q);
const $$ = (q, ctx=document) => Array.from(ctx.querySelectorAll(q));

function switchView(viewId){
  $$('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.view===viewId));
  $$('.view').forEach(v => v.classList.toggle('visible', v.id===`view-${viewId}`));
}
$$('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => switchView(btn.dataset.view));
});
$$('.btn.back').forEach(b => b.addEventListener('click', () => switchView('dashboard')));

// Dashboard demo appointments
const appts = [
  { patient:'Patient Name', date:'October 10th, 2025', time:'1:00PM', location:'LOCATION' },
  { patient:'Patient Name', date:'November 12th, 2025', time:'3:00PM', location:'LOCATION' },
  { patient:'Patient Name', date:'November 12th, 2025', time:'8:00AM', location:'LOCATION' },
];
function renderAppointments(){
  const wrap = $('#appt-list');
  wrap.innerHTML = '';
  appts.forEach(a => {
    const card = document.createElement('div');
    card.className = 'appt-card';
    card.innerHTML = `
      <div class="appt-left"><strong>${a.patient}</strong></div>
      <div class="appt-right">
        <span class="date">${a.date}</span>
        <span class="time">${a.time}</span>
        <span class="loc">${a.location}</span>
      </div>`;
    wrap.appendChild(card);
  });
}

// Calendar utilities
const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const dow = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

function buildCalendar(container, labelEl, year, month, slotsMap){
  // Header row
  container.innerHTML = '';
  dow.forEach(d => {
    const h = document.createElement('div');
    h.className = 'cell dow';
    h.textContent = d;
    container.appendChild(h);
  });
  const first = new Date(year, month, 1);
  const startDow = first.getDay();
  const daysInMonth = new Date(year, month+1, 0).getDate();

  // Leading blanks as a shaded cell group
  for(let i=0;i<startDow;i++){
    const c = document.createElement('div'); c.className = 'cell muted'; container.appendChild(c);
  }
  // Month days
  for(let day=1; day<=daysInMonth; day++){
    const c = document.createElement('div'); c.className = 'cell';
    const dateEl = document.createElement('div'); dateEl.className='date'; dateEl.textContent = day; c.appendChild(dateEl);

    const key = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    if(slotsMap[key]){
      slotsMap[key].forEach(text => {
        const s = document.createElement('div');
        s.className = 'slot'; s.textContent = text;
        c.appendChild(s);
      });
    }
    container.appendChild(c);
  }

  // Trailing blanks to complete grid rows
  const cellsAfterHeader = container.children.length - 7;
  const remainder = cellsAfterHeader % 7;
  if(remainder !== 0){
    for(let i=0;i<7-remainder;i++){
      const c = document.createElement('div'); c.className = 'cell muted'; container.appendChild(c);
    }
  }

  labelEl.textContent = `${monthNames[month]} ${year}`;
}

// Demo data to match screenshots (October 2025)
const adminSlots = {
  // Thursday 2nd: 1PM - 3PM
  '2025-10-02': ['1PM - 3PM'],
  // Tuesday 7th: 7AM - 8AM and 9AM - 1PM
  '2025-10-07': ['7AM - 8AM','9AM - 1PM'],
  // Saturday 25th: 8AM - 9AM (approx last row)
  '2025-10-25': ['8AM - 9AM']
};

const availSlots = {
  // Thursdays multiple 8AM - 10PM
  '2025-10-02': ['8AM - 10PM'],
  '2025-10-09': ['8AM - 10PM'],
  '2025-10-16': ['8AM - 10PM'],
  '2025-10-23': ['8AM - 10PM'],
  '2025-10-30': ['8AM - 10PM'],
  // Tuesdays repeated 7AM - 3PM
  '2025-10-07': ['7AM - 3PM'],
  '2025-10-14': ['7AM - 3PM'],
  '2025-10-21': ['7AM - 3PM'],
  '2025-10-28': ['7AM - 3PM'],
};

function initCalendars(){
  const y = 2025, m = 9; // October is 9 (0-indexed)
  const adminCont = $('#calendarAdmin');
  const adminLabel = $('#monthLabel1');
  let ay = y, am = m;

  const availCont = $('#calendarAvail');
  const availLabel = $('#monthLabel2');
  let vy = y, vm = m;

  const renderAdmin = () => buildCalendar(adminCont, adminLabel, ay, am, adminSlots);
  const renderAvail = () => buildCalendar(availCont, availLabel, vy, vm, availSlots);
  renderAdmin(); renderAvail();

  $('#prevMonth1').onclick = () => { am--; if(am<0){am=11; ay--;} renderAdmin(); };
  $('#nextMonth1').onclick = () => { am++; if(am>11){am=0; ay++;} renderAdmin(); };
  $('#prevMonth2').onclick = () => { vm--; if(vm<0){vm=11; vy--;} renderAvail(); };
  $('#nextMonth2').onclick = () => { vm++; if(vm>11){vm=0; vy++;} renderAvail(); };

  // Simple doctor search echoes into heading
  $('#doctorSearch').addEventListener('input', (e) => {
    $('#doctorName').textContent = e.target.value || 'DoctorName';
  });
}

window.addEventListener('DOMContentLoaded', () => {
  renderAppointments();
  initCalendars();
});
