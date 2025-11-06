/* Demo data */
      const demoAppointments = [
        {
          id: "a1",
          doctor: "Dr. Jane Doe, MD",
          specialty: "Specialty",
          when: "----",
          time: "----",
          location: "LOCATION",
        },
        {
          id: "a2",
          doctor: "Dr. Jane Doe, MD",
          specialty: "Specialty",
          when: "----",
          time: "-----",
          location: "LOCATION",
        },
        {
          id: "a3",
          doctor: "Dr. Jon Doe, MD",
          specialty: "Specialty",
          when: "----",
          time: "---",
          location: "LOCATION",
        },
      ];
      const slotsByDate = () => [
        "8:00 AM",
        "9:30 AM",
        "11:00 AM",
        "1:00 PM",
        "3:00 PM",
      ];
      const $ = (q) => document.querySelector(q);

      /* Drawer (mobile)  */
      const drawer = $("#drawer"),
        scrim = $("#scrim"),
        btnOpen = $("#openDrawer");
      const openDrawer = () => {
        document.body.classList.add("drawer-open");
        drawer.hidden = false;
        scrim.hidden = false;
        btnOpen.setAttribute("aria-expanded", "true");
        drawer.querySelector(".nav-item").focus();
      };
      const closeDrawer = () => {
        document.body.classList.remove("drawer-open");
        drawer.hidden = true;
        scrim.hidden = true;
        btnOpen.setAttribute("aria-expanded", "false");
        btnOpen.focus();
      };
      btnOpen.addEventListener("click", () => {
        (drawer.hidden ? openDrawer : closeDrawer)();
      });
      scrim.addEventListener("click", closeDrawer);
      window.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !drawer.hidden) closeDrawer();
      });

      /* Appointments */
      function renderAppointments() {
        const wrap = $("#appointments");
        wrap.innerHTML = "";
        demoAppointments.forEach((a) => {
          const card = document.createElement("article");
          card.className = "card";
          card.setAttribute("role", "listitem");
          card.innerHTML = `
          <div class="meta">
            <div class="title">${a.doctor}</div>
            <div class="sub">${a.specialty}</div>
          </div>
          <div class="right">
            <div class="when">${a.when}</div>
            <div class="sub">${a.time}</div>
            <div class="sub">${a.location}</div>
            <div class="actions-inline">
              <button class="secondary" data-id="${a.id}" data-action="reschedule">Reschedule</button>
              <button class="danger" data-id="${a.id}" data-action="cancel">Cancel</button>
            </div>
          </div>`;
          wrap.appendChild(card);
        });

        // delegate clicks
        wrap.onclick = (e) => {
          const btn = e.target.closest("button");
          if (!btn) return;
          const id = btn.dataset.id,
            appt = demoAppointments.find((x) => x.id === id);
          if (btn.dataset.action === "cancel") {
            if (confirm("Cancel this appointment?")) {
              const i = demoAppointments.findIndex((x) => x.id === id);
              demoAppointments.splice(i, 1);
              renderAppointments();
            }
          }
          if (btn.dataset.action === "reschedule") {
            openDialog("Reschedule Appointment", appt);
          }
        };
      }

      /* Dialog  */
      function openDialog(title, appt = null) {
        $("#dialogTitle").textContent = title;
        const dlg = $("#scheduleDialog");
        $("#providerSelect").value = appt?.doctor || "Dr. Jane Doe, MD";
        $("#dateInput").value = "";
        $(
          "#slotSelect"
        ).innerHTML = `<option value="">Choose a date first</option>`;
        dlg.showModal();
        dlg.addEventListener("close", () => $("#scheduleForm").reset(), {
          once: true,
        });
      }

      /*  Events  */
      window.addEventListener("DOMContentLoaded", () => {
        $("#tileSchedule").onclick = () => openDialog("Schedule Appointment");
        $("#tileCancel").onclick = () =>
          alert("Pick an appointment below and click Cancel.");
        $("#tileChange").onclick = () =>
          alert("Pick an appointment below and click Reschedule.");

        $("#dateInput").addEventListener("change", (e) => {
          const slots = slotsByDate(e.target.value);
          $("#slotSelect").innerHTML =
            `<option value="">Select a time</option>` +
            slots.map((s) => `<option>${s}</option>`).join("");
        });

        $("#submitSchedule").addEventListener("click", (e) => {
          if (
            !$("#providerSelect").value ||
            !$("#dateInput").value ||
            !$("#slotSelect").value
          ) {
            e.preventDefault();
            alert("Please complete all fields.");
            return;
          }
          $("#scheduleDialog").close();
          alert("Saved. (Demo only)");
        });

        renderAppointments();
      });
