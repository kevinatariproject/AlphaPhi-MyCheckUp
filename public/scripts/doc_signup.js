// Doctor-specific functionality for sign up form

// imports
import { db, auth } from "./firebase_config.js";
import {
    hideError,
    checkRequiredField,
    setupPasswordValidation,
    verifyLoginInfo
} from "./signup_validation.js";
import {
    createUserWithEmailAndPassword,
    deleteUser,
    signOut
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import {
    collection,
    getDocs,
    doc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

function checkReqdDoctorInfo(firstName, lastName, credentials, department, bio) {
    let isInfoValid = true;

    if (!checkRequiredField(firstName, 'firstNameError', 'First Name')) {
        isInfoValid = false;
    }

    if (!checkRequiredField(lastName, 'lastNameError', 'Last Name')) {
        isInfoValid = false;
    }

    if (!checkRequiredField(credentials, 'credentialsError', 'Credentials')) {
        isInfoValid = false;
    }

    if (!checkRequiredField(department, 'departmentError', 'Department')) {
        isInfoValid = false;
    }

    if (!checkRequiredField(bio, 'bioError', 'Bio')) {
        isInfoValid = false;
    }

    return isInfoValid;
}

function checkHospitalEmail(email) {
    if (!email || typeof email !== 'string') return false;

    // Normalize to lowercase
    const normalized = email.trim().toLowerCase();

    // Check ending
    return normalized.endsWith('@alphaphi.com');
}

// Doctor form submission handler
document.getElementById('signupForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    
    // Get form values
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const preferredName = document.getElementById('preferredName').value;
    const credentials = document.getElementById('credentials').value;
    const department = document.getElementById('department').value;
    const bio = document.getElementById('bio').value;
    
    // Clear previous error messages
    hideError('usernameError');
    hideError('emailError');
    hideError('passwordError');
    hideError('confirmPasswordError');

    // Check login info validity
    if (!verifyLoginInfo(username, email, password, confirmPassword)) {
        alert('Check login information for errors.');
        return;
    }

    // Check if using hospital email
    if (!checkHospitalEmail(email)) {
        alert("Please use your hospital-issued email address.");
        return;
    }

    // Check if required doctor info has been filled out 
    if (!checkReqdDoctorInfo(firstName, lastName, credentials, department, bio)) {
        alert('Please fill out all required fields.');
        return;
    }

    try {
        // Create the user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        try {
            // Try to create username in Firestore
            await setDoc(doc(db, "usernames", username), { userId: user.uid }, { merge: false });

        } catch (usernameError) {
            // Remove Auth user if username fails
            await deleteUser(user);
            throw { type: "username", error: usernameError };
        }
    
        // Store doctor user info in Firestore
        await setDoc(doc(db, "doctors", user.uid), {
            username,
            email,
            firstName,
            lastName,
            preferredName,
            credentials,
            departmentId: department,
            bio,
            status: "inactive",
            createdAt: serverTimestamp(),
        });

        // Sign out and reset form
        await signOut(auth);
        signupForm.reset();
        window.location.href = 'signup_successful.html';
        
    } catch (error) {
        // Firebase Auth error
        if (error.type !== "username") {
            switch (error.code) {
                case "auth/email-already-in-use":
                    alert("This email is already taken.");
                    return;
                case "auth/invalid-email":
                    alert("Invalid email format.");
                    return;
                case "auth/weak-password":
                    alert("Password is too weak.");
                    return;
            }
        }

        // Username error
        if (error.type === "username") {
            alert("This username is already taken.");
            return;
        }

        // Other error
        alert("An unexpected error occurred.");
        console.error(error);
    }
});

// Initialize password validation when page loads
document.addEventListener('DOMContentLoaded', function() {
    setupPasswordValidation();
});

// Dynamically load all departments into select field
document.addEventListener('DOMContentLoaded', async () => {
    const departmentElement = document.getElementById("department");

    try {
        // Fetch departments
        const querySnapshot = await getDocs(collection(db, "departments"));
        
        querySnapshot.forEach((doc) => {
            const option = document.createElement("option");
            option.value = doc.id;
            option.textContent = doc.data().name;
            departmentElement.appendChild(option);
        });
        
    } catch (error) {
        console.error("Error loading departments:", error);
    }
});