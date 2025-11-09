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
document.getElementById('signupForm').addEventListener('submit', function(event) {
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
    let isLoginInfoValid;
    let isPatientInfoValid;
    let isGuardianInfoValid;

    // Clear previous error messages
    hideError('usernameError');
    hideError('emailError');
    hideError('passwordError');
    hideError('confirmPasswordError');

    // Check login info validity
    isLoginInfoValid = verifyLoginInfo(username, email, password, confirmPassword);

    if (isLoginInfoValid == true) {
        // Check if required patient info has been filled out 
        isPatientInfoValid = checkReqdPatientInfo(firstName, lastName, dateOfBirth, address);
        if (isPatientInfoValid == true) {
            // Collect patient form data
            const signUpData = {
                userType: 'patient',
                username: username,
                email: email,
                password: password,
                patient: {
                    firstName: firstName,
                    lastName: lastName,
                    preferredName: preferredName,
                    dateOfBirth: dateOfBirth,
                    address: address
                }
            };
        }
        else {
            alert('Please fill out all required patient information.');
            return;
        }

        // Add guardian information if checkbox is checked and required info is filled out
        if (guardianCheckbox == true) {
            isGuardianInfoValid = checkReqdGuardianInfo(guardianFirstName, 
                                                        guardianLastName, 
                                                        guardianDateOfBirth, 
                                                        guardianAddress, 
                                                        relationship);
            if (isGuardianInfoValid == true) {
                signUpData.guardian = {
                    firstName: guardianFirstName,
                    lastName: guardianLastName,
                    preferredName: guardianPreferredName,
                    dateOfBirth: guardianDateOfBirth,
                    address: guardianAddress,
                    relationship: relationship
                };
            }
            else {
                alert('Please fill out all required parent/legal guardian information.');
                return;
            }
        }

        // Log the data 
        // TODO: Link this to backend API to create account
        console.log('Patient signup data:', signUpData);
        
        // Show success message
        alert('Patient account created successfully!');
        
        // Redirect to login or home page
        // window.location.href = 'index.html';
    }
    else {
        alert('Check login information for errors.');
    }
});

// Initialize password validation when page loads
document.addEventListener('DOMContentLoaded', function() {
    setupPasswordValidation();
});