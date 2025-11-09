// Doctor-specific functionality for sign up form

// Dynamically load all departments into select field
document.addEventListener('DOMContentLoaded', async () => {
    const db = firebase.firestore();

    const department = document.getElementById("department");

    try {
        // Fetch departments
        const querySnapshot = await db.collection("departments").get();
        const departments = querySnapshot.docs

        departments.forEach((doc) => {
            const option = document.createElement("option");
            option.value = doc.id;
            option.textContent = doc.data().name;
            department.appendChild(option);
        });
    } catch (error) {
        console.error("Error loading departments:", error);
    }
});

// Doctor form submission handler
document.getElementById('signupForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    // Get form values
    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const firstName = document.getElementById("firstName").value;
    const lastName = document.getElementById("lastName").value;
    const preferredName = document.getElementById("preferredName").value;
    const credentials = document.getElementById("credentials").value;
    const department = document.getElementById("department").value;
    const bio = document.getElementById("bio").value;

    // Use shared validation functions
    if (!checkUsername(username)) return;
    if (!checkPasswordMatch(password, confirmPassword)) return;
    if (!checkPasswordComplexity(password)) return;

    try {
        const auth = firebase.auth();
        const db = firebase.firestore();

        // Create the user in Firebase Auth
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

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

    } catch (error) {
        console.log("Error creating account:", error.message);
    }
    
    // Log the data (in a real application, you would send this to a server)
    // console.log('Doctor signup data:', signUpData);
    
    // Show success message
    // alert('Doctor account created successfully!');
    
    window.location.href = 'signup_successful.html';
});

// Initialize password validation when page loads
document.addEventListener('DOMContentLoaded', function() {
    setupPasswordValidation();
});