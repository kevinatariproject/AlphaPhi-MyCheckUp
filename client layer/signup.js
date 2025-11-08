// Patient/legal guardian specific functionality for sign up form

// Import shared username and password validation functions
import { checkUsername, checkPasswordMatch, checkPasswordComplexity, setupPasswordValidation } from './signup_validation.js';

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
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;

    // Use shared validation functions
    if (!checkUsername(username)) return;
    if (!checkPasswordMatch(password, confirmPassword)) return;
    if (!checkPasswordComplexity(password)) return;

    // Collect patient form data
    const signUpData = {
        userType: 'patient',
        username: username,
        email: email,
        password: password,
        patient: {
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            preferredName: document.getElementById('preferredName').value,
            dateOfBirth: document.getElementById('dob').value,
            address: document.getElementById('address').value
        }
    };
    
    // Add guardian information if checkbox is checked
    if (document.getElementById('guardianCheckbox').checked) {
        signUpData.guardian = {
            firstName: document.getElementById('guardianFirstName').value,
            lastName: document.getElementById('guardianLastName').value,
            preferredName: document.getElementById('guardianPreferredName').value,
            dateOfBirth: document.getElementById('guardianDob').value,
            address: document.getElementById('guardianAddress').value,
            relationship: document.getElementById('relationship').value
        };
    }
    
    // Log the data (in a real application, you would send this to a server)
    console.log('Patient signup data:', signUpData);
    
    // Show success message
    alert('Patient account created successfully!');
    
    // Redirect to login or home page
    // window.location.href = 'index.html';
});

// Initialize password validation when page loads
document.addEventListener('DOMContentLoaded', function() {
    setupPasswordValidation();
});