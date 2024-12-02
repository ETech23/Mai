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
  document.getElementById("push-article").addEventListener("click", async () => {
  try {
    // Get the article from the HTML
    const articleElement = document.querySelector(".news-article");
    const title = articleElement.getAttribute("data-title");
    const content = articleElement.querySelector("p").textContent;
    const imageSrc = articleElement.querySelector("img")?.getAttribute("src") || null;

    // Prepare the data to send
    const articleData = { title, content, image: imageSrc };

    // Send the data to your backend
    const response = await fetch("https://mai.fly.dev/api/articles/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(articleData),
    });

    // Handle the response
    const result = await response.json();
    if (response.ok) {
      console.log("Article added successfully:", result);
      alert("Article pushed to the backend successfully!");
    } else {
      console.error("Failed to push article:", result);
      alert(`Error: ${result.message}`);
    }
  } catch (error) {
    console.error("Error pushing article:", error);
    alert("An error occurred while pushing the article.");
  }
});
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
  
  document.addEventListener("DOMContentLoaded", () => {
  console.log("Document loaded and script running");

  const articlesList = document.getElementById("articles-list");
  const form = document.getElementById("add-article-form");

  if (!form) {
    console.error("Form element not found. Check your HTML structure.");
    return;
  }

  // Fetch and display articles
  async function fetchArticles() {
    try {
      console.log("Fetching articles...");
      const response = await fetch("https://mai.fly.dev/api/articles");
      if (!response.ok) throw new Error("Failed to fetch articles");
      const articles = await response.json();
      console.log("Articles fetched successfully:", articles);

      articlesList.innerHTML = articles
        .map(
          (article) => `
        <div class="article" data-id="${article._id}">
          <h3>${article.title}</h3>
          ${article.image ? `<img src="${article.image}" alt="${article.title}">` : ""}
          <p>${article.content}</p>
          <div class="article-buttons">
            <button class="edit-article">Edit</button>
            <button class="delete-article">Delete</button>
          </div>
        </div>`
        )
        .join("");
    } catch (error) {
      console.error("Error fetching articles:", error);
    }
  }

  // Handle form submission
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    console.log("Form submission triggered");

    const title = document.getElementById("article-title").value.trim();
    const content = document.getElementById("article-content").value.trim();
    const imageFile = document.getElementById("article-image").files[0];

    if (!title || !content) {
      alert("Title and content are required.");
      return;
    }

    console.log("Title:", title);
    console.log("Content:", content);
    console.log("Image file:", imageFile);

    let image = null;
    if (imageFile) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        image = reader.result;
        console.log("Image base64 data:", image);

        // Submit article
        try {
          const response = await fetch("https://mai.fly.dev/api/articles/add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, content, image }),
          });
          if (!response.ok) throw new Error("Failed to add article");
          console.log("Article added successfully");
          alert("Article added successfully");
          form.reset();
          fetchArticles();
        } catch (error) {
          console.error("Error adding article:", error);
        }
      };
      reader.readAsDataURL(imageFile);
    } else {
      // Submit article without image
      try {
        const response = await fetch("https://mai.fly.dev/api/articles/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, content }),
        });
        if (!response.ok) throw new Error("Failed to add article");
        console.log("Article added successfully");
        alert("Article added successfully");
        form.reset();
        fetchArticles();
      } catch (error) {
        console.error("Error adding article:", error);
      }
    }
  });

  // Handle article updates and deletions
  articlesList.addEventListener("click", async (e) => {
    const articleId = e.target.closest(".article")?.dataset.id;

    if (e.target.classList.contains("delete-article")) {
      try {
        const response = await fetch(`https://mai.fly.dev/api/articles/delete/${articleId}`, {
          method: "DELETE",
        });
        if (!response.ok) throw new Error("Failed to delete article");
        alert("Article deleted successfully");
        fetchArticles();
      } catch (error) {
        console.error("Error deleting article:", error);
      }
    } else if (e.target.classList.contains("edit-article")) {
      const newTitle = prompt("Enter new title:");
      const newContent = prompt("Enter new content:");

      if (newTitle && newContent) {
        try {
          const response = await fetch(`https://mai.fly.dev/api/articles/update/${articleId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: newTitle, content: newContent }),
          });
          if (!response.ok) throw new Error("Failed to update article");
          alert("Article updated successfully");
          fetchArticles();
        } catch (error) {
          console.error("Error updating article:", error);
        }
      }
    }
  });

  // Initial fetch
  fetchArticles();
});
  
  async function fetchArticlesAndSetupViews() {
  // Fetch articles and view counts
  try {
    const response = await fetch("https://mai.fly.dev/api/articles");
    if (!response.ok) {
      console.error("Failed to fetch articles");
      return;
    }

    const articles = await response.json();

    // Update view counts in the DOM
    articles.forEach((article) => {
  const articleElement = Array.from(document.querySelectorAll(".news-article"))
    .find((element) => element.getAttribute("data-title") === article.title);

      if (articleElement) {
        const viewsElement = articleElement.querySelector(".views");
        if (viewsElement) {
          viewsElement.textContent = article.views;
        }
      }
    });
  } catch (error) {
    console.error("Error fetching articles:", error);
  }

  // Increment view count on article click
  const articleLinks = document.querySelectorAll(".news-article a");
  articleLinks.forEach((link) => {
    link.addEventListener("click", async (e) => {
      e.preventDefault();
      const articleTitle = link.closest(".news-article").querySelector("data-title").textContent;

      try {
        await fetch("https://mai.fly.dev/api/articles/view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: articleTitle }),
        });

        // Optionally redirect or open the article
        console.log(`View count incremented for ${articleTitle}`);
      } catch (error) {
        console.error("Error incrementing view count:", error);
      }
    });
  });
}

// Call the async function on DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
  fetchArticlesAndSetupViews();
});
  

  // Reaction functionality
  const reactionButtons = document.querySelectorAll(".reaction-buttons button");

  reactionButtons.forEach((button) => {
  
    button.addEventListener("click", async (event) => {
      if (!localStorage.getItem("token")) {
  alert("Please log in to react to articles.");
  return;
}
      const isLike = event.target.classList.contains("like-btn");
      const countSpan = isLike
        ? event.target.querySelector(".like-count")
        : event.target.querySelector(".dislike-count");

      let currentCount = parseInt(countSpan.textContent, 10);
      currentCount++;
      countSpan.textContent = currentCount;

      // Optional: Save reaction to the backend
      const articleTitle = event.target.closest(".news-article").getAttribute("data-title");

console.log("Article Title:", articleTitle);

const reactionData = {
  title: articleTitle,
  reaction: isLike ? "like" : "dislike",
};

console.log("Reaction Data:", JSON.stringify(reactionData)); // Log as string

      try {
  const response = await fetch("https://mai.fly.dev/api/reactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(reactionData), // Ensure JSON formatting
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Failed to save reaction:", errorData.message);
  } else {
    console.log("Reaction successfully saved!");
  }
} catch (error) {
  console.error("Error:", error);
}
    });
  });
  
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