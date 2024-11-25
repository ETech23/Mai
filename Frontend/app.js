document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const formContainer = document.getElementById("form-container");
  const authForm = document.getElementById("auth-form");
  const toggleFormText = document.getElementById("toggle-form");
  const loginFields = document.getElementById("login-fields");
  const registerFields = document.getElementById("register-fields");
  const authSubmit = document.getElementById("auth-submit");
  const dashboard = document.getElementById("dashboard");
  const activateMiningButton = document.getElementById("activate-mining");
  const progressCircle = document.getElementById("progress-circle");
  const minedBalanceDisplay = document.getElementById("mined-balance");
  const userNameDisplay = document.getElementById("user-name");
  const menuIcon = document.getElementById("menu-icon");
  const userInfoDropdown = document.getElementById("user-info-dropdown");
  const formTitle = document.getElementById("form-title");
  const nameInput = document.getElementById("name");
  const usernameInput = document.getElementById("username");
  const emailInput = document.getElementById("email");
  const passwordRegisterInput = document.getElementById("password-register");
  const miningCountdown = document.getElementById("mining-countdown");

  // State Variables
  let isMiningActive = false;
  let miningProgress = 0;
  let miningInterval;
  let countdownInterval;

  // **Persistent Login Check**
  async function checkPersistentLogin() {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const response = await fetch("https://mai.fly.dev/api/auth/details", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok) {
          userNameDisplay.textContent = data.username;
          minedBalanceDisplay.textContent = `${data.balance.toFixed(4)} MAI`;
          localStorage.setItem("username", data.username);
          localStorage.setItem("email", data.email);
          localStorage.setItem("minedBalance", data.balance.toFixed(4));
          localStorage.setItem("name", data.name);
          formContainer.classList.add("hidden");
          dashboard.classList.remove("hidden");
          restoreMiningSession();
        } else {
          alert("Session expired. Please log in again.");
          localStorage.clear();
          window.location.reload();
        }
      } catch (error) {
        console.error("Error restoring session:", error);
        localStorage.clear();
        window.location.reload();
      }
    }
  }

  // **Restore Mining Session**
  function restoreMiningSession() {
    const savedProgress = parseInt(localStorage.getItem("miningProgress")) || 0;
    const miningEndTime = parseInt(localStorage.getItem("miningEndTime")) || 0;
    const now = Date.now();

    if (savedProgress < 100 && miningEndTime > now) {
      continueMining(savedProgress, miningEndTime - now);
      startCountdown(miningEndTime - now);
    } else {
      localStorage.removeItem("miningProgress");
      localStorage.removeItem("miningEndTime");
      activateMiningButton.textContent = "Activate Mining";
      activateMiningButton.disabled = false;
    }
  }

  // **Start Countdown Timer**
  function startCountdown(remainingTime) {
    if (countdownInterval) clearInterval(countdownInterval);

    countdownInterval = setInterval(() => {
      if (remainingTime <= 0) {
        clearInterval(countdownInterval);
        miningCountdown.textContent = "Next session available!";
      } else {
        const minutes = Math.floor(remainingTime / (60 * 1000));
        const seconds = Math.floor((remainingTime % (60 * 1000)) / 1000);
        miningCountdown.textContent = `Next session: ${minutes}m ${seconds}s`;
        remainingTime -= 1000;
      }
    }, 1000);
  }

  // **Continue Mining**
 // Define the updateBalance function first
async function updateBalance(newBalance) {
  const token = localStorage.getItem("token");
  if (!token) {
    console.error("No token found. Cannot update balance.");
    return;
  }

  try {
    const response = await fetch("https://mai.fly.dev/api/mining/update", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ balance: parseFloat(newBalance.toFixed(4)) }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Failed to update balance:", errorData.message || response.statusText);
    }
  } catch (error) {
    console.error("Error updating balance:", error);
  }
}

