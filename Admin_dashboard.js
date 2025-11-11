// MyCheckUp Admin UI interactivity
const $ = (s, ctx = document) => ctx.querySelector(s);
const $$ = (s, ctx = document) => Array.from(ctx.querySelectorAll(s));

/* Nav: switch views */
$$(".nav-item").forEach((btn) => {
  btn.addEventListener("click", () => {
    $$(".nav-item").forEach((b) => b.classList.toggle("active", b === btn));
    const target = btn.dataset.target;
    $$(".view").forEach((v) => v.classList.toggle("show", v.id === target));
  });
});

/* Seed demo data */
const appts = [
  {
    title: "Patient Name with\nDoctor Name\nSpecialty",
    when: "October 10th, 2025\n1:00PM",
    loc: "LOCATION",
  },
  {
    title: "Patient Name with\nDoctor Name\nSpecialty",
    when: "November 12th, 2025\n3:00PM",
    loc: "LOCATION",
  },
  {
    title: "Patient Name with\nDoctor Name\nSpecialty",
    when: "November 12th, 2025\n8:00AM",
    loc: "LOCATION",
  },
];

const reports = [
  { title: "Document Title", when: "October 10th, 2025\n1:00PM" },
  { title: "Document Title", when: "September 20th, 2025\n10:40PM" },
  { title: "Document Title", when: "September 2nd, 2025\n7:34 AM" },
];

function renderPills(items, ul) {
  ul.innerHTML = items
    .map(
      (item) => `
      <li>
        <div class="title">${item.title.replaceAll("\n", "<br>")}</div>
        <div class="meta">
          ${item.when.replaceAll("\n", "<br>")}
          ${item.loc ? `<br><span class="muted">${item.loc}</span>` : ""}
        </div>
      </li>`
    )
    .join("");
}

renderPills(appts, $("#apptList"));
renderPills(reports, $("#reportList"));

/* Quick action tiles */
$$(".action").forEach((card) => {
  card.addEventListener("click", () => {
    const action = card.dataset.action || card.id;
    if (
      action === "viewByPatient" ||
      action === "viewByDoctor" ||
      action === "viewAll"
    ) {
      openSmall("Filter", `Demo: ${action.replace(/([A-Z])/g, " $1")}`);
    } else if (card.id === "btnGenerate") {
      openGenerate("System Summary Report");
    } else if (card.id === "btnDeleteReports") {
      openSmall("Delete Reports", "This will remove selected reports (demo).");
    }
  });
});

/* Manage account tiles (demo modals) */
$$("[data-modal]").forEach((card) => {
  card.addEventListener("click", () => {
    const key = card.dataset.modal;
    openSmall("Action", `You clicked ${key.replace(/([A-Z])/g, " $1")}`);
  });
});

/* Generate report modal */
const genModal = $("#generateModal");
const cancelGenerate = $("#cancelGenerate");
let genTimer;

function openGenerate(name) {
  $("#reportName").textContent = name;
  genModal.classList.remove("hidden");

  clearTimeout(genTimer);
  genTimer = setTimeout(() => {
    genModal.classList.add("hidden");
    reports.unshift({
      title: name,
      when: new Date()
        .toLocaleString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })
        .replace(",", ""),
    });
    renderPills(reports, $("#reportList"));
    openSmall("Report Ready", `${name} has been generated.`);
  }, 2500);
}

cancelGenerate.addEventListener("click", () => {
  clearTimeout(genTimer);
  genModal.classList.add("hidden");
});

/* Small confirmation/info modal */
const smallModal = $("#smallModal");
$("#okSmall").addEventListener("click", () =>
  smallModal.classList.add("hidden")
);

function openSmall(title, body) {
  $("#smallTitle").textContent = title;
  $("#smallBody").textContent = body;
  smallModal.classList.remove("hidden");
}

/* Mobile sidebar toggle */
const menuToggle = $("#menuToggle");
const sidebar = $("#sidebar");

if (menuToggle && sidebar) {
  menuToggle.addEventListener("click", () => {
    const open = sidebar.classList.toggle("open");
    document.body.classList.toggle("menu-open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
  });
}

/* Close sidebar on nav click (mobile) */
$$(".nav-item").forEach((btn) =>
  btn.addEventListener("click", () => {
    if (window.matchMedia("(max-width: 980px)").matches) {
      sidebar.classList.remove("open");
      document.body.classList.remove("menu-open");
      menuToggle.setAttribute("aria-expanded", "false");
    }
  })
);
