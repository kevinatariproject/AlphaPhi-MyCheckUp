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

// Doctor form submission handler
document.getElementById('signupForm').addEventListener('submit', function(event) {
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
        // Check if required doctor info has been filled out 
        isDoctorInfoValid = checkReqdDoctorInfo(firstName,
                                                lastName,
                                                preferredName,
                                                credentials,
                                                department,
                                                bio
        );

        if (isDoctorInfoValid) {
            // Collect doctor form data
            const signUpData = {
                userType: 'doctor',
                username: username,
                email: email,
                password: password,
                doctor: {
                    firstName: firstName,
                    lastName: lastName,
                    preferredName: preferredName,
                    credentials: credentials,
                    department: department,
                    bio: bio
                }
            };

            // Log the data (in a real application, you would send this to a server)
            console.log('Doctor signup data:', signUpData);
            // Show success message
            alert('Doctor account created successfully!');
            
            // Redirect to login or home page
            // window.location.href = 'index.html';
        }
        else {
            alert('Please fill out all required fields.');
            return;
        }
    }
    else {
        alert('Check login information for errors.');
        return;
    }
});

// Initialize password validation when page loads
document.addEventListener('DOMContentLoaded', function() {
    setupPasswordValidation();
});