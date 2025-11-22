// This file handles all the appointment scheduling functionalities

import { db } from './firebase_config.js';
import { collection, addDoc, doc, updateDoc, serverTimestamp, query, where, getDocs } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

async function createAppointment(startTime, endTime, userID, patientID, doctorID, status, visitType) {
    try {
        const apptID = await addDoc(collection(db, "appointments"), {
            createdAt: serverTimestamp(),
            createdBy: userID,
            patientId: patientID,
            doctorId: doctorID,
            startTime,
            endTime,
            status,
            visitType
        });
        console.log("Appointment successfully created!");
        return apptID.id;
    } catch (error) {
        console.error("Error occurred while creating appointment: ", error);
        return null;
    }
    
}

async function updateAppointment(apptID, startTime, endTime, userID, patientID, doctorID, status, visitType) {
    try {
        const apptRef = doc(db, "appointments", apptID);
        await updateDoc(apptRef, {
            lastUpdatedAt: serverTimestamp(),
            lastUpdatedBy: userID,
            patientId: patientID,
            doctorId: doctorID,
            startTime,
            endTime,
            status,
            visitType
        });
        console.log("Appointment successfully updated!");
        return true;
    } catch (error) {
        console.error("Error occurred while updating appointment: ", error);
        return false;
    }
}

async function cancelAppointment(apptID) {
    try {
        const apptRef = doc(db, "appointments", apptID);
        await updateDoc(apptRef, {
            lastUpdatedAt: serverTimestamp(),
            status: "cancelled"
        });
        console.log("Appointment successfully cancelled!");
        return true;
    } catch (error) {
        console.error("Error occurred while cancelling appointment: ", error);
        return false;
    }
}
async function getUserAppointments(userID) {
    try {
        const apptQuery = query(collection(db, "appointments"), where("patientId", "==", userID));
        const querySnapshot = await getDocs(apptQuery);
        const appointments = [];
        querySnapshot.forEach((doc) => {
            appointments.push({ id: doc.id, ...doc.data() });
        });
        return appointments;
    } catch (error) {
        console.error("Error occurred while fetching user appointments: ", error);
        return [];
    }
}

async function getAppointmentsByStatus(userId, status) {
    try {
        const apptQuery = query(
            collection(db, "appointments"),
            where("patientId", "==", userId),
            where("status", "==", status)
        );
        const querySnapshot = await getDocs(apptQuery);
        const appointments = [];
        querySnapshot.forEach((doc) => {
            appointments.push({ id: doc.id, ...doc.data() });
        });
        return appointments;
    } catch (error) {
        console.error("Error occurred while fetching appointments that are " + status + ": " + error);
        return [];
    }
}

async function getDoctorsFromDatabase() {
    try {
        const querySnapshot = await getDocs(collection(db, "doctors"));
        const doctors = [];
        querySnapshot.forEach((doc) => {
            doctors.push({ id: doc.id, ...doc.data() });
        });
        return doctors;
    }
    catch (error) {
        console.error("Error occurred while fetching doctors: ", error);
        return [];
    }
}

export { createAppointment, updateAppointment, cancelAppointment, getUserAppointments, getAppointmentsByStatus, getDoctorsFromDatabase };