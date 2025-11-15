// Doctor-specific functionality for sign up form

function checkReqdDoctorInfo(firstName, lastName, credentials, department, bio) {
    let isInfoValid = true;

    checkRequiredField(firstName, 'firstNameError', 'First Name');
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
        const auth = firebase.auth();
        const db = firebase.firestore();

        // Create the user in Firebase Auth
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        try {
            // Try to create username
            await db.collection("usernames").doc(username).set({
                userId: user.uid
            }, { merge: false });
        } catch (usernameError) {
            await user.delete();
            throw { type: "username", error: usernameError };
        }
    
        // Store additional user info in Firestore
        await db.collection("doctors").doc(user.uid).set({
            username,
            email,
            firstName,
            lastName,
            preferredName,
            credentials,
            departmentId: department,
            bio,
            status: "inactive",
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });

        await auth.signOut();
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
    const db = firebase.firestore();

    const department = document.getElementById("department");

    try {
        // Fetch departments
        const querySnapshot = await db.collection("departments").get();
        const departments = querySnapshot.docs

        departments.forEach((doc) => {
            const option = document.createElement("option");
            option.value = doc.id;
            option.textContent = doc.data().name;
            department.appendChild(option);
        });
    } catch (error) {
        console.error("Error loading departments:", error);
        signupMessage.textContent = "Could not load departments.";
    }
});