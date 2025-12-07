// Patient/legal guardian-specific functionality for sign up form

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
    addDoc,
    doc,
    setDoc,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// Check required patient information is filled out
function checkReqdPatientInfo(firstName, lastName, dateOfBirth, address) {
    let isInfoValid = true;

    if (!checkRequiredField(firstName, 'firstNameError', 'First Name')) {
        isInfoValid = false;
    }
    if (!checkRequiredField(lastName, 'lastNameError', 'Last Name')) {
        isInfoValid = false;
    }
    if (!checkRequiredField(dateOfBirth, 'dobError', 'Date of Birth')) {
        isInfoValid = false;
    }
    if (!checkRequiredField(address, 'addressError', 'Address')) {
        isInfoValid = false;
    }

    return isInfoValid;
}

// Check required parent/legal guardian information is filled out
function checkReqdGuardianInfo(guardianFirstName, guardianLastName, guardianDateOfBirth, guardianAddress, relationship) {
    let isInfoValid = true;
    
    if (!checkRequiredField(guardianFirstName, 'guardianFirstNameError', 'Guardian First Name')) {
        isInfoValid = false;
    }
    if (!checkRequiredField(guardianLastName, 'guardianLastNameError', 'Guardian Last Name')) {
        isInfoValid = false;
    }
    if (!checkRequiredField(guardianDateOfBirth, 'guardianDobError', 'Guardian Date of Birth')) {
        isInfoValid = false;
    }
    if (!checkRequiredField(guardianAddress, 'guardianAddressError', 'Guardian Address')) {
        isInfoValid = false;
    }
    if (!checkRequiredField(relationship, 'relationshipError', 'Relationship')) {
        isInfoValid = false;
    }

    return isInfoValid;
}

// Toggle parent & legal guardian section visibility
document.getElementById('guardianCheckbox').addEventListener('change', function() {
    const guardianSection = document.getElementById('guardianSection');
    if (this.checked) {
        guardianSection.style.display = 'block';
    } else {
        guardianSection.style.display = 'none';
        // Clear guardian fields when unchecked
        const guardianInputs = guardianSection.querySelectorAll('input');
        guardianInputs.forEach(input => input.value = '');
    }
});

// Patient form submission handler
document.getElementById('signupForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    
    // Get form values
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const preferredName = document.getElementById('preferredName').value;
    const dateOfBirth = document.getElementById('dob').value;
    const address = document.getElementById('address').value;
    const guardianCheckbox = document.getElementById('guardianCheckbox').checked;
    const guardianFirstName = document.getElementById('guardianFirstName').value;
    const guardianLastName = document.getElementById('guardianLastName').value;
    const guardianPreferredName = document.getElementById('guardianPreferredName').value;
    const guardianDateOfBirth = document.getElementById('guardianDob').value;
    const guardianAddress = document.getElementById('guardianAddress').value;
    const relationship = document.getElementById('relationship').value;
    
    // Clear previous error messages
    hideError('usernameError');
    hideError('emailError');
    hideError('emailError');
    hideError('passwordError');
    hideError('confirmPasswordError');

    // Check login info validity
    if (!verifyLoginInfo(username, email, password, confirmPassword)) {
        alert('Check login information for errors.');
        return;
    }
    
    // Check if required patient info has been filled out 
    if (!checkReqdPatientInfo(firstName, lastName, dateOfBirth, address)) {
        alert('Please fill out all required patient information.');
        return;
    }

    if (guardianCheckbox) {
        if (!checkReqdGuardianInfo(guardianFirstName, guardianLastName, guardianDateOfBirth, guardianAddress, relationship)) {
            alert('Please fill out all required guardian information.');
            return;
        }
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
    
        if (guardianCheckbox) {
            // If guardian checked, set guardian as user
            await setDoc(doc(db, "guardians", user.uid), {
                username,
                email,
                firstName: guardianFirstName,
                lastName: guardianLastName,
                preferredName: guardianPreferredName,
                dateOfBirth: guardianDateOfBirth,
                address: guardianAddress,
                relationship: relationship,
                createdAt: serverTimestamp(),
            });
            
            const patientId = await addDoc(collection(db, "patients"), {
                firstName,
                lastName,
                preferredName,
                dateOfBirth,
                address,
                guardianId: user.uid,
                createdAt: serverTimestamp(),
            });

            // add patientId to guardian information
            await updateDoc(doc(db, "guardians", user.uid), {
                patientId: patientId.id
            });

        } else {
            // Patient does not have guardian, set patient as user
            await setDoc(doc(db, "patients", user.uid), {
                username,
                email,
                firstName,
                lastName,
                preferredName,
                dateOfBirth,
                address,
                createdAt: serverTimestamp(),
            });
        }

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