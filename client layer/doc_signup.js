// Doctor-specific functionality for sign up form

// Doctor form submission handler
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

    // Collect doctor form data
    const signUpData = {
        userType: 'doctor',
        username: username,
        email: email,
        password: password,
        doctor: {
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            preferredName: document.getElementById('preferredName').value,
            credentials: document.getElementById('credentials').value,
            department: document.getElementById('department').value,
            bio: document.getElementById('bio').value
        }
    };
    
    // Log the data (in a real application, you would send this to a server)
    console.log('Doctor signup data:', signUpData);
    
    // Show success message
    alert('Doctor account created successfully!');
    
    // Redirect to login or home page
    // window.location.href = 'index.html';
});

// Initialize password validation when page loads
document.addEventListener('DOMContentLoaded', function() {
    setupPasswordValidation();
});