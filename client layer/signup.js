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

// Actions to perform when form is submitted
document.getElementById('signupForm').addEventListener('submit', function(event) 
{
    event.preventDefault();
    
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const minUsernameLength = 6;
    const minPasswordLength = 8;

    // Validate username rules
    const username = document.getElementById('username').value;
    if (username.length < minUsernameLength) {
        alert('Username must be at least ' + minUsernameLength + ' characters long.');
        return;
    }

    // Validate password match
    if (password !== confirmPassword) {
        alert('Passwords do not match. Please try again.');
        return;
    }
    
    // Check that password meets all the complexity requirements
    if (password.length < minPasswordLength) {
        alert('Password must be at least ' + minPasswordLength + ' characters long.');
        return;
    }

    if (!/[A-Z]/.test(password)) {
        alert('Password must contain at least one uppercase letter.');
        return;
    }

    if (!/[a-z]/.test(password)) {
        alert('Password must contain at least one lowercase letter.');
        return;
    }

    if (!/[0-9]/.test(password)) {
        alert('Password must contain at least one number.');
        return;
    }

    if (!/[!@#$%^&*()-_=+{};:,<.>'"\/\[\]]/.test(password)) {
        alert('Password must contain at least one special character (such as !@#$%^&*).');
        return;
    }

    // Collect form data
    const signUpData = 
    {
        username: username,
        password: password,
        patient: 
        {
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            preferredName: document.getElementById('preferredName').value,
            dateOfBirth: document.getElementById('dob').value,
            address: document.getElementById('address').value
        }
    };
    
    // Add guardian information if checkbox is checked
    if (document.getElementById('guardianCheckbox').checked) 
    {
        signUpData.guardian = 
        {
            firstName: document.getElementById('guardianFirstName').value,
            lastName: document.getElementById('guardianLastName').value,
            preferredName: document.getElementById('guardianPreferredName').value,
            dateOfBirth: document.getElementById('guardianDob').value,
            address: document.getElementById('guardianAddress').value,
            relationship: document.getElementById('relationship').value
        };
    }
    
    // Log the data (in a real application, you would send this to a server)
    console.log('Form submitted with data:', signUpData);
    
    // Show success message
    alert('Account created successfully!');
    
    // Redirect to login or home page
    // window.location.href = 'index.html';
});

// Real-time password validation feedback
document.getElementById('password').addEventListener('input', function() {
    const password = this.value;
    // You can add real-time validation feedback here
});

document.getElementById('confirmPassword').addEventListener('input', function() {
    const password = document.getElementById('password').value;
    const confirmPassword = this.value;
    
    if (confirmPassword && password !== confirmPassword) {
        this.style.borderColor = '#dc3545';
    } else {
        this.style.borderColor = '#ccc';
    }
});