// Then, define other functions that call updateBalance
function continueMining(savedProgress, remainingTime) {
  miningProgress = savedProgress;
  isMiningActive = true;
  activateMiningButton.disabled = true;
  activateMiningButton.textContent = "Mining...";

  const incrementInterval = 1000; // 1 second
  const miningEndTime = Date.now() + remainingTime;

  startCountdown(remainingTime);

  miningInterval = setInterval(async () => {
    if (Date.now() >= miningEndTime || miningProgress >= 100) {
      clearInterval(miningInterval);
      isMiningActive = false;
      miningProgress = 100;
      activateMiningButton.disabled = false;
      activateMiningButton.textContent = "Activate Mining";

      alert("Mining session completed!");

      // Clear local storage for mining
      localStorage.removeItem("miningProgress");
      localStorage.removeItem("miningEndTime");
    } else {
      miningProgress += (1 / 3600) * 100; // Increment based on 1-hour session
      const currentBalance = parseFloat(localStorage.getItem("minedBalance")) || 0;
      const newBalance = currentBalance + 0.0010; // Add 0.0010 every second

      localStorage.setItem("miningProgress", miningProgress);
      localStorage.setItem("minedBalance", newBalance.toFixed(4));
      minedBalanceDisplay.textContent = `${newBalance.toFixed(4)} MAI`;

      progressCircle.style.background = `conic-gradient(#4caf50 ${miningProgress}%, #ddd ${miningProgress}%)`;

      // Update backend balance
      try {
        await updateBalance(newBalance);
      } catch (error) {
        console.error("Failed to update balance to backend:", error);
      }
    }
  }, incrementInterval);
}

  // **Activate Mining**
  activateMiningButton.addEventListener("click", () => {
    if (isMiningActive) {
      alert("Mining is already active!");
      return;
    }
    const miningDuration = 60 * 60 * 1000; // 1 hour
    const miningEndTime = Date.now() + miningDuration;

    isMiningActive = true;
    localStorage.setItem("miningProgress", "0");
    localStorage.setItem("miningEndTime", miningEndTime.toString());
    continueMining(0, miningDuration);
    startCountdown(miningDuration);
  });

  // **Handle Form Submission**
  authForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const identifier = document.getElementById("identifier").value;
    const password = document.getElementById("password").value;
    const isRegistering = formTitle.textContent === "Register";
    const payload = isRegistering
      ? {
          name: nameInput.value,
          email: emailInput.value,
          username: usernameInput.value,
          password: passwordRegisterInput.value,
        }
      : { identifier, password };

    try {
      const response = await fetch(`https://mai.fly.dev/api/auth/${isRegistering ? "register" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (response.ok) {
        if (isRegistering) {
          alert("Registration successful! You can now log in.");
        } else {
          alert("Logged in successfully!");
          localStorage.setItem("token", data.token);
          localStorage.setItem("username", data.username);
          localStorage.setItem("email", data.email);
          localStorage.setItem("minedBalance", data.balance.toFixed(4));
          userNameDisplay.textContent = data.username;
          minedBalanceDisplay.textContent = `${data.balance.toFixed(4)} MAI`;
          formContainer.classList.add("hidden");
          dashboard.classList.remove("hidden");
          restoreMiningSession();
        }
      } else {
        alert(data.message || "Something went wrong!");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong!");
    }
  });

  // **Toggle Between Login and Registration Form**
  toggleFormText.addEventListener("click", () => {
    if (formTitle.textContent === "Login") {
      // Switch to Registration Form
      formTitle.textContent = "Register";
      authSubmit.textContent = "Register";
      loginFields.classList.add("hidden");
      registerFields.classList.remove("hidden");

      // Add required attributes to registration fields
      document.getElementById("name").setAttribute("required", true);
      document.getElementById("username").setAttribute("required", true);
      document.getElementById("email").setAttribute("required", true);
      document.getElementById("password-register").setAttribute("required", true);

      // Remove required attributes from login fields
      document.getElementById("identifier").removeAttribute("required");
      document.getElementById("password").removeAttribute("required");

      toggleFormText.innerHTML = 'Already have an account? <span>Login here</span>';
    } else {
      // Switch to Login Form
      formTitle.textContent = "Login";
      authSubmit.textContent = "Login";
      loginFields.classList.remove("hidden");
      registerFields.classList.add("hidden");

      // Add required attributes to login fields
      document.getElementById("identifier").setAttribute("required", true);
      document.getElementById("password").setAttribute("required", true);

      // Remove required attributes from registration fields
      document.getElementById("name").removeAttribute("required");
      document.getElementById("username").removeAttribute("required");
      document.getElementById("email").removeAttribute("required");
      document.getElementById("password-register").removeAttribute("required");

      toggleFormText.innerHTML = 'Don’t have an account? <span>Register here</span>';
    }
  });

  // Form Submit Listener
  authForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (formTitle.textContent === "Register") {
      // Handle Registration
      console.log("Registering user...");
    } else {
      // Handle Login
      console.log("Logging in user...");
    }
  });

const urlParams = new URLSearchParams(window.location.search);
const referralCode = urlParams.get("ref");

if (referralCode) {
  console.log("Referral Code:", referralCode);
  // Pass the referral code to the backend when registering
  document.getElementById("referral-input").value = referralCode;
}

const path = require("path");

app.use(express.static(path.join(__dirname, "../Frontend")));

// Redirect unhandled routes to the frontend
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "./index.html"));
});

  // **Toggle User Info Dropdown**
  // **Toggle User Info Dropdown**
  menuIcon.addEventListener("click", () => {
    const username = localStorage.getItem("username");
    const email = localStorage.getItem("email");
    const minedBalance = localStorage.getItem("minedBalance");
    const referrals = localStorage.getItem("referrals") || 0;
    const referralLink = `https://mai.fly.dev/register?ref=${username}`;

    userInfoDropdown.innerHTML = `
      <p><strong>Name:</strong> ${localStorage.getItem("name")}</p>
      <p><strong>Username:</strong> ${username}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Mined Balance:</strong> ${minedBalance || "0.0000"} MAI</p>
      <p><strong>Referrals:</strong> ${referrals}</p>
      <p><strong>Referral Link:</strong></p>
      <p><small><a href="${referralLink}" target="_blank">${referralLink}</a></small></p>
      <button id="logout-button">Log Out</button>
    `;

    userInfoDropdown.classList.toggle("active");

    const logoutButton = document.getElementById("logout-button");
    if (logoutButton) {
      logoutButton.addEventListener("click", () => {
        localStorage.clear();
        alert("Logged out successfully.");
        window.location.reload();
      });
    }
  });

  // **Restore session on page load**
  checkPersistentLogin();
});
