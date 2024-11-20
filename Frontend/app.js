// DOM Elements
const getStartedButton = document.getElementById("get-started");
const formContainer = document.getElementById("form-container");
const authForm = document.getElementById("auth-form");
const toggleFormText = document.getElementById("toggle-form");
const dashboard = document.getElementById("dashboard");
const activateMiningButton = document.getElementById("activate-mining");
const progressCircle = document.getElementById("progress-circle");
const minedBalanceDisplay = document.getElementById("mined-balance");
const userNameDisplay = document.getElementById("user-name");

// State Variables
let isMiningActive = false;
let miningProgress = 0;
let minedBalance = 0;
let miningInterval;

// Event Listeners

// Navigate from landing page to registration/login form
getStartedButton.addEventListener("click", () => {
  document.querySelector(".landing-page").classList.add("hidden");
  formContainer.classList.remove("hidden");
});

// Toggle between Login and Registration form
toggleFormText.addEventListener("click", () => {
  const nameInput = document.getElementById("name");
  const nameLabel = document.getElementById("name-label");
  const formTitle = document.getElementById("form-title");
  const authSubmit = document.getElementById("auth-submit");

  if (nameInput.classList.contains("hidden")) {
    // Switch to Registration Form
    nameInput.classList.remove("hidden");
    nameLabel.classList.remove("hidden");
    formTitle.textContent = "Register";
    authSubmit.textContent = "Register";
    toggleFormText.innerHTML = 'Already have an account? <span>Login here</span>';
  } else {
    // Switch to Login Form
    nameInput.classList.add("hidden");
    nameLabel.classList.add("hidden");
    formTitle.textContent = "Login";
    authSubmit.textContent = "Login";
    toggleFormText.innerHTML = 'Don’t have an account? <span>Register here</span>';
  }
});

// Handle form submission for Login or Registration
authForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const isRegistering = !document.getElementById("name").classList.contains("hidden");

  try {
    const response = await fetch(`https://mai.fly.dev/api/auth/${isRegistering ? "register" : "login"}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, username, password }),
    });

    const data = await response.json();

    if (response.ok) {
      // On successful login or registration
      if (isRegistering) {
        alert("Registration successful! You can now log in."); // Feedback for registration
      }

      userNameDisplay.textContent = data.username;
      minedBalance = data.balance || 0;
      minedBalanceDisplay.textContent = `${minedBalance} MAI`;

      formContainer.classList.add("hidden");
      dashboard.classList.remove("hidden");
    } else {
      alert(data.message || "Something went wrong!");
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Something went wrong!");
  }
});

// Activate Mining
activateMiningButton.addEventListener("click", () => {
  if (isMiningActive) {
    alert("Mining already active!");
    return;
  }

  isMiningActive = true;
  miningProgress = 0;
  progressCircle.style.background = "conic-gradient(#0f0 0%, #f00 0%)";

  miningInterval = setInterval(() => {
    if (miningProgress >= 100) {
      clearInterval(miningInterval);
      isMiningActive = false;
      alert("Mining session completed! Activate again to continue.");
    } else {
      miningProgress += 10; // 10% every minute
      minedBalance += 2; // 2 MAI every 10 minutes
      minedBalanceDisplay.textContent = `${minedBalance} MAI`;
      progressCircle.style.background = `conic-gradient(#0f0 ${miningProgress}%, #f00 ${miningProgress}%)`;
    }
  }, 60000); // Update every minute

  setTimeout(() => {
    isMiningActive = false;
    clearInterval(miningInterval);
  }, 3 * 60 * 60 * 1000); // Deactivate after 3 hours
});
