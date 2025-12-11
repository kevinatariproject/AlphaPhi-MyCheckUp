// Report generation logic for Admin Dashboard

import { db } from "./firebase_config.js";
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc 
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { parseAppointmentDate } from "./appt_scheduling.js";

/**
 * Fetch all appointments from Firebase
 * @returns {Promise<Array>} Array of appointment documents
 */
export async function getAllAppointments() {
  try {
    const appointmentsRef = collection(db, "appointments");
    const snapshot = await getDocs(appointmentsRef);
    
    const appointments = [];
    snapshot.forEach((doc) => {
      appointments.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return appointments;
  } catch (error) {
    console.error("Error fetching appointments:", error);
    throw error;
  }
}

/**
 * Enrich appointment data with patient and doctor information
 * @param {Array} appointments - Array of appointment objects
 * @returns {Promise<Array>} Array of enriched appointment data
 */
export async function enrichAppointmentData(appointments) {
  const enrichedData = [];
  
  for (const appointment of appointments) {
    try {
      // Fetch patient data
      let patientData = null;
      if (appointment.patientId) {
        const patientDoc = await getDoc(doc(db, "patients", appointment.patientId));
        if (patientDoc.exists()) {
          patientData = patientDoc.data();
        }
      }
      
      // Fetch doctor data
      let doctorData = null;
      if (appointment.doctorId) {
        const doctorDoc = await getDoc(doc(db, "doctors", appointment.doctorId));
        if (doctorDoc.exists()) {
          doctorData = doctorDoc.data();
        }
      }
      
      // Fetch guardian data if patient has guardians
      let guardianName = "";
      let guardianEmail = "";
      
      if (appointment.patientId) {
        try {
          const guardiansRef = collection(db, "patients", appointment.patientId, "guardians");
          const guardiansSnapshot = await getDocs(guardiansRef);
          
          if (!guardiansSnapshot.empty) {
            // Get the first guardian
            const guardianId = guardiansSnapshot.docs[0].id;
            const guardianDoc = await getDoc(doc(db, "guardians", guardianId));
            
            if (guardianDoc.exists()) {
              const guardianData = guardianDoc.data();
              guardianName = `${guardianData.firstName || ""} ${guardianData.lastName || ""}`.trim();
              guardianEmail = guardianData.email || "";
            }
          }
        } catch (guardianError) {
          console.error(`Error fetching guardian for patient ${appointment.patientId}:`, guardianError);
        }
      }
      
      // Parse and format the appointment date and time
      let formattedDate = "";
      let formattedTime = "";
      
      if (appointment.startTime) {
        const startDate = parseAppointmentDate(appointment.startTime);
        
        // Format date as MM/DD/YYYY
        formattedDate = startDate.toLocaleDateString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "numeric"
        });
        
        // Format time as HH:MM AM/PM
        formattedTime = startDate.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true
        });
      }
      
      // Format the enriched appointment data
      enrichedData.push({
        appointment_id: appointment.id,
        appointment_date: formattedDate,
        appointment_time: formattedTime,
        patient_id: appointment.patientId || "",
        patient_name: patientData 
          ? `${patientData.firstName || ""} ${patientData.lastName || ""}`.trim()
          : "Unknown",
        patient_email: patientData?.email || "",
        guardian_name: guardianName,
        guardian_email: guardianEmail,
        doctor_id: appointment.doctorId || "",
        doctor_name: doctorData 
          ? `${doctorData.firstName || ""} ${doctorData.lastName || ""}`.trim()
          : "Unknown",
        doctor_credentials: doctorData?.credentials || "",
        appointment_type: appointment.visitType || "",
        appointment_status: appointment.status || "",
      });
    } catch (error) {
      console.error(`Error enriching appointment ${appointment.id}:`, error);
      // Add appointment with basic info even if enrichment fails
      
      // Try to parse date/time even on error
      let formattedDate = "";
      let formattedTime = "";
      
      try {
        if (appointment.startTime) {
          const startDate = parseAppointmentDate(appointment.startTime);
          formattedDate = startDate.toLocaleDateString("en-US", {
            month: "2-digit",
            day: "2-digit",
            year: "numeric"
          });
          formattedTime = startDate.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true
          });
        }
      } catch (dateError) {
        console.error("Error parsing date:", dateError);
      }
      
      enrichedData.push({
        appointment_id: appointment.id,
        appointment_date: formattedDate,
        appointment_time: formattedTime,
        patient_id: appointment.patientId || "",
        patient_name: "Error loading",
        patient_email: "",
        guardian_name: "",
        guardian_email: "",
        doctor_id: appointment.doctorId || "",
        doctor_name: "Error loading",
        doctor_credentials: "",
        appointment_type: appointment.visitType || "",
        appointment_status: appointment.status || "",
      });
    }
  }
  
  return enrichedData;
}

/**
 * Initialize filter dropdowns with data from appointments
 * @param {HTMLSelectElement} doctorFilter - The doctor filter dropdown element
 * @param {HTMLSelectElement} patientFilter - The patient filter dropdown element
 * @param {Array} reportRows - Array of enriched appointment data
 */
