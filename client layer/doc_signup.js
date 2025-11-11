// Doctor-specific functionality for sign up form

function checkReqdDoctorInfo(firstName, lastName, preferredName, credentials, department, bio) {
    let isInfoValid = true;

    checkRequiredField(firstName, 'firstNameError', 'First Name');
    if (!checkRequiredField(firstName, 'firstNameError', 'First Name')) {
        isInfoValid = false;
    }

    if (!checkRequiredField(lastName, 'lastNameError', 'Last Name')) {
        isInfoValid = false;
    }

    if (!checkRequiredField(preferredName, 'preferredNameError', 'Preferred Name')) {
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

function checkReqdDoctorInfo(firstName, lastName, preferredName, credentials, department, bio) {
    let isInfoValid = true;

    checkRequiredField(firstName, 'firstNameError', 'First Name');
    if (!checkRequiredField(firstName, 'firstNameError', 'First Name')) {
        isInfoValid = false;
    }

    if (!checkRequiredField(lastName, 'lastNameError', 'Last Name')) {
        isInfoValid = false;
    }

    if (!checkRequiredField(preferredName, 'preferredNameError', 'Preferred Name')) {
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
    let isLoginInfoValid;
    let isDoctorInfoValid;
    
    // Clear previous error messages
    hideError('usernameError');
    hideError('emailError');
    hideError('passwordError');
    hideError('confirmPasswordError');

    // Check login info validity
    isLoginInfoValid = verifyLoginInfo(username, email, password, confirmPassword);
    if (isLoginInfoValid == true) {
        try {
            const auth = firebase.auth();
            const db = firebase.firestore();

            // Create the user in Firebase Auth
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
        
            // Check if required doctor info has been filled out 
            isDoctorInfoValid = checkReqdDoctorInfo(firstName,
                                                    lastName,
                                                    preferredName,
                                                    credentials,
                                                    department,
                                                    bio
            );

            if (isDoctorInfoValid) {
                // Store additional user info in Firestore
                await db.collection("doctors").doc(user.uid).set({
                    username,
                    email,
                    firstName,
                    lastName,
                    preferredName,
                    credentials,
                    department,
                    bio,
                    status: "inactive",
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                });

                signupForm.reset();
            }
            else {
                alert('Please fill out all required fields.');
                return;
            }
        }
        catch (error) {
            console.log("Error creating account:", error.message);
        }
    } 
    else {
        alert('Check login information for errors.');
        return;
    }

    window.location.href = 'signup_successful.html';
});

// Initialize password validation when page loads
document.addEventListener('DOMContentLoaded', function() {
    setupPasswordValidation();
});