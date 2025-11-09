// This file handles the sign up form validation and submission that is common across all users

// Define constants
const minUsernameLength = 6;
const minPasswordLength = 8;

// Show error message
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

// Hide error message
function hideError(elementId) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
    }
}

// Check if a required field is filled out
function checkRequiredField(value, elementId, fieldName) {
    if (!value || value.trim() === '') {
        showError(elementId, fieldName + ' is required.');
        return false;
    }
    hideError(elementId);
    return true;
}

// Check username length
function checkUsername(username) {
    if (!checkRequiredField(username, 'usernameError', 'Username')) {
        showError('usernameError', 'Username is required.');
        return false;
    }
    else if (username.length < minUsernameLength) {
        showError('usernameError', 'Username must be at least ' + minUsernameLength + ' characters long.');
        return false;
    }
    else if (/\s/.test(username)) {
        showError('usernameError', 'Username must not contain spaces.');
        return false;
    }
    else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        showError('usernameError', 'Username can only contain letters, numbers, and underscores.');
        return false;
    }
    
    hideError('usernameError');
    return true;
}

function checkEmail(email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!checkRequiredField(email, 'emailError', 'Email')) {
        showError('emailError', 'Email is required.');
        return false;
    }
    
    if (!emailPattern.test(email)) {
        showError('emailError', 'Please enter a valid email address.');
        return false;
    }
    hideError('emailError');
    return true;
}

// Check that password meets all the complexity requirements
function checkPasswordComplexity(password) {
    let errorMessages = [];
    if (!checkRequiredField(password, 'passwordError', 'Password')) {
        showError('passwordError', 'Password is required.');
        return false;
    }
    if (password.length < minPasswordLength) {
        errorMessages.push('Password must be at least ' + minPasswordLength + ' characters long.');
    }
    if (!/[A-Z]/.test(password)) {
        errorMessages.push('Password must contain at least one uppercase letter.');
    }
    if (!/[a-z]/.test(password)) {
        errorMessages.push('Password must contain at least one lowercase letter.');
    }
    if (!/[0-9]/.test(password)) {
        errorMessages.push('Password must contain at least one number.');
    }
    if (!/[!@#$%^&*()-_=+{};:,<.>'"\/\[\]]/.test(password)) {
        errorMessages.push('Password must contain at least one special character (such as !@#$%^&*).');
    }

    if (errorMessages.length > 0) {
        const combinedMessage = errorMessages.join('\n');
        alert(combinedMessage);
        showError('passwordError', combinedMessage);
        return false;
    }

    hideError('passwordError');
    return true;
}

// Check for password match
function checkPasswordMatch(password, confirmPassword) {
    if (!checkRequiredField(confirmPassword, 'confirmPasswordError', 'Confirm Password')) {
        showError('confirmPasswordError', 'Must confirm your password.');
        return false;
    }
    
    if (password !== confirmPassword) {
        showError('confirmPasswordError', 'Passwords do not match. Please try again.');
        return false;
    }
    hideError('confirmPasswordError');
    return true;
}

// Real-time password validation setup
function setupPasswordValidation() {
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
}

// Verifies login information for patient/legal guardian sign up
function verifyLoginInfo(username, email, password, confirmPassword) {
    let isConditionsMet = true;

    if (!checkUsername(username))
        isConditionsMet = false;

    if (!checkEmail(email))
        isConditionsMet = false;

    if (!checkPasswordComplexity(password))
        isConditionsMet = false;

    if (!checkPasswordMatch(password, confirmPassword))
        isConditionsMet = false;
    
    return isConditionsMet;
}