export function initFilters(doctorFilter, patientFilter, reportRows) {
  // Populate doctor filter
  const doctors = Array.from(
    new Set(reportRows.map((r) => r.doctor_name).filter(name => name && name !== "Unknown"))
  ).sort();
  
  doctorFilter.innerHTML = '<option value="">All doctors</option>';
  doctors.forEach((name) => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    doctorFilter.appendChild(opt);
  });

  // Populate patient filter
  const patients = Array.from(
    new Set(reportRows.map((r) => r.patient_name).filter(name => name && name !== "Unknown"))
  ).sort();
  
  patientFilter.innerHTML = '<option value="">All patients</option>';
  patients.forEach((name) => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    patientFilter.appendChild(opt);
  });
}

/**
 * Apply filters and return filtered rows
 * @param {Array} reportRows - All appointment data
 * @param {Object} filters - Filter values
 * @returns {Array} Filtered report rows
 */
export function getFilteredRows(reportRows, filters) {
  const { doctorValue, patientValue, fromValue, toValue } = filters;

  return reportRows.filter((row) => {
    // Filter by doctor
    if (doctorValue && row.doctor_name !== doctorValue) return false;
    
    // Filter by patient
    if (patientValue && row.patient_name !== patientValue) return false;

    // Filter by date range
    if (fromValue || toValue) {
      const apptDate = new Date(row.appointment_date);
      if (fromValue && apptDate < fromValue) return false;
      if (toValue && apptDate > toValue) return false;
    }

    return true;
  });
}

/**
 * Render summary cards
 * @param {Array} rows - Filtered report rows
 * @param {Object} elements - DOM elements for summary display
 */
export function renderSummary(rows, elements) {
  const { totalPatientsEl, totalDoctorsEl, totalAppointmentsEl } = elements;
  
  const patientIds = new Set(rows.map((r) => r.patient_id).filter(id => id));
  const doctorIds = new Set(rows.map((r) => r.doctor_id).filter(id => id));

  totalPatientsEl.textContent = patientIds.size;
  totalDoctorsEl.textContent = doctorIds.size;
  totalAppointmentsEl.textContent = rows.length;
}

/**
 * Render report table
 * @param {Array} rows - Filtered report rows
 * @param {HTMLElement} reportBody - Table body element
 */
export function renderTable(rows, reportBody) {
  reportBody.innerHTML = "";

  if (rows.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 13;
    td.textContent = "No appointments found for the selected filters.";
    tr.appendChild(td);
    reportBody.appendChild(tr);
    return;
  }

  rows.forEach((row) => {
    const tr = document.createElement("tr");

    const statusClass =
      row.appointment_status === "Completed"
        ? "status-completed"
        : row.appointment_status === "Scheduled"
        ? "status-scheduled"
        : row.appointment_status === "Canceled"
        ? "status-canceled"
        : "";

    tr.innerHTML = `
      <td>${row.appointment_id}</td>
      <td>${row.appointment_date}</td>
      <td>${row.appointment_time}</td>
      <td>${row.patient_id}</td>
      <td>${row.patient_name}</td>
      <td>${row.patient_email || ""}</td>
      <td>${row.guardian_name || ""}</td>
      <td>${row.guardian_email || ""}</td>
      <td>${row.doctor_id}</td>
      <td>${row.doctor_name}</td>
      <td>${row.doctor_credentials || ""}</td>
      <td>${row.appointment_type}</td>
      <td><span class="status-pill ${statusClass}">${row.appointment_status}</span></td>
    `;

    reportBody.appendChild(tr);
  });
}

/**
 * Update meta information
 * @param {Object} elements - DOM elements for meta display
 * @param {string} fromValue - Start date value
 * @param {string} toValue - End date value
 */
export function updateMeta(elements, fromValue, toValue) {
  const { metaPeriod, metaUpdated } = elements;
  
  if (!fromValue && !toValue) {
    metaPeriod.textContent = "Period: All Time";
  } else {
    metaPeriod.textContent = `Period: ${fromValue || "…"} to ${
      toValue || "…"
    }`;
  }

  const now = new Date();
  metaUpdated.textContent =
    "Last generated: " +
    now.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

/**
 * Generate and download filtered report as CSV
 * @param {Array} rows - Filtered report rows
 */
export function generateAndDownloadCsv(rows) {
  if (rows.length === 0) {
    alert("No appointments to export. Please adjust your filters.");
    return;
  }

  const header = [
    "Appointment ID",
    "Date",
    "Start Time",
    "Patient ID",
    "Patient Name",
    "Patient Email",
    "Guardian Name",
    "Guardian Email",
    "Doctor ID",
    "Doctor Name",
    "Specialty",
    "Appointment Type",
    "Status",
  ];

  const lines = [];
  lines.push(header.join(","));

  rows.forEach((r) => {
    const row = [
      r.appointment_id,
      r.appointment_date,
      r.appointment_time,
      r.patient_id,
      `"${r.patient_name}"`,
      r.patient_email || "",
      `"${r.guardian_name || ""}"`,
      r.guardian_email || "",
      r.doctor_id,
      `"${r.doctor_name}"`,
      `"${r.doctor_credentials || ""}"`,
      `"${r.appointment_type}"`,
      r.appointment_status,
    ];
    lines.push(row.join(","));
  });

  const csvContent = lines.join("\n");
  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `appointments_report_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
