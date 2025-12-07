// This file handles all the appointment scheduling functionalities

import { db } from './firebase_config.js';
import { collection, addDoc, doc, updateDoc, serverTimestamp, query, where, getDocs, setDoc, getDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

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

        // create block on doctor's schedule
        await setDoc(doc(db, "schedules", doctorID, "blocks", apptID.id), {
            startTime,
            endTime
        });
        console.log("Block successfully created");

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

        // update block
        await updateDoc(doc(db, "schedules", doctorID, "blocks", apptID), {
            startTime,
            endTime
        });
        console.log("Block successfully updated");

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

        // delete block
        const apptData = await getDoc(apptRef);
        await deleteDoc(doc(db, "schedules", apptData.data().doctorId, "blocks", apptID));
        console.log("Block successfully deleted");

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

async function getDoctorSchedule(doctorId, date) {
    console.log("=== Fetching schedule for doctor ===");
    console.log("Doctor ID:", doctorId);
    console.log("Date:", date);
    try {
        // Access the schedule subcollection under the doctor document
        const scheduleRef = collection(db, "doctors", doctorId, "schedule");
        console.log("Schedule ref path:", scheduleRef.path);

        const querySnapshot = await getDocs(scheduleRef);
        console.log("Query snapshot size:", querySnapshot.size);
        console.log("Query snapshot empty:", querySnapshot.empty);

        if (querySnapshot.empty) {
            console.log("No schedule documents found for doctor:", doctorId);
            return null;
        }

        // Get the first schedule document (assuming one schedule per doctor)
        const scheduleDoc = querySnapshot.docs[0];
        console.log("Schedule document ID:", scheduleDoc.id);
        console.log("Schedule document data:", scheduleDoc.data());

        const scheduleData = scheduleDoc.data();
        console.log("Days in schedule:", Object.keys(scheduleData));

        return { id: scheduleDoc.id, ...scheduleData };
    } catch (error) {
        console.error("Error fetching doctor schedule:", error);
        console.error("Error details:", error.message, error.code);
        return null;
    }
}

async function getDoctorAppointmentsForDate(doctorId, date) {
    try {
        // Create start and end of day timestamps
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const apptQuery = query(
            collection(db, "appointments"),
            where("doctorId", "==", doctorId),
            where("status", "in", ["scheduled", "rescheduled"])
        );

        const querySnapshot = await getDocs(apptQuery);
        const appointments = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            let startTime;

            // Parse the startTime
            if (data.startTime?.seconds) {
                startTime = new Date(data.startTime.seconds * 1000);
            } else if (typeof data.startTime === 'string') {
                startTime = new Date(data.startTime);
            } else {
                startTime = new Date(data.startTime);
            }

            // Check if appointment is on the selected date
            if (startTime >= startOfDay && startTime <= endOfDay) {
                appointments.push({ 
                    id: doc.id, 
                    ...data,
                    parsedStartTime: startTime 
                });
            }
        });

        return appointments;
    } catch (error) {
        console.error("Error fetching doctor appointments:", error);
        return [];
    }
}

