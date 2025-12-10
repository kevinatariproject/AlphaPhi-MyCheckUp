// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAuth, connectAuthEmulator } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { getFirestore, connectFirestoreEmulator } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { getFunctions, connectFunctionsEmulator } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-functions.js";

// Your web app's Firebase configuration
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

// Export instances
export const db = getFirestore(app);
export const auth = getAuth(app);
export const functions = getFunctions(app);

// Emulator detection
const host = window.location.hostname;
const emulator = ["localhost", "127.0.0.1", "::1"].includes(host);

if (emulator) {
    connectAuthEmulator(auth, `http://${host}:9099`);
    connectFirestoreEmulator(db, "localhost", 8080);

    connectFunctionsEmulator(functions, "localhost", 5001);

    console.log("Using emulators: Auth, Firestore, Functions");
}
