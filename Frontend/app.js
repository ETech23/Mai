document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
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
  const formTitle = document.getElementById("form-title");
  const nameInput = document.getElementById("name");
  const nameLabel = document.getElementById("name-label");
  const usernameInput = document.getElementById("username");

  // State Variables
  let isMiningActive = false;
  let miningProgress = 0;
  let miningInterval;

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
          // Update the dashboard
          userNameDisplay.textContent = data.username;
          minedBalanceDisplay.textContent = `${data.balance} MAI`;

          // Save updated details in localStorage
          localStorage.setItem("username", data.username);
          localStorage.setItem("email", data.email);
          localStorage.setItem("minedBalance", data.balance);
          localStorage.setItem("name", data.name);

          // Show dashboard
          formContainer.classList.add("hidden");
          dashboard.classList.remove("hidden");

          // Restore mining session
          restoreMiningSession();
        } else {
          alert("Session expired. Please log in again.");
          localStorage.clear();
          window.location.reload();
        }
      } catch (error) {
        console.error("Error restoring session:", error);
        alert("Failed to restore session. Please log in again.");
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
    } else {
      // Clear expired mining session data
      localStorage.removeItem("miningProgress");
      localStorage.removeItem("miningEndTime");
      activateMiningButton.textContent = "Activate Mining";
      activateMiningButton.disabled = false;
    }
  }

  // **Continue Mining**
  function continueMining(savedProgress, remainingTime) {
    miningProgress = savedProgress;
    isMiningActive = true;
    activateMiningButton.disabled = true;
    activateMiningButton.textContent = "Mining...";

    const incrementInterval = 60000; // 1 minute
    const miningEndTime = Date.now() + remainingTime;

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
        miningProgress += 10;
        const currentBalance = parseInt(localStorage.getItem("minedBalance")) || 0;
        const newBalance = currentBalance + 2;

        localStorage.setItem("miningProgress", miningProgress);
        localStorage.setItem("minedBalance", newBalance);
        minedBalanceDisplay.textContent = `${newBalance} MAI`;

        progressCircle.style.background = `conic-gradient(#4caf50 ${miningProgress}%, #ddd ${miningProgress}%)`;

        // Update backend balance
        await updateBalance(newBalance);
      }
    }, incrementInterval);
  }

  // **Update Backend Balance**
  async function updateBalance(newBalance) {
    const token = localStorage.getItem("token");

    if (token) {
      try {
        await fetch("https://mai.fly.dev/api/mining/update", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ balance: newBalance }),
        });
      } catch (error) {
        console.error("Error updating balance:", error);
      }
    }
  }

  // **Activate Mining**
  if (activateMiningButton) {
    activateMiningButton.addEventListener("click", () => {
      if (isMiningActive) {
        alert("Mining is already active!");
        return;
      }

      const miningDuration = 3 * 60 * 60 * 1000; // 3 hours
      const miningEndTime = Date.now() + miningDuration;

      isMiningActive = true;
      localStorage.setItem("miningProgress", "0");
      localStorage.setItem("miningEndTime", miningEndTime.toString());
      continueMining(0, miningDuration);
    });
  }

  // **Handle Form Submission**
  if (authForm) {
    authForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const identifier = document.getElementById("identifier").value;
      const password = document.getElementById("password").value;
      const isRegistering = formTitle.textContent === "Register";

      const payload = isRegistering
        ? {
            name: nameInput.value,
            email: identifier,
            username: usernameInput.value,
            password,
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
            localStorage.setItem("minedBalance", data.balance || 0);

            userNameDisplay.textContent = data.username;
            minedBalanceDisplay.textContent = `${data.balance} MAI`;

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
  }

  // **Toggle Between Login and Registration Form**
  if (toggleFormText) {
    toggleFormText.addEventListener("click", () => {
      if (formTitle.textContent === "Login") {
        // Switch to Register
        nameInput.classList.remove("hidden");
        nameLabel.classList.remove("hidden");
        usernameInput.classList.remove("hidden");
        formTitle.textContent = "Register";
        toggleFormText.innerHTML = 'Already have an account? <span>Login here</span>';
      } else {
        // Switch to Login
        nameInput.classList.add("hidden");
        nameLabel.classList.add("hidden");
        usernameInput.classList.add("hidden");
        formTitle.textContent = "Login";
        toggleFormText.innerHTML = 'Don’t have an account? <span>Register here</span>';
      }
    });
  }

  // **Toggle User Info Dropdown**
  if (menuIcon) {
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
        <p><strong>Mined Balance:</strong> ${minedBalance || 0} MAI</p>
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
  }

  // Restore session on page load
  checkPersistentLogin();
});