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

      progressCircle.style.background = `conic-gradient(#aaa ${miningProgress}%, #ddd ${miningProgress}%)`;

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
    const identifier = document.getElementById("identifier").value.trim();
    const password = document.getElementById("password").value.trim();
    const isRegistering = formTitle.textContent === "Register";
    const payload = isRegistering
      ? {
          name: nameInput.value.trim(),
          email: emailInput.value.trim(),
          username: usernameInput.value.trim(),
          password: passwordRegisterInput.value.trim(),
        referredBy:
document.getElementById("referral-input").value.trim(),
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

  /**
  const referralInput = document.getElementById("referral-input");
  

  if (!referralInput) {
    console.warn("Referral input field not found. Ensure it's present in the registration form.");
  }
  if (!menuIcon) {
    console.warn("Menu icon not found. Ensure the dashboard UI is loaded.");
  }

  // Referral Handling
  const urlParams = new URLSearchParams(window.location.search);
  const referralCode = urlParams.get("ref");
  if (referralCode && referralInput) {
    referralInput.value = referralCode;
    
  // Populate hidden input with referral code
    console.log("Referral Code:", referralCode);
  } else if (!referralInput) {
    console.warn("Referral input field not found. Ensure it's present in the registration form.");
};
**/
  
  /** // Get elements
const referralInput = document.getElementById("referral-input"); **/
  
/**const menuIcon = document.getElementById("menu-icon");**/ 
 
 // Assuming this is for the dashboard UI

// Log warnings if elements are missing
  /**
if (!referralInput) {
  console.warn("Referral input field not found. Ensure it's present in the registration form.");
}
if (!menuIcon) {
  console.warn("Menu icon not found. Ensure the dashboard UI is loaded.");
}

// Referral Handling
const urlParams = new URLSearchParams(window.location.search);
const referralCode = urlParams.get("ref");

if (referralCode) {
  if (referralInput) {
    referralInput.value = referralCode; // Populate hidden input with referral code
    console.log("Referral Code:", referralCode);
  } else {
    console.warn("Referral input field not found. Cannot populate referral code.");
  }
} **/
  

  const articles = document.querySelectorAll(".news-article");
  const pushArticleButton = document.getElementById("push-article");

  // Function to handle reaction (like/dislike)
  async function handleReaction(event) {
    console.log("Reaction button clicked.");

    // Check if the user is logged in
    if (!localStorage.getItem("token")) {
      alert("Please log in to react to articles.");
      return;
    }

    const button = event.target;
    const articleElement = button.closest(".news-article");
    const articleTitle = articleElement.getAttribute("data-title");

    if (!articleTitle) {
      console.error("Article title not found.");
      return;
    }

    const isLike = button.classList.contains("like-btn");
    const reactionType = isLike ? "like" : "dislike";

    console.log(`Article Title: ${articleTitle}, Reaction Type: ${reactionType}`);

    const reactionData = { title: articleTitle, reaction: reactionType };

    try {
      const response = await fetch("https://mai.fly.dev/api/articles/reactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`, // Include token
        },
        body: JSON.stringify(reactionData),
      });

      const data = await response.json();
      if (data.success) {
        console.log("Reaction saved successfully:", data);

        // Update counts in the UI
        const likeCountElement = articleElement.querySelector(".like-count");
        const dislikeCountElement = articleElement.querySelector(".dislike-count");

        likeCountElement.textContent = data.likes;
        dislikeCountElement.textContent = data.dislikes;
      } else {
        console.error("Failed to save reaction:", data.message);
      }
    } catch (error) {
      console.error("Error saving reaction:", error);
    }
  }

  // Function to increment view count
  async function incrementViewCount(articleElement) {
    console.log("Incrementing view count.");

    const articleTitle = articleElement.getAttribute("data-title");

    if (!articleTitle) {
      console.error("Article title not found.");
      return;
    }

    const viewData = { title: articleTitle };

    console.log(`Sending View Data: ${JSON.stringify(viewData)}`);

    try {
      const response = await fetch("https://mai.fly.dev/api/articles/view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(viewData),
      });

      const data = await response.json();
      if (data.success) {
        console.log("View count updated successfully:", data);

        // Update the view count in the UI
        const viewCountElement = articleElement.querySelector(".views");
        viewCountElement.textContent = data.views;
      } else {
        console.error("Failed to update view count:", data.message);
      }
    } catch (error) {
      console.error("Error updating view count:", error);
    }
  }

  // Fetch reactions and update UI
  async function updateReactionCounts() {
    console.log("Fetching reaction counts for all articles.");

    try {
      const response = await fetch("https://mai.fly.dev/api/articles");
      const data = await response.json();

      if (data.success) {
        const articlesData = data.data;

        articlesData.forEach((article) => {
          const articleElement = Array.from(articles).find(
            (el) => el.getAttribute("data-title") === article.title
          );

          if (articleElement) {
            const likeCountElement = articleElement.querySelector(".like-count");
            const dislikeCountElement = articleElement.querySelector(".dislike-count");

            likeCountElement.textContent = article.likes || 0;
            dislikeCountElement.textContent = article.dislikes || 0;
          }
        });
      } else {
        console.error("Failed to fetch articles:", data.message);
      }
    } catch (error) {
      console.error("Error fetching articles:", error);
    }
  }

  // Function to handle pushing an article to the backend
  async function handlePushArticle() {
    console.log("Push Article button clicked.");

    const articleElement = pushArticleButton.closest(".news-article");
    const title = articleElement.getAttribute("data-title");
    const content = articleElement.querySelector("p").textContent;
    const image = articleElement.querySelector("img")?.getAttribute("src") || null;

    const articleData = { title, content, image };

    console.log(`Sending Article Data: ${JSON.stringify(articleData)}`);

    try {
      const response = await fetch("https://mai.fly.dev/api/articles/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(articleData),
      });

      const data = await response.json();
      if (data.success) {
        console.log("Article pushed successfully:", data);
        alert("Article pushed successfully.");
      } else {
        console.error("Failed to push article:", data.message);
      }
    } catch (error) {
      console.error("Error pushing article:", error);
    }
  }

  // Attach reaction handlers
  articles.forEach((article) => {
    const likeButton = article.querySelector(".like-btn");
    const dislikeButton = article.querySelector(".dislike-btn");

    likeButton.addEventListener("click", handleReaction);
    dislikeButton.addEventListener("click", handleReaction);
  });

  // Attach push article handler
  if (pushArticleButton) {
    pushArticleButton.addEventListener("click", handlePushArticle);
  }

  // Update reaction counts on page load
  updateReactionCounts();

  // Increment view count for all articles on page load
  articles.forEach((article) => incrementViewCount(article));

  
  /**
  const hash = window.location.hash;
  const urlParams = new URLSearchParams(hash.split("?")[1]);
  if (hash.includes("register")) {
    formTitle.textContent = "Register";
    registerFields.classList.remove("hidden");
    loginFields.classList.add("hidden");

    if (referralCode && referralInput) {
      referralInput.value = referralCode;
      console.log("Referral Code Set:", referralCode);
    }
  } else {
    formTitle.textContent = "Login";
    registerFields.classList.add("hidden");
    loginFields.classList.remove("hidden");
}
  **/
  
  // Check for referral code in URL
const urlParams = new URLSearchParams(window.location.search);
const referralCode = urlParams.get("ref");

if (referralCode) {
  console.log("Referral Code Detected:", referralCode);

  // Ensure the form switches to registration
  const formTitle = document.getElementById("form-title");
  const toggleFormText = document.getElementById("toggle-form");
  const registerFields = document.getElementById("register-fields");
  const loginFields = document.getElementById("login-fields");
  const authSubmit = document.getElementById("auth-submit");

  // Switch to registration form
  formTitle.textContent = "Register";
  authSubmit.textContent = "Register";
  registerFields.classList.remove("hidden");
  loginFields.classList.add("hidden");

  // Add referral code to hidden input
  const referralInput = document.getElementById("referral-input");
  if (referralInput) {
    referralInput.value = referralCode;
  } else {
    console.warn("Referral input field not found in the registration form.");
  }

  // Update toggle form text
  toggleFormText.innerHTML = 'Already have an account? <span>Login here</span>';
}
  
  // Menu Toggling
  /**menuIcon.addEventListener("click", () => {
    try {
      const username = localStorage.getItem("username");
      const email = localStorage.getItem("email");
      const minedBalance = localStorage.getItem("minedBalance");
      const referrals = localStorage.getItem("referrals") || 0;
      const referralLink = `https://mai.fly.dev/register?ref=${username}`;

      const userInfoDropdown = document.getElementById("user-info-dropdown");
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
    } catch (error) {
      console.error("Error toggling menu:", error);
    }
  });
});**/


  // DOM Elements

  // Ensure DOM elements exist
  if (!menuIcon || !userInfoDropdown) {
    console.error("Required DOM elements are missing");
    return;
  }

  // Add event listener for menu toggle
  menuIcon.addEventListener("click", async () => {
    try {
      console.log("Menu icon clicked");

      // Retrieve token from localStorage
      const token = localStorage.getItem("token");
      if (!token) {
        alert("You must log in to view your referral link.");
        return;
      }
      console.log("Token retrieved:", token);

      // Fetch user details from backend
      const response = await fetch("https://mai.fly.dev/api/auth/details", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        alert("Failed to fetch user details. Please log in again.");
        localStorage.clear();
        window.location.reload();
        return;
      }

      const user = await response.json();
      console.log("User details fetched:", user);

      const { username, email, balance, referrals, referralCode } = user;

      // Update localStorage with latest user data
      localStorage.setItem("username", username);
      localStorage.setItem("email", email);
      localStorage.setItem("minedBalance", balance.toFixed(4));
      localStorage.setItem("referrals", referrals.length);
      localStorage.setItem("referralCode", referralCode);

      // Construct referral link
      const referralLink = `https://mai.fly.dev/register?ref=${referralCode}`;
      console.log("Referral link constructed:", referralLink);

      // Update dropdown content
      userInfoDropdown.innerHTML = `
        <p><strong>Name:</strong> ${localStorage.getItem("name")}</p>
        <p><strong>Username:</strong> ${username}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Mined Balance:</strong> ${balance.toFixed(4)} MAI</p>
        <p><strong>Referrals:</strong> ${referrals.length}</p>
        <p><strong>Referral Link:</strong></p>
        <p>
          <small>
            <a href="${referralLink}" id="referral-link" target="_blank">${referralLink}</a>
          </small>
        </p>
        <button id="logout-button">Log Out</button>
      `;

      userInfoDropdown.classList.toggle("active");

      // Add long-press copy functionality for referral link
      const referralLinkElement = document.getElementById("referral-link");
      if (referralLinkElement) {
        let timer;
        referralLinkElement.addEventListener("mousedown", () => {
          timer = setTimeout(() => {
            navigator.clipboard.writeText(referralLink)
              .then(() => alert("Referral link copied to clipboard!"))
              .catch((err) => console.error("Failed to copy referral link:", err));
          }, 1000);
        });
        referralLinkElement.addEventListener("mouseup", () => clearTimeout(timer));
        referralLinkElement.addEventListener("mouseleave", () => clearTimeout(timer));
      }

      // Add logout functionality
      const logoutButton = document.getElementById("logout-button");
      if (logoutButton) {
        logoutButton.addEventListener("click", () => {
          localStorage.clear();
          alert("Logged out successfully.");
          window.location.reload();
        });
      }
    } catch (error) {
      console.error("Error toggling menu:", error);
      alert("An error occurred while fetching user details.");
    }
  });

  // Restore session on page load
  checkPersistentLogin();
  console.log("checkPersistentLogin called");
});