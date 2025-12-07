import { initializeApp as initializeAdminApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { onCall } from "firebase-functions/v2/https";

initializeAdminApp(); // Admin SDK

const db = getFirestore();
const auth = getAuth();

export const deleteUser = onCall(async (request) => {
  const { uid } = request.data;
  const authToken = request.auth;

  if (!authToken) {
    throw new Error("unauthenticated");
  }

  try {
    // Correct: get DocumentSnapshot
    const adminSnap = await db.collection("admins").doc(authToken.uid).get();

    // Correct: use exists() method
    if (!adminSnap.exists) {
      throw new Error("permission-denied");
    }

    await auth.deleteUser(uid);

    return { message: `User ${uid} deleted successfully.` };
  } catch (error) {
    console.error("Error in deleteUser function:", error);
    throw new Error(error.message || "internal");
  }
});

export const checkUserLogin = onCall(async (request) => {
  const { uid } = request.data;
  const authToken = request.auth;

  if (!authToken) {
    throw new Error("unauthenticated");
  }

  try {
    const adminSnap = await db.collection("admins").doc(authToken.uid).get();

    if (!adminSnap.exists) {
      throw new Error("permission-denied");
    }

    const userRecord = await auth.getUser(uid);

    if (userRecord.disabled) {
      return { canLogin: false, reason: "User is disabled" };
    } else {
      return { canLogin: true };
    }
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      return { canLogin: false, reason: "User does not exist" };
    }
    console.error("Error in checkUserLogin function:", error);
    throw new Error(error.message || "internal");
  }
});





