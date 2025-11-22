import { auth } from '../scripts/firebase_config.js';
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { createAppointment, getUserAppointments, cancelAppointment, updateAppointment, getDoctorsFromDatabase, getAppointmentsByStatus } from "../scripts/appt_scheduling.js";

// This file is intended for testing dashboard functionalities
// We'll assume the user has already been authenticated
// and we have their user ID available
// and that they have selected a reason for the visit, a doctor they want to see,
// and a preferred date and time for the appointment
// This only tests that the Firebase is being updated correctly when scheduling an appointment,
// modifying an appointment, and cancelling an appointment
// and finally retrieving the updated list of appointments for the user

// Global variables

let userCredential;
let user;
let appointmentID;
let selectedDoctor;

async function signInTestUser() {
    try {
        userCredential = await signInWithEmailAndPassword(auth, "avgjoe@test.com", "Password1!");
        user = userCredential.user;
        console.log("User signed in:", user.uid);
    } catch (error) {
        console.error("Error signing in test user:", error);
    }
}

async function testCreateAppointment() {
    try {
        appointmentID = await createAppointment(
            new Date("2025-11-25T10:00:00").toISOString(),
            new Date("2025-11-25T10:30:00").toISOString(),
            user.uid, // createdBy
            user.uid, // patientID
            selectedDoctor, // doctorID
            "scheduled",
            "general"
        );
        console.log("✅ Created appointment with ID:", appointmentID);
        if (!appointmentID) {
            throw new Error("Failed to create appointment - no ID returned");
        }
    } catch (error) {
        console.error("❌ Error during testCreateAppointment:", error);
        throw error; // Re-throw to stop subsequent tests
    }
}

async function testGetUserAppointments() {
    try {
        const appointments = await getUserAppointments(user.uid);
        console.log("✅ User has", appointments.length, "appointment(s)");
        appointments.forEach(appt => {
            console.log("   - ID:", appt.id, "| Status:", appt.status, "| Doctor:", appt.doctorId);
        });
        return appointments;
    } catch (error) {
        console.error("❌ Error during testGetUserAppointments:", error);
        throw error;
    }
}

async function testUpdateAppointment() {
    try {
        if (!appointmentID) {
            throw new Error("No appointmentID available for update test");
        }
        const success = await updateAppointment(
            appointmentID,
            new Date("2025-11-25T11:00:00").toISOString(), // new start time
            new Date("2025-11-25T11:30:00").toISOString(), // new end time
            user.uid,
            user.uid,
            selectedDoctor,
            "rescheduled",
            "general"
        );
        console.log(success ? "✅ Updated appointment successfully" : "❌ Failed to update appointment");
        if (!success) {
            throw new Error("Update appointment returned false");
        }
    } catch (error) {
        console.error("❌ Error during testUpdateAppointment:", error);
        throw error;
    }
}

async function testCancelAppointment() {
    try {
        if (!appointmentID) {
            throw new Error("No appointmentID available for cancel test");
        }
        const success = await cancelAppointment(appointmentID);
        console.log(success ? "✅ Cancelled appointment successfully" : "❌ Failed to cancel appointment");
        if (!success) {
            throw new Error("Cancel appointment returned false");
        }
    } catch (error) {
        console.error("❌ Error during testCancelAppointment:", error);
        throw error;
    }
}

async function testGetUserAppointmentsByStatus(status) {
    try {
        const appointments = await getAppointmentsByStatus(user.uid, status);
        console.log(`✅ Appointments with status "${status}":`, appointments.length);
        appointments.forEach(appt => {
            console.log("   - ID:", appt.id, "| Status:", appt.status, "| Doctor:", appt.doctorId);
        });
        return appointments;
    } catch (error) {
        console.error(`❌ Error during testGetUserAppointmentsByStatus for status "${status}":`, error);
        throw error;
    }
}

async function runTests() {
    console.log("=== Starting Tests ===");
    
    await signInTestUser();

    console.log("\n--- Fetch Doctors ---");

    const doctors = await getDoctorsFromDatabase();
    selectedDoctor = doctors[0].id;
    console.log("Selected Doctor ID:", selectedDoctor);

    console.log("\n--- Test 1: Create Appointment ---");
    await testCreateAppointment();
    
    console.log("\n--- Test 2: Get User Appointments (after create) ---");
    await testGetUserAppointments();
    
    console.log("\n--- Test 3: Update Appointment ---");
    await testUpdateAppointment();
    
    console.log("\n--- Test 4: Get User Appointments (after update) ---");
    await testGetUserAppointments();
    
    console.log("\n--- Test 5: Cancel Appointment ---");
    await testCancelAppointment();
    
    console.log("\n--- Test 6: Get User Appointments (after cancel) ---");
    await testGetUserAppointments();

    console.log("\n--- Test 7: Get User Appointments by Status ---");
    await testGetUserAppointmentsByStatus("cancelled");
    
    console.log("\n=== Tests Complete ===");
}

// Wait for Firebase to initialize before running tests
window.addEventListener('load', () => {
    setTimeout(() => {
        runTests();
    }, 500); // Give Firebase emulators time to connect
});