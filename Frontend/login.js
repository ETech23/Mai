// DOM Elements
const formContainer = document.getElementById("form-container");
const authForm = document.getElementById("auth-form");
const toggleFormText = document.getElementById("toggle-form");
const loginFields = document.getElementById("login-fields");
const registerFields = document.getElementById("register-fields");
const authSubmit = document.getElementById("auth-submit");
const formTitle = document.getElementById("form-title");
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

// Function to show notification
function showNotification(message, isSuccess) {
    notificationMessage.textContent = message;
    notification.className = `notification ${isSuccess ? 'success' : 'error'}`;
    notification.style.display = 'block';

    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Function to switch between login and registration form
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

        toggleFormText.innerHTML = 'Don’t have an account? <span class="text-yellow-400 cursor-pointer hover:underline">Register here</span>';
    }

    authForm.reset();
}

// Handle form submission
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
        referredBy: referralInput.value.trim(), // Include referral code
    } : {
        identifier: identifierInput.value.trim(),
        password: passwordInput.value.trim(),
    };

    try {
        const response = await fetch(`https://maicoin-41vo.onrender.com/api/auth/${isRegistering ? "register" : "login"}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (response.ok) {
            if (isRegistering) {
                showNotification("Registration successful! You can now log in.", true);
                switchForm(false); // Switch to login form after successful registration
            } else {
                showNotification("Logged in successfully!", true);
                localStorage.setItem("token", data.token);
                localStorage.setItem("username", data.username);
                localStorage.setItem("email", data.email);
                localStorage.setItem("minedBalance", data.balance.toFixed(4));
                window.location.href = "index.html";
            }
        } else {
            showNotification(data.message || "Something went wrong!", false);
        }
    } catch (error) {
        console.error("Error:", error);
        showNotification("Something went wrong!", false);
    }
});

// Automatically switch to registration if referral code exists in URL
const urlParams = new URLSearchParams(window.location.search);
const referralCode = urlParams.get("ref");

if (referralCode) {
    switchForm(true); // Open registration form
    referralInput.value = referralCode;
}

// Toggle between login and registration form when clicking the switch link
toggleFormText.addEventListener("click", () => {
    switchForm(formTitle.textContent === "Login");
});

// Auto-hide form if user is already logged in
const token = localStorage.getItem("token");
if (token) {
    formContainer.classList.add("hidden");
}