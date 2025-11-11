// Patient/legal guardian-specific functionality for sign up form

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
    let isLoginInfoValid;
    let isPatientInfoValid;
    let isGuardianInfoValid;
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
    let isLoginInfoValid;
    let isPatientInfoValid;
    let isGuardianInfoValid;

    // Clear previous error messages
    hideError('usernameError');
    hideError('emailError');
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
        
            // Check if required patient info has been filled out 
            isPatientInfoValid = checkReqdPatientInfo(firstName, lastName, dateOfBirth, address);
            
            // Add guardian information if checkbox is checked
            if (document.getElementById('guardianCheckbox').checked) {
                isGuardianInfoValid = checkReqdGuardianInfo(guardianFirstName, guardianLastName, guardianDateOfBirth, guardianAddress, relationship);
                if (isGuardianInfoValid) {
                    await db.collection("guardians").doc(user.uid).set({
                        username,
                        email,
                        firstName: document.getElementById('guardianFirstName').value,
                        lastName: document.getElementById('guardianLastName').value,
                        preferredName: document.getElementById('guardianPreferredName').value,
                        dateOfBirth: document.getElementById('guardianDob').value,
                        address: document.getElementById('guardianAddress').value,
                        relationship: document.getElementById('relationship').value,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    });
                } else {
                    throw new Error('Please fill out all required guardian information.');
                }
                
                if (isPatientInfoValid) {
                    await db.collection("patients").add({
                        firstName,
                        lastName,
                        preferredName,
                        dateOfBirth,
                        address,
                        guardianId: user.uid,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    });
                } else {
                    throw new Error('Please fill out all required patient information.');
                }
            }
            else {
                // Patient does not have guardian
                if (isPatientInfoValid) {
                    await db.collection("patients").doc(user.uid).set({
                        username,
                        email,
                        firstName,
                        lastName,
                        preferredName,
                        dateOfBirth,
                        address,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    });
                } else {
                    throw new Error('Please fill out all required patient information.');
                }
            }

            signupForm.reset();

        } catch (error) {
            console.log("Error creating account:", error.message);
        }
}
    else {
        alert('Check login information for errors.');
    }

    window.location.href = 'signup_successful.html';
});

// Initialize password validation when page loads
document.addEventListener('DOMContentLoaded', function() {
    setupPasswordValidation();
});