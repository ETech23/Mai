document.addEventListener("DOMContentLoaded", () => {
  // Your entire JavaScript code goes here
});

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
        window.location.reload();
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to fetch balance. Please log in again.");
      localStorage.clear();
      window.location.reload();
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
      nameInput.classList.remove("hidden");
      nameLabel.classList.remove("hidden");
      formTitle.textContent = "Register";
      authSubmit.textContent = "Register";
      toggleFormText.innerHTML = 'Already have an account? <span>Login here</span>';
    } else {
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
        if (isRegistering) {
          alert("Registration successful! You can now log in.");
        } else {
          alert("Logged in successfully!");
          localStorage.setItem("token", data.token);
          localStorage.setItem("username", data.username);
          localStorage.setItem("minedBalance", data.balance || 0);

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
      alert("Mining is already active!");
      return;
    }

    isMiningActive = true;
    miningProgress = 0;
    activateMiningButton.disabled = true;
    activateMiningButton.style.opacity = 0.5;

    miningInterval = setInterval(async () => {
      if (miningProgress >= 100) {
        clearInterval(miningInterval);
        isMiningActive = false;
        activateMiningButton.disabled = false;
        activateMiningButton.style.opacity = 1;

        alert("Mining session completed!");
      } else {
        miningProgress += 10;
        minedBalance += 2;
        minedBalanceDisplay.textContent = `${minedBalance} MAI`;

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

        progressCircle.style.background = `conic-gradient(#4caf50 ${miningProgress}%, #ddd ${miningProgress}%)`;
      }
    }, 60000);
  });
}

// Toggle User Info Dropdown (Hamburger Menu)
if (menuIcon) {
  menuIcon.addEventListener("click", async () => {
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");
    const email = localStorage.getItem("email");
    const minedBalance = localStorage.getItem("minedBalance");
    const referrals = localStorage.getItem("referrals") || 0;
    const referralLink = `https://mai.fly.dev/register?ref=${username}`;

    if (token) {
      try {
        // Fetch updated user details from the backend
        const response = await fetch("https://mai.fly.dev/api/user/details", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (response.ok) {
          // Update localStorage with latest user data
          localStorage.setItem("referrals", data.referrals || 0);

          // Populate dropdown with user details
          userInfoDropdown.innerHTML = `
            <p><strong>Name:</strong> ${data.name}</p>
            <p><strong>Username:</strong> ${username}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Mined Balance:</strong> ${minedBalance || 0} MAI</p>
            <p><strong>Referrals:</strong> ${data.referrals || 0}</p>
            <p><strong>Referral Link:</strong></p>
            <p><small><a href="${referralLink}" target="_blank">${referralLink}</a></small></p>
            <button id="logout-button">Log Out</button>
          `;
        } else {
          alert("Failed to fetch user details. Please try again.");
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    }

    // Toggle dropdown visibility
    userInfoDropdown.classList.toggle("active");

    // Attach logout button event listener
    const logoutButton = document.getElementById("logout-button");
    if (logoutButton) {
      logoutButton.addEventListener("click", () => {
        localStorage.clear();
        alert("Logged out successfully!");
        window.location.href = "home.html";
      });
    }
  });
}

// Logout user
if (logoutButton) {
  logoutButton.addEventListener("click", () => {
    localStorage.clear();
    alert("Logged out successfully!");
    window.location.reload();
  });
}