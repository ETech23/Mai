document.addEventListener("DOMContentLoaded", () => {
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
        const response = await fetch("https://mai.fly.dev/api/user/details", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();

        if (response.ok) {
          // Update the dashboard
          userNameDisplay.textContent = data.username;
          minedBalance = data.balance || 0;
          minedBalanceDisplay.textContent = `${minedBalance} MAI`;

          // Save updated details in localStorage
          localStorage.setItem("name", data.name);
          localStorage.setItem("email", data.email);
          localStorage.setItem("referrals", data.referrals || 0);

          // Show dashboard
          formContainer.classList.add("hidden");
          dashboard.classList.remove("hidden");
        } else {
          alert("Session expired. Please log in again.");
          localStorage.clear();
          window.location.reload();
        }
      } catch (error) {
        console.error("Error:", error);
        alert("Failed to fetch user details. Please log in again.");
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

    const identifier = document.getElementById("identifier").value; // New field
    const password = document.getElementById("password").value;
    const isRegistering = document.getElementById("name") && !document.getElementById("name").classList.contains("hidden");

    try {
      const response = await fetch(`https://mai.fly.dev/api/auth/${isRegistering ? "register" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isRegistering
            ? {
                name: document.getElementById("name").value,
                email: identifier,
                username: document.getElementById("username").value,
                password,
              }
            : { identifier, password }
        ),
      });

      const data = await response.json();

      if (response.ok) {
        if (isRegistering) {
          alert("Registration successful! You can now log in.");
        } else {
          alert("Logged in successfully!");

          // Save user data in localStorage for persistent login
          localStorage.setItem("token", data.token);
          localStorage.setItem("username", data.username);
          localStorage.setItem("email", data.email);
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
          alert("Logged out successfully!");
          window.location.reload();
        });
      }
    });
  }
});