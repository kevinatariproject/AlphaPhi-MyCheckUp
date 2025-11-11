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

// Check username length
function checkUsername(username) {
    if (username.length < minUsernameLength) {
        alert('Username must be at least ' + minUsernameLength + ' characters long.');
        showError('usernameError', 'Username must be at least ' + minUsernameLength + ' characters long.');
        return false;
    }
    else if (/\s/.test(username)) {
        alert('Username must not contain spaces.');
        showError('usernameError', 'Username must not contain spaces.');
        return false;
    }
    else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        alert('Username can only contain letters, numbers, and underscores.');
        showError('usernameError', 'Username can only contain letters, numbers, and underscores.');
        return false;
    }
    
    hideError('usernameError');
    return true;
}

// Check for password match
function checkPasswordMatch(password, confirmPassword) {
    if (password !== confirmPassword) {
        alert('Passwords do not match. Please try again.');
        showError('confirmPasswordError', 'Passwords do not match. Please try again.');
        return false;
    }
    hideError('confirmPasswordError');
    return true;
}

// Check that password meets all the complexity requirements
function checkPasswordComplexity(password) {
    if (password.length < minPasswordLength) {
        alert('Password must be at least ' + minPasswordLength + ' characters long.');
        showError('passwordError', 'Password must be at least ' + minPasswordLength + ' characters long.');
        return false;
    }

    if (!/[A-Z]/.test(password)) {
        alert('Password must contain at least one uppercase letter.');
        showError('passwordError', 'Password must contain at least one uppercase letter.');
        return false;
    }

    if (!/[a-z]/.test(password)) {
        alert('Password must contain at least one lowercase letter.');
        showError('passwordError', 'Password must contain at least one lowercase letter.');
        return false;
    }

    if (!/[0-9]/.test(password)) {
        alert('Password must contain at least one number.');
        showError('passwordError', 'Password must contain at least one number.');
        return false;
    }

    if (!/[!@#$%^&*()_\-+=\[\]{};:'",.<>/?\\|]/.test(password)) {
        alert('Password must contain at least one special character (such as !@#$%^&*).');
        showError('passwordError', 'Password must contain at least one special character (such as !@#$%^&*).');
        return false;
    }

    hideError('passwordError');
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