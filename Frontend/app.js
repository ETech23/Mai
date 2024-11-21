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
const menuIcon = document.getElementById("menu-icon");
const userInfoDropdown = document.getElementById("user-info-dropdown");
const logoutButton = document.getElementById("logout-button");

// State Variables
let isMiningActive = false;
let miningProgress = 0;
let minedBalance = 0;
let miningInterval;

// Persistent Login Check
async function checkPersistentLogin() {
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");

  if (token && username) {
    try {
      const response = await fetch("https://mai.fly.dev/api/user/balance", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (response.ok) {
        // User is logged in, load dashboard
        userNameDisplay.textContent = username;
        minedBalance = data.balance || 0;
        minedBalanceDisplay.textContent = `${minedBalance} MAI`;

        formContainer.classList.add("hidden");
        dashboard.classList.remove("hidden");
      } else {
        alert("Session expired. Please log in again.");
        localStorage.clear();
        window.location.href = "home.html";
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to fetch balance. Please log in again.");
      localStorage.clear();
      window.location.href = "home.html";
    }
  }
}

// Call persistent login check on page load
checkPersistentLogin();

// Navigation: Landing to Login/Registration
if (getStartedButton) {
  getStartedButton.addEventListener("click", () => {
    document.querySelector(".landing-page").classList.add("hidden");
    formContainer.classList.remove("hidden");
  });
}

// Toggle between Login and Registration form
if (toggleFormText) {
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
}

// Handle form submission for Login or Registration
if (authForm) {
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
          alert("Registration successful! You can now log in.");
        } else {
          alert("Logged in successfully!");

          // Store user data in localStorage for persistent login
          localStorage.setItem("token", data.token);
          localStorage.setItem("username", data.username);
          localStorage.setItem("minedBalance", data.balance || 0);

          // Update the dashboard
          userNameDisplay.textContent = data.username;
          minedBalance = data.balance || 0;
          minedBalanceDisplay.textContent = `${minedBalance} MAI`;

          formContainer.classList.add("hidden");
          dashboard.classList.remove("hidden");
        }
      } else {
        alert(data.message || "Something went wrong!");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong!");
    }
  });
}

// Activate Mining
if (activateMiningButton) {
  activateMiningButton.addEventListener("click", () => {
    if (isMiningActive) {
      alert("Mining already active!");
      return;
    }

    isMiningActive = true;
    miningProgress = 0;

    // Disable the button and change its style
    activateMiningButton.disabled = true;
    activateMiningButton.style.opacity = 0.5;

    miningInterval = setInterval(async () => {
      if (miningProgress >= 100) {
        clearInterval(miningInterval);
        isMiningActive = false;

        // Re-enable the button
        activateMiningButton.disabled = false;
        activateMiningButton.style.opacity = 1;

        alert("Mining session completed! Activate again to continue.");
      } else {
        miningProgress += 10; // 10% every minute
        minedBalance += 2; // 2 MAI every 10 minutes
        minedBalanceDisplay.textContent = `${minedBalance} MAI`;

        // Update balance in localStorage and backend
        localStorage.setItem("minedBalance", minedBalance);
        try {
          const token = localStorage.getItem("token");
          await fetch("https://mai.fly.dev/api/user/update-balance", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ balance: minedBalance }),
          });
        } catch (error) {
          console.error("Error updating balance:", error);
        }

        // Update progress bar
        progressCircle.style.background = `conic-gradient(#0f0 ${miningProgress}%, #f00 ${miningProgress}%)`;
      }
    }, 60000); // Update every minute
  });
}

// Toggle user info dropdown
if (menuIcon) {
  menuIcon.addEventListener("click", () => {
    userInfoDropdown.classList.toggle("hidden");
  });
}

// Logout user
if (logoutButton) {
  logoutButton.addEventListener("click", () => {
    localStorage.clear();
    alert("Logged out successfully!");
    window.location.href = "home.html";
  });
}