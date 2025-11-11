// MyCheckUp Admin UI — minimal interactivity
const $ = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

// Route switching
$$('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.nav-item').forEach(b => b.classList.toggle('active', b === btn));
    const target = btn.getAttribute('data-target');
    $$('.view').forEach(v => v.classList.toggle('show', v.id === target));
  });
});

// Seed demo data
const appts = [
  { title: 'Patient Name with\nDoctor Name\nSpecialty', when: 'October 10th, 2025\n1:00PM', loc:'LOCATION' },
  { title: 'Patient Name with\nDoctor Name\nSpecialty', when: 'November 12th, 2025\n3:00PM', loc:'LOCATION' },
  { title: 'Patient Name with\nDoctor Name\nSpecialty', when: 'November 12th, 2025\n8:00AM', loc:'LOCATION' },
];
const reports = [
  { title:'Document Title', when:'October 10th, 2025\n1:00PM' },
  { title:'Document Title', when:'September 20th, 2025\n10:40PM' },
  { title:'Document Title', when:'September 2nd, 2025\n7:34 AM' },
];

function renderPills(list, targetUl){
  targetUl.innerHTML = list.map(item => `
    <li>
      <div class="title">${item.title.replaceAll('\n', '<br>')}</div>
      <div class="meta">${item.when.replaceAll('\n', '<br>')}<br><span class="muted">${item.loc ?? ''}</span></div>
    </li>
  `).join('');
}
renderPills(appts, $('#apptList'));
renderPills(reports, $('#reportList'));

// Quick action demos
$$('.action').forEach(card => {
  card.addEventListener('click', () => {
    const action = card.dataset.action || card.id;
    if (action === 'btnGenerate' || card.id === 'btnGenerate') {
      openGenerate('System Summary Report');
    } else if (action === 'btnDeleteReports' || card.id === 'btnDeleteReports') {
      openSmall('Delete Reports', 'This will remove selected reports (demo).');
    } else {
      openSmall('Filter', 'Demo for: ' + (action || 'action'));
    }
  });
});

// Manage Account cards -> demo modal
$$('[data-modal]').forEach(card => {
  card.addEventListener('click', () => {
    const key = card.getAttribute('data-modal');
    openSmall('Action', 'You clicked ' + key.replace(/([A-Z])/g, ' $1'));
  });
});

// Generate modal behaviour
const genModal = $('#generateModal');
const cancelBtn = $('#cancelGenerate');
let genTimer;

function openGenerate(name){
  $('#reportName').textContent = name;
  genModal.classList.remove('hidden');
  clearTimeout(genTimer);
  // Close after delay and push a new "generated" item
  genTimer = setTimeout(() => {
    genModal.classList.add('hidden');
    // unshift a mock report
    reports.unshift({ title: name, when: new Date().toLocaleString('en-US', {
      month:'long', day:'numeric', year:'numeric', hour:'numeric', minute:'2-digit'
    }).replace(',', '') });
    renderPills(reports, $('#reportList'));
    openSmall('Report Ready', name + ' has been generated.');
  }, 2500);
}
cancelBtn.addEventListener('click', () => {
  clearTimeout(genTimer);
  genModal.classList.add('hidden');
});

// Small modal
const small = $('#smallModal');
$('#okSmall').addEventListener('click', ()=> small.classList.add('hidden'));
function openSmall(title, body){
  $('#smallTitle').textContent = title;
  $('#smallBody').textContent = body;
  small.classList.remove('hidden');
}

// Mobile: toggle sidebar
const menuBtn = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
if (menuBtn && sidebar){
  menuBtn.addEventListener('click', () => {
    const open = sidebar.classList.toggle('open');
    document.body.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
  });
}
// Close sidebar when clicking a nav item on mobile
$$('.nav-item').forEach(btn => btn.addEventListener('click', () => {
  if (window.matchMedia('(max-width: 980px)').matches){
    sidebar.classList.remove('open');
    document.body.classList.remove('menu-open');
    menuBtn.setAttribute('aria-expanded', 'false');
  }
}));
