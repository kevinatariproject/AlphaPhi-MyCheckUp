// Functions to fetch appointment data for admin use

import { db } from "./firebase_config.js";
import {
    Timestamp,
    query,
    collection,
    where,
    orderBy,
    getDocs,
    getDoc,
    doc
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// gets all the appointments create/updated today depending on mode
async function getTodayAppts(mode) {
    // get current date and time
    const today = new Date();
    // set time component to 0
    today.setHours(0, 0, 0, 0);
    // create copy of today
    const tomorrow = new Date(today);
    // increase date by 1
    tomorrow.setDate(today.getDate() + 1);

    // convert to Firestore Timestamps for querying
    const queryStart = Timestamp.fromDate(today);
    const queryEnd = Timestamp.fromDate(tomorrow);

    let q;
    if (mode == "create") { // sort by createdAt
        q = query(
            collection(db, "appointments"),
            where("createdAt", ">=", queryStart),
            where("createdAt", "<", queryEnd),
            orderBy("createdAt", "desc")
        );
    } else if (mode == "update") { // sort by lastUpdatedAt
        q = query(
            collection(db, "appointments"),
            where("lastUpdatedAt", ">=", queryStart),
            where("lastUpdatedAt", "<", queryEnd),
            orderBy("lastUpdatedAt", "desc")
        );
    }

    try {
        const snap = await getDocs(q);
        const todayAppts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        // console.log(todayAppts);
        return todayAppts;
    } catch (error) {
        console.error("Error retrieving appointments:", error);
        return [];
    }
}

// gets all the appointments for a specific patient/doctor
async function getUserAppts(mode, id) {
    let qPatient, qDoctor;
    if (mode == "create") {
        qPatient = query(
            collection(db, "appointments"),
            where("patientId", "==", id),
            orderBy("createdAt", "desc")
        );
        qDoctor = query(
            collection(db, "appointments"),
            where("doctorId", "==", id),
            orderBy("createdAt", "desc")
        );
    } else if (mode == "update") {
        qPatient = query(
            collection(db, "appointments"),
            where("patientId", "==", id),
            orderBy("lastUpdatedAt", "desc")
        );
        qDoctor = query(
            collection(db, "appointments"),
            where("doctorId", "==", id),
            orderBy("lastUpdatedAt", "desc")
        );
    }

    try { // try querying for patient first
        const snap = await getDocs(qPatient);
        const userAppts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        if (userAppts.length > 0) return userAppts;
        else throw new Error(`No appointments with patient ID: ${id}`);

    } catch (error) {
        try { // if no patient results, next try querying for doctor
            const snap = await getDocs(qDoctor);
            const userAppts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            if (userAppts.length > 0) return userAppts;
            else throw new Error(`No appointments with doctor ID: ${id}`);

        } catch (error) {
            console.error("Error retrieving appointments:", error);
            return [];
        }
    }
}

async function getUser(id, role) {
    try {
        const snap = await getDoc(doc(db, role, id));
        if (snap) return snap.data();
    } catch (error) {
        console.error("Error retrieving user:", error);
        return;
    }
}

export { getTodayAppts, getUserAppts, getUser };