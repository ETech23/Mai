document.addEventListener("DOMContentLoaded", function () {
    const authForm = document.getElementById("auth-form");

    if (localStorage.getItem("token") && authForm) {
        authForm.classList.add("hidden");
    }
    
    // Initialize the form based on whether we have a referral code
    initializeForm();
    
    // Setup password toggle functionality
    setupPasswordToggles();
});

// Extract query parameters from the URL
const urlParams = new URLSearchParams(window.location.search);
const referralCode = urlParams.get('ref');

if (referralCode) {
    // Save the referral code to local storage
    localStorage.setItem('referralCode', referralCode);
    console.log("Referral code saved:", referralCode);
}

// DOM Elements
const authForm = document.getElementById("auth-form");
const formTitle = document.getElementById("form-title");
const loginFields = document.getElementById("login-fields");
const registerFields = document.getElementById("register-fields");
const authSubmit = document.getElementById("auth-submit");
const toggleFormText = document.getElementById("toggle-form");
const nameInput = document.getElementById("name");
const usernameInput = document.getElementById("username");
const emailInput = document.getElementById("email");
const passwordRegisterInput = document.getElementById("password-register");
const passwordConfirmInput = document.getElementById("password-confirm");
const referralInput = document.getElementById("referral-input");
const identifierInput = document.getElementById("identifier");
const passwordInput = document.getElementById("password");
const notification = document.getElementById("notification");
const notificationMessage = document.getElementById("notification-message");

// Password toggle buttons
const togglePasswordLogin = document.getElementById("toggle-password-login");
const togglePasswordRegister = document.getElementById("toggle-password-register");
const togglePasswordConfirm = document.getElementById("toggle-password-confirm");

// Function to initialize the form based on query parameters
function initializeForm() {
    // If we have a referral code, switch to registration form and prefill the code
    if (referralCode) {
        switchForm(true); // Switch to registration form
        
        // Prefill the referral code if the input exists
        if (referralInput) {
            referralInput.value = referralCode;
        }
    }
}

// Function to show notification
function showNotification(message, isSuccess) {
    notificationMessage.textContent = message;
    notification.className = `notification ${isSuccess ? 'success' : 'error'}`;
    notification.style.display = 'block';

    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Toggle between login and registration form
function switchForm(toRegister) {
    if (toRegister) {
        formTitle.textContent = "Register";
        authSubmit.textContent = "Register";
        loginFields.classList.add("hidden");
        registerFields.classList.remove("hidden");

        nameInput.setAttribute("required", true);
        usernameInput.setAttribute("required", true);
        emailInput.setAttribute("required", true);
        passwordRegisterInput.setAttribute("required", true);
        passwordConfirmInput.setAttribute("required", true);
        identifierInput.removeAttribute("required");
        passwordInput.removeAttribute("required");

        toggleFormText.innerHTML = 'Already have an account? <span class="text-yellow-400 cursor-pointer hover:underline">Login here</span>';
        
        // If there's a referral code in localStorage, fill it in
        const storedReferralCode = localStorage.getItem('referralCode');
        if (storedReferralCode && referralInput) {
            referralInput.value = storedReferralCode;
        }
    } else {
        formTitle.textContent = "Login";
        authSubmit.textContent = "Login";
        loginFields.classList.remove("hidden");
        registerFields.classList.add("hidden");

        identifierInput.setAttribute("required", true);
        passwordInput.setAttribute("required", true);
        nameInput.removeAttribute("required");
        usernameInput.removeAttribute("required");
        emailInput.removeAttribute("required");
        passwordRegisterInput.removeAttribute("required");
        passwordConfirmInput.removeAttribute("required");

        toggleFormText.innerHTML = 'Don`t have an account? <span class="text-yellow-400 cursor-pointer hover:underline">Register here</span>';
    }

    // Reset the form but don't clear referral value if switching to register
    const referralValue = referralInput ? referralInput.value : '';
    authForm.reset();

    // Re-apply referral code if switching to register
    if (toRegister && referralInput && referralValue) {
        referralInput.value = referralValue;
    }
}

// Handle login & registration submission
authForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const isRegistering = formTitle.textContent === "Register";

    if (isRegistering && passwordRegisterInput.value.trim() !== passwordConfirmInput.value.trim()) {
        showNotification("Passwords do not match!", false);
        return;
    }

    const payload = isRegistering ? {
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        username: usernameInput.value.trim(),
        password: passwordRegisterInput.value.trim(),
        referredBy: referralInput.value.trim() || null,
    } : {
        identifier: identifierInput.value.trim(),
        password: passwordInput.value.trim(),
    };

    try {
        const response = await fetch(`https://mai-vmox.onrender.com/api/auth/${isRegistering ? "register" : "login"}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            credentials: "include"
        });

        const data = await response.json();

        if (response.ok) {
            if (isRegistering) {
                showNotification("Registration successful! You can now log in.", true);
                switchForm(false);
            } else {
                showNotification("Logged in successfully!", true);
                
                // After successful login
localStorage.setItem('userData', JSON.stringify(data));

                // Save token properly
                localStorage.setItem("token", data.token);
                localStorage.setItem("username", data.username);
                localStorage.setItem("email", data.email);
                localStorage.setItem("minedBalance", data.balance.toFixed(4));

                setTimeout(() => {
                    window.location.href = "index.html";
                }, 1000);
            }
        } else {
            showNotification(data.message || "Something went wrong!", false);
        }
    } catch (error) {
        console.error("Error:", error);
        showNotification("Something went wrong!", false);
    }
});

// Toggle form switch event
toggleFormText.addEventListener("click", () => {
    switchForm(formTitle.textContent === "Login");
});

// Function to toggle password visibility
function togglePasswordVisibility(passwordField, toggleButton) {
    if (passwordField.type === "password") {
        passwordField.type = "text";
        toggleButton.innerHTML = '<i class="fas fa-eye-slash"></i>'; // Change to "hide" icon
        toggleButton.setAttribute('aria-label', 'Hide password');
    } else {
        passwordField.type = "password";
        toggleButton.innerHTML = '<i class="fas fa-eye"></i>'; // Change to "show" icon
        toggleButton.setAttribute('aria-label', 'Show password');
    }
}

// Setup password toggle functionality
function setupPasswordToggles() {
    // Login password toggle
    if (togglePasswordLogin) {
        togglePasswordLogin.addEventListener("click", function() {
            togglePasswordVisibility(passwordInput, togglePasswordLogin);
        });
    }
    
    // Registration password toggle
    if (togglePasswordRegister) {
        togglePasswordRegister.addEventListener("click", function() {
            togglePasswordVisibility(passwordRegisterInput, togglePasswordRegister);
        });
    }
    
    // Confirm password toggle
    if (togglePasswordConfirm) {
        togglePasswordConfirm.addEventListener("click", function() {
            togglePasswordVisibility(passwordConfirmInput, togglePasswordConfirm);
        });
    }
}