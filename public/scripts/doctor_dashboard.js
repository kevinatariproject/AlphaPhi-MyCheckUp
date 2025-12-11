import { db, auth } from "./firebase_config.js";
import { initializeCalendar } from "./calendar_populate.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { doc, getDoc, getDocs, collection, query, where, orderBy } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { departmentMap } from "./department_loader.js";

let UID = null;
let status = "active";

const $ = (q, ctx = document) => ctx.querySelector(q);
const $$ = (q, ctx = document) => Array.from(ctx.querySelectorAll(q));

const email = document.getElementById("email");
const lastLogin = document.getElementById("last-login");
const name = document.getElementById("name");
const creds = document.getElementById("credentials");
const specialty = document.getElementById("specialty");
const bio = document.getElementById("bio");
const location = document.getElementById("location");
const floor = document.getElementById("floor")

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

async function loadAppointments() {
  renderAppointments(null, true);

  const user = auth.currentUser;
  if (!user) {
    console.error("No logged-in user.");
    return;
  }

  const doctorId = user.uid;
  const now = new Date(); // current date/time

  // Get all appointments for this doctor
  //Selects appointment collection objects where it is this doctor, in the future, and order by the date
  const apptQuery = query(
    collection(db, "appointments"),
    where("doctorId", "==", doctorId),
    where("startTime",">=", now),
    orderBy("startTime", "asc")
  );

  const snapshot = await getDocs(apptQuery);

  // Fetch patient info for each appointment
  const appts = await Promise.all(
    snapshot.docs.map(async (docSnap) => {
      const data = docSnap.data();

      // --- Fetch patient data ---
      let patientName = "Unknown Patient";
      
      try {
        const patientRef = doc(db, "patients", data.patientId);
        const patientSnap = await getDoc(patientRef);

        if (patientSnap.exists()) {
          const p = patientSnap.data();
          patientName = `${p.firstName} ${p.lastName}`;
        }
      } catch (err) {
        console.error("Error fetching patient:", err);
      }

      return {
        id: docSnap.id,
        patientName,
        date: data.startTime.toDate().toLocaleDateString(),
        time: data.startTime.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        location: data.visitType,
      };
    })
  );

  renderAppointments(appts);
}

function renderAppointments(appts, isLoading = false) {
  const wrap = document.querySelector("#appt-list");
  wrap.innerHTML = "";

  if (isLoading) {
    wrap.innerHTML = `
      <div class="loading-appts">
        Loading appointment data…
      </div>
    `;
    return;
  }

  //No appointments 
  if (!appts || appts.length === 0) {
    wrap.innerHTML = `
      <div class="no-appts">
        No upcoming appointments
      </div>
    `;
    return;
  }

  //appointments 
  appts.forEach(a => {
    const card = document.createElement("div");
    card.className = "appt-card";

    card.innerHTML = `
      <div class="appt-left">${a.patientName}</div>
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
  await initializeCalendar("doctor", UID);
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

    try {
      const doctorData = await getDoc(doc(db, "doctors", UID));
      const doctorInfo = doctorData.data();
      
      email.textContent = doctorInfo?.email || "No Email Provided";
      lastLogin.textContent = user?.metadata?.lastSignInTime || "Last Login Unknown";
      name.textContent = doctorInfo?.firstName + ' ' + doctorInfo?.lastName;
      creds.textContent = doctorInfo.credentials || "No Credentials Listed";
      bio.textContent = doctorInfo.bio || "No Biography Available";

      const deptId = doctorInfo.departmentId;
      if (deptId && departmentMap[deptId]) {
        specialty.textContent = departmentMap[deptId].name;
        location.textContent = departmentMap[deptId].location;
      } else {
        specialty.textContent = "Unknown Department";
      }


      status = doctorData.data().status;
      if (status == "inactive") { // show notice if inactive
        const toolbarDiv = document.querySelector(".toolbar");
        const notice = document.createElement("p");
        notice.id = "notice";
        notice.innerHTML = `<b>Notice:</b> Your account is still being processed. If your schedule does not appear within the next 2 business days, please contact the administrator.`
        toolbarDiv.appendChild(notice);
      }
    } catch (error) {
      console.log(error);
    }
    loadAppointments();
    switchView("dashboard");
  });
});