async function getAvailableTimeSlots(doctorId, date, currentApptId = null) {
    try {
        // Get doctor's schedule
        const schedule = await getDoctorSchedule(doctorId, date);
        if (!schedule) {
            console.log("No schedule found for doctor");
            return [];
        }

        console.log("Doctor schedule:", schedule);

        // Get day of week (0 = Sunday, 1 = Monday, etc.)
        const dayOfWeek = new Date(date).getDay();
        // Map to the abbreviated day names used in your database (Sun, Mon, Tue, etc.)
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayName = dayNames[dayOfWeek];

        console.log(`Looking for day: ${dayName}`);

        // Check if the day exists in the schedule
        if (!schedule[dayName]) {
            console.log(`No schedule data for ${dayName}`);
            return [];
        }

        const daySchedule = schedule[dayName];
        console.log(`${dayName} schedule:`, daySchedule);

        // Check if doctor works on this day
        if (!daySchedule.isWorking) {
            console.log(`Doctor does not work on ${dayName}`);
            return [];
        }

        if (!daySchedule.startTime || !daySchedule.endTime) {
            console.log(`No start/end time for ${dayName}`);
            return [];
        }

        // Parse schedule times
        const scheduleStart = parseTime(daySchedule.startTime);
        const scheduleEnd = parseTime(daySchedule.endTime);

        // Get existing appointments for this date
        const existingAppointments = await getDoctorAppointmentsForDate(doctorId, date);

        // Filter out the current appointment if rescheduling
        const bookedAppointments = existingAppointments.filter(appt => appt.id !== currentApptId);

        // Generate 30-minute time slots
        const availableSlots = [];
        let currentTime = new Date(date);
        currentTime.setHours(scheduleStart.hours, scheduleStart.minutes, 0, 0);

        const endTime = new Date(date);
        endTime.setHours(scheduleEnd.hours, scheduleEnd.minutes, 0, 0);

        while (currentTime < endTime) {
            const slotEnd = new Date(currentTime.getTime() + 30 * 60000); // 30 minutes later

            // Check if this slot conflicts with any existing appointment
            const isBooked = bookedAppointments.some(appt => {
                const apptStart = appt.parsedStartTime;
                const apptEnd = appt.endTime?.seconds 
                    ? new Date(appt.endTime.seconds * 1000)
                    : new Date(appt.endTime);

                // Check for overlap
                return (currentTime >= apptStart && currentTime < apptEnd) ||
                       (slotEnd > apptStart && slotEnd <= apptEnd) ||
                       (currentTime <= apptStart && slotEnd >= apptEnd);
            });

            if (!isBooked) {
                availableSlots.push({
                    startTime: new Date(currentTime),
                    endTime: new Date(slotEnd),
                    display: formatTimeSlot(currentTime)
                });
            }

            // Move to next 30-minute slot
            currentTime = new Date(currentTime.getTime() + 30 * 60000);
        }

        return availableSlots;
    } catch (error) {
        console.error("Error getting available time slots:", error);
        return [];
    }
}

function parseTime(timeString) {
    // Parse time strings like "09:00 AM" or "2:30 PM"
    const match = timeString.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return { hours: 0, minutes: 0 };

    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const period = match[3].toUpperCase();

    if (period === 'PM' && hours !== 12) {
        hours += 12;
    } else if (period === 'AM' && hours === 12) {
        hours = 0;
    }

    return { hours, minutes };
}

function formatTimeSlot(date) {
    return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true
    });
}

/* Helper function to parse appointment dates */
function parseAppointmentDate(dateValue) {
  let parsedDate;

  // Check if it's a Firestore Timestamp object
  if (dateValue?.seconds) {
    parsedDate = new Date(dateValue.seconds * 1000);
  } else if (typeof dateValue === 'string' && dateValue.includes(' at ')) {
    // Parse Firestore date string format: "November 6, 2025 at 2:00:00 PM UTC-5"
    // Extract the date and time parts, ignoring the stored timezone
    const timeMatch = dateValue.match(/^(.+?) at (.+?) UTC/);

    if (timeMatch) {
      // Parse as UTC then convert to local timezone
      const dateUTC = new Date(timeMatch[1] + ' ' + timeMatch[2] + ' UTC');
      parsedDate = dateUTC;
    } else {
      // Fallback: parse directly
      parsedDate = new Date(dateValue);
    }
  } else {
    // ISO string or other format
    parsedDate = new Date(dateValue);
  }

  return parsedDate;
}

export { 
    createAppointment, 
    updateAppointment, 
    cancelAppointment, 
    getUserAppointments,
    getAppointmentsByStatus,
    getAvailableTimeSlots,
    parseAppointmentDate
 };