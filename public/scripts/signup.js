// Patient/legal guardian-specific functionality for sign up form

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
document.getElementById('signupForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    
    // Get form values
    const username = document.getElementById("username").value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const firstName = document.getElementById("firstName").value;
    const lastName = document.getElementById("lastName").value;
    const preferredName = document.getElementById("preferredName").value;
    const dateOfBirth = document.getElementById('dob').value;
    const address = document.getElementById('address').value;

    let isConditionsMet = true;

    // Clear previous error messages
    hideError('usernameError');
    hideError('passwordError');
    hideError('confirmPasswordError');

    // Check if each condition is met
    if (!checkUsername(username)) 
        isConditionsMet = false;
    else if (!checkPasswordComplexity(password)) 
        isConditionsMet = false;
    else if (!checkPasswordMatch(password, confirmPassword)) 
        isConditionsMet = false;
    else {
        try {
            const auth = firebase.auth();
            const db = firebase.firestore();

            // Create the user in Firebase Auth
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Add guardian information if checkbox is checked
            if (document.getElementById('guardianCheckbox').checked) {
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

                await db.collection("patients").add({
                    firstName,
                    lastName,
                    preferredName,
                    dateOfBirth,
                    address,
                    guardianId: user.uid,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                });
            }
            else {
                // Patient does not have guardian
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
            }

            signupForm.reset();

        } catch (error) {
            console.log("Error creating account:", error.message);
        }
        
        // Log the data (in a real application, you would send this to a server)
        // console.log('Patient signup data:', signUpData);
        
        // Show success message
        // alert('Patient account created successfully!');
        
        window.location.href = 'signup_successful.html';
    }
});

// Initialize password validation when page loads
document.addEventListener('DOMContentLoaded', function() {
    setupPasswordValidation();
});