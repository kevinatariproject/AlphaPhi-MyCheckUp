// Fetches data from Firestore for populating calendars

import { db } from "./firebase_config.js";
import {
    Timestamp,
    query,
    collection,
    where,
    orderBy,
    getDocs,
    doc,
    getDoc,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// returns Firestore Timestamps for querying
function queryTimestamps(year, month) {
    // Timestamp for start of indicated month
    const queryMonth = Timestamp.fromDate(new Date(year, month, 1));
    // Timestamp for start of next month
    const nextMonth = Timestamp.fromDate(new Date(year, month+1, 1));
    
    return [queryMonth, nextMonth];
}

// [Patient] gets schedule for selected doctor and its blocks for indicated month
async function getDoctorSchedule(doctorId, pointerYear, pointerMonth) {
    const [queryStart, queryEnd] = queryTimestamps(pointerYear, pointerMonth);
    
    // reference to doctor's weekly schedule
    const refSchedule = doc(db, "schedules", doctorId);

    // build query for this month's blocks
    const q = query(
        collection(refSchedule, "blocks"),
        where("startTime", ">=", queryStart),
        where("startTime", "<", queryEnd),
        orderBy("startTime")
    );

    try {
        // get documents from Firestore
        const docSchedule = await getDoc(refSchedule);
        const snap = await getDocs(q);
        // get array from snapshot
        let blocks = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        // console.log(docSchedule.data());
        // console.log(blocks);
        
        return [docSchedule.data(), blocks];
    } catch (error) {
        console.error("Error retrieving schedule and blocks:", error);
    }
}

// gets all appointments for selected doctor for current month
async function getMonthAppts(doctorId, pointerYear, pointerMonth) {
    const [queryStart, queryEnd] = queryTimestamps(pointerYear, pointerMonth);
    
    // build query for this month's scheduled appointments
    const q = query(
        collection(db, "appointments"),
        where("doctorId", "==", doctorId),
        where("status", "not-in", ["cancelled"]),
        where("startTime", ">=", queryStart),
        where("startTime", "<", queryEnd),
        orderBy("startTime")
    );

    try {
        // get documents from Firestore
        const snap = await getDocs(q);
        // get array from snapshot
        let appointments = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        // console.log(appointments);
        
        return appointments;
    } catch (error) {
        console.error("Error retrieving appointments:", error);
    }
}

export { getMonthAppts, getDoctorSchedule };