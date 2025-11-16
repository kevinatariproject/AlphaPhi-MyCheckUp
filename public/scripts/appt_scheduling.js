// This file handles all the appointment scheduling functionalities

import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyD8-dcgEfAr1DhZTUMo6e0mTwd4oQw7XhQ",
  authDomain: "mycheckup-91698.firebaseapp.com",
  projectId: "mycheckup-91698",
  storageBucket: "mycheckup-91698.firebasestorage.app",
  messagingSenderId: "739048669061",
  appId: "1:739048669061:web:c63a09e5662bba04ac4eec"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

async function createAppointment(startTime, endTime, userID, patientID, doctorID, status, visitType) {
    try {
        const apptID = await addDoc(collection(db, "appointments"), {
            createdAt: serverTimestamp(),
            createdBy: userID,
            patientID,
            doctorID,
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
            patientID,
            doctorID,
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
        const apptQuery = query(collection(db, "appointments"), where("createdBy", "==", userID));
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

async function getAppointmentsByStatus(status) {
    try {
        const apptQuery = query(collection(db, "appointments"), where("status", "==", status));
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