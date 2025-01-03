document.addEventListener('DOMContentLoaded', () => {
    const bubbleContainer = document.querySelector('.bubble-background');

    if (!bubbleContainer) {
        console.error('Bubble container not found!');
        return;
    }

    // Create 30 bubbles dynamically
    for (let i = 0; i < 30; i++) {
        const bubble = document.createElement('div');
        bubble.classList.add('bubble');

        // Random size between 20px and 120px
        const size = Math.random() * 100 + 20; 
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;

        // Random horizontal position (0% - 100%)
        const leftPosition = Math.random() * 100;
        bubble.style.left = `${leftPosition}%`;

        // Random animation duration (5s - 15s)
        bubble.style.animationDuration = `${Math.random() * 10 + 5}s`;

        // Random animation delay (0s - 5s)
        bubble.style.animationDelay = `${Math.random() * 5}s`;

        bubbleContainer.appendChild(bubble);
    }
});


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

  // preloader
  const preloader = document.getElementById("preloader");
  preloader.classList.remove("hidden");

  // Delay to show preloader before checking login status
  setTimeout(() => {
    preloader.style.display = "none"; // Hide preloader after delay
     const newsSection = document.getElementById("news");
    
    preloader.classList.add("hidden");
      
newsSection.classList.remove("hidden"); 
    

    const BASE_URL = "https://mai.fly.dev"; // Your backend URL
const token = localStorage.getItem("token");
    if (token) {
      // Show the dashboard if logged in
     dashboard.classList.remove("hidden");
    } else {
      // Show the login form if not logged in
      formContainer.classList.remove("hidden");
      
    }
  }, 1500); // Adjust time to suit your needs
  
  // Redirect for desktop users
  const isDesktop = window.innerWidth > 768;

  if (isDesktop) {
    // Redirect to the news page
    window.location.href = "./news.html";
  }

    const powText = document.getElementById('pow-text');
const messageBox = document.getElementById('message-box');

// For mouse devices (desktop)
powText.addEventListener('mousedown', function() {
  messageBox.style.display = 'block'; // Show message
});

powText.addEventListener('mouseup', function() {
  messageBox.style.display = 'none'; // Hide message
});

powText.addEventListener('mouseleave', function() {
  messageBox.style.display = 'none'; // Hide message if mouse leaves
});

// For touch devices (mobile)
powText.addEventListener('touchstart', function() {
  messageBox.style.display = 'block'; // Show message
});

powText.addEventListener('touchend', function() {
  messageBox.style.display = 'none'; // Hide message
});

powText.addEventListener('touchcancel', function() {
  messageBox.style.display = 'none'; // Hide message if touch is canceled
});

    let points = 0; // Initial points

// Fetch Points from Backend
async function fetchPoints() {
  try {
    const response = await fetch('https://your-backend-url/api/points');
    const data = await response.json();
    points = data.points || 0;
    updatePointsDisplay();
  } catch (error) {
    console.error('Error fetching points:', error);
  }
}

// Update Points on Backend
async function updatePoints(increment) {
  try {
    const response = await fetch('https://your-backend-url/api/points', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ increment }),
    });
    const data = await response.json();
    points = data.points;
    updatePointsDisplay();
  } catch (error) {
    console.error('Error updating points:', error);
  }
}

// Update Points Display on Dashboard and Dropdown
function updatePointsDisplay() {
  // Update Dashboard
  const dashboardPointsElement = document.getElementById('dashboard-points');
  if (dashboardPointsElement) {
    dashboardPointsElement.textContent = `${points.toFixed(1)} Points`;
  }

  // Update Dropdown
  const dropdownPointsElement = document.getElementById('user-points');
  if (dropdownPointsElement) {
    dropdownPointsElement.textContent = `${points.toFixed(1)} Points`;
  }
}

// Start Timer to Add Points Every 20 Seconds
setInterval(() => {
  updatePoints(0.1); // Increment points by 0.1 every 20 seconds
}, 20000);

// Initialize Points on Page Load
fetchPoints();


    
  
  // Register the service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js') // Path to your service worker file
      .then((registration) => {
        console.log('Service Worker registered:', registration);

        // Listen for updates to the service worker
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;

          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              // Notify user about the new version
              showUpdateNotification();
            }
          });
        });
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
  });
}

// Handle Install Button
let deferredPrompt;
const installButton = document.getElementById('install-button');

// Listen for the beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('beforeinstallprompt event fired');
  // Prevent the default browser prompt
  e.preventDefault();
  deferredPrompt = e;

  // Show the install button
  installButton.style.display = 'block';

  // Add a click event listener to the install button
  installButton.addEventListener('click', () => {
    console.log('Install button clicked');
    // Hide the install button
    installButton.style.display = 'none';

    // Show the install prompt
    deferredPrompt.prompt();

    // Handle user's choice
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      deferredPrompt = null; // Reset the deferredPrompt
    });
  });
});

// Optional: Listen for the appinstalled event
window.addEventListener('appinstalled', () => {
  console.log('App successfully installed');
  alert('App installed successfully!');
});

// Show update notification
function showUpdateNotification() {
  const updateBanner = document.createElement('div');
  updateBanner.id = 'update-banner';
  updateBanner.style.position = 'fixed';
  updateBanner.style.bottom = '20px';
  updateBanner.style.left = '50%';
  updateBanner.style.transform = 'translateX(-50%)';
  updateBanner.style.background = '#2C3E30';
  updateBanner.style.color = '#fff';
  updateBanner.style.padding = '10px 20px';
  updateBanner.style.borderRadius = '5px';
  updateBanner.style.zIndex = '9999';
  updateBanner.textContent = 'A new version is available. Click to update.';

  updateBanner.addEventListener('click', () => {
    updateApp();
    document.body.removeChild(updateBanner);
  });

  document.body.appendChild(updateBanner);
  
  // Optionally reload the page automatically after some time
  setTimeout(() => {
    window.location.reload();
  }, 3000);
}

// Update the app
function updateApp() {
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ action: 'skipWaiting' });
    window.location.reload();
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

  

// **Start Countdown Timer with Progress Circle Sync**
function startCountdown(remainingTime, totalTime) {
    if (countdownInterval) clearInterval(countdownInterval);

    const startTime = Date.now();
    const endTime = startTime + remainingTime;

    // Save endTime and totalTime in localStorage
    localStorage.setItem('countdownEndTime', endTime);
    localStorage.setItem('countdownTotalTime', totalTime || remainingTime);

    countdownInterval = setInterval(() => {
        const currentTime = Date.now();
        const timeLeft = endTime - currentTime;

        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            miningCountdown.textContent = "Next session available!";
            progressCircle.style.background = `conic-gradient(#2C3E30 100%, #718074 100%)`;
            localStorage.removeItem('countdownEndTime');
            localStorage.removeItem('countdownTotalTime');
        } else {
            const minutes = Math.floor(timeLeft / (60 * 1000));
            const seconds = Math.floor((timeLeft % (60 * 1000)) / 1000);
            miningCountdown.textContent = `Next session: ${minutes}m ${seconds}s`;

            // Update Progress Circle
            const totalTimeStored = parseInt(localStorage.getItem('countdownTotalTime'), 10);
            const progressPercentage = ((totalTimeStored - timeLeft) / totalTimeStored) * 100;
            progressCircle.style.background = `conic-gradient(
                #2C3E30 ${progressPercentage}%, 
                #718074 ${progressPercentage}% 100%
            )`;
        }
    }, 1000);
}

// **Resume Countdown on Page Load**
function resumeCountdown() {
    const endTime = parseInt(localStorage.getItem('countdownEndTime'), 10);
    const totalTime = parseInt(localStorage.getItem('countdownTotalTime'), 10);

    if (endTime && totalTime) {
        const currentTime = Date.now();
        const remainingTime = endTime - currentTime;

        if (remainingTime > 0) {
            startCountdown(remainingTime, totalTime); // Resume with remaining time and total time
        } else {
            // Timer expired
            localStorage.removeItem('countdownEndTime');
            localStorage.removeItem('countdownTotalTime');
            miningCountdown.textContent = "Next session available!";
            progressCircle.style.background = `conic-gradient(#2C3E30 100%, #718074 100%)`;
        }
    }
}

// **Ensure DOM is Loaded Before Initialization**

    
  
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

// Check if mining data exists in localStorage
let miningStartTime = localStorage.getItem('miningStartTime')
    ? parseInt(localStorage.getItem('miningStartTime'))
    : null;

let miningEndTime = localStorage.getItem('miningEndTime')
    ? parseInt(localStorage.getItem('miningEndTime'))
    : null;

 isMiningActive = localStorage.getItem('isMiningActive') === 'true';

// Start mining only if it's active
if (isMiningActive && miningStartTime && miningEndTime) {
    startMiningProgress();
}

// Function to start mining
function startMining() {
    if (!isMiningActive) {
        miningStartTime = Date.now();
        miningEndTime = miningStartTime + 3600 * 1000; // 1 hour later
        isMiningActive = true;

        // Save to localStorage
        localStorage.setItem('miningStartTime', miningStartTime);
        localStorage.setItem('miningEndTime', miningEndTime);
        localStorage.setItem('isMiningActive', 'true');

        startMiningProgress();
    }
}

// Function to update mining progress based on current time
function updateMiningProgress() {
    if (!isMiningActive || !miningStartTime || !miningEndTime) return;

    const currentTime = Date.now();
    if (currentTime >= miningEndTime) {
        miningProgress = 100;
        isMiningActive = false;
        clearInterval(miningInterval);

        // Clear localStorage
        localStorage.removeItem('miningStartTime');
        localStorage.removeItem('miningEndTime');
        localStorage.removeItem('isMiningActive');
    } else {
        miningProgress = ((currentTime - miningStartTime) / (miningEndTime - miningStartTime)) * 100;
    }

    // Update the circular progress bar
    progressCircle.style.background = `conic-gradient(
        #2C3E30 ${miningProgress}%, 
        #718074 ${miningProgress}% 100%
    )`;
}

// Start mining progress interval
function startMiningProgress() {
    miningInterval = setInterval(updateMiningProgress, 1000);
    updateMiningProgress(); // Initial call to set progress immediately
}

// Update progress when user returns to the app
document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
        updateMiningProgress();
    }
});
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
      miningProgress += 100 / 3600; // Each second, add 1/3600th of 100%
      const currentBalance = parseFloat(localStorage.getItem("minedBalance")) || 0;
     // const newBalance = currentBalance + 0.0005; // Add 0.0005 every second
      // Default mining rate
const defaultRate = 0.0005;

// Get referral count from user data
      const token = localStorage.getItem("token");
      const response = await fetch("https://mai.fly.dev/api/auth/details", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch user data");
    }

    
      const userData = await response.json();
      const referrals = userData.referrals || []; // Fallback to empty array if not found

const referralCount = referrals.length;

// Calculate the bonus multiplier based on referrals (5% per referral)
const referralBonus = 1 + (referralCount * 0.05); // 5% boost per referral

// Calculate the new balance with the referral bonus applied
const newBalance = currentBalance + (defaultRate * referralBonus);

// Update the local storage or display
localStorage.setItem("minedBalance", newBalance.toFixed(4));
minedBalanceDisplay.textContent = `${newBalance.toFixed(4)} MAI`;

      localStorage.setItem("miningProgress", miningProgress);
      localStorage.setItem("minedBalance", newBalance.toFixed(4));
      minedBalanceDisplay.textContent = `${newBalance.toFixed(4)} MAI`;

      /**progressCircle.style.background = `conic-gradient(
  #2C3E30 ${miningProgress}%, 
  #718074 ${miningProgress}% 100%
)`;**/
      
      function startCountdown(remainingTime) {
    if (countdownInterval) clearInterval(countdownInterval);

    const totalTime = remainingTime; // Store initial remaining time for reference

    countdownInterval = setInterval(() => {
        if (remainingTime <= 0) {
            clearInterval(countdownInterval);
            miningCountdown.textContent = "Next session available!";
            progressCircle.style.background = `conic-gradient(#2C3E30 100%, #718074 100%)`;
        } else {
            const minutes = Math.floor(remainingTime / (60 * 1000));
            const seconds = Math.floor((remainingTime % (60 * 1000)) / 1000);
            miningCountdown.textContent = `Next session: ${minutes}m ${seconds}s`;

            // Update Progress Bar
            let progressPercentage = ((totalTime - remainingTime) / totalTime) * 100;
            progressPercentage = Math.min(progressPercentage, 100); // Ensure it doesn't exceed 100%

            progressCircle.style.background = `conic-gradient(
                #2C3E30 ${progressPercentage}%, 
                #718074 ${progressPercentage}% 100%
            )`;

            remainingTime -= 1000;
        }
    }, 1000);
}

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

  // Get DOM elements
const newsPopup = document.getElementById("news-popup");

// Show popup function
function showPopup() {
  newsPopup.classList.remove("hidden"); // Show popup
  setTimeout(() => {
    newsPopup.classList.add("hidden"); // Hide popup after 5 seconds
  }, 10000); // Adjust time as needed
}

// Add click event to Activate Mining button
activateMiningButton.addEventListener("click", () => {
  showPopup(); // Show popup on click
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
  
   // Toggle Between Login and Register Forms
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

// Automatically Switch to Registration Form if Referral Code Exists
const urlParams = new URLSearchParams(window.location.search);
const referralCode = urlParams.get("ref");

if (referralCode) {
  console.log("Referral Code Detected:", referralCode);

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

  // Prefill the referral code
  const referralInput = document.getElementById("referral-input");
  if (referralInput) {
    referralInput.value = referralCode;
  }
}

// Form Submit Listener
authForm.addEventListener("submit", (e) => {
  e.preventDefault();
  

  if (formTitle.textContent === "Register") {
    // Handle Registration
    console.log("Registering user...");
    // Add your registration logic here
  } else {
    // Handle Login
    console.log("Logging in user...");
  }
})
  
  
  const taskButton = document.getElementById("task-button");
if (taskButton) {
  taskButton.addEventListener("click", () => {
    window.location.href = "task.html";
  });
}
  

// Close the Task section
  
    

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
  window.toggleFullArticle = function(button) {
  const article = button.closest(".news-article");

  if (!article) {
    console.error("Article element not found!");
    return;
  }

  const shortDescription = article.querySelector("#short-description");
  const fullDescription = article.querySelector("#full-description");

  if (!shortDescription || !fullDescription) {
    console.error("Descriptions not found!");
    return;
  }

  if (fullDescription.style.display === "none" || !fullDescription.style.display) {
    shortDescription.style.display = "none";
    fullDescription.style.display = "block";
    button.textContent = "Show Less";
  } else {
    shortDescription.style.display = "block";
    fullDescription.style.display = "none";
    button.textContent = "Read More";
  }
};

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

// Helper function to format numbers
function formatNumber(number) {
  if (number >= 1_000_000_000) {
    return (number / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "b";
  } else if (number >= 1_000_000) {
    return (number / 1_000_000).toFixed(1).replace(/\.0$/, "") + "m";
  } else if (number >= 1_000) {
    return (number / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
  } else {
    return number;
  }
}

// Fetch reactions and update UI
async function updateReactionCounts() {
  console.log("Fetching reaction counts for all articles...");

  try {
    const response = await fetch("https://mai.fly.dev/api/articles");
    const data = await response.json();

    // Check if response is successful
    if (!response.ok || !data.success) {
      throw new Error(data.message || "Failed to fetch articles.");
    }

    const articlesData = data.data;

    if (!Array.isArray(articlesData)) {
      console.error("Unexpected data format: articlesData is not an array");
      return;
    }

    // Select all article elements
    const articleElements = document.querySelectorAll(".news-article");

    articlesData.forEach((article) => {
      const articleElement = Array.from(articleElements).find(
        (el) => el.getAttribute("data-title") === article.title
      );

      if (articleElement) {
        const likeCountElement = articleElement.querySelector(".like-count");
        const dislikeCountElement = articleElement.querySelector(".dislike-count");
        const viewCountElement = articleElement.querySelector(".views");

        // Safely update counts with formatted values
        if (likeCountElement) {
          likeCountElement.textContent = formatNumber(article.likes || 0);
        } else {
          console.warn(`Like count element not found for article: ${article.title}`);
        }

        if (dislikeCountElement) {
          dislikeCountElement.textContent = formatNumber(article.dislikes || 0);
        } else {
          console.warn(`Dislike count element not found for article: ${article.title}`);
        }

        if (viewCountElement) {
          viewCountElement.textContent = formatNumber(article.views || 0);
        } else {
          console.warn(`View count element not found for article: ${article.title}`);
        }
      } else {
        console.warn(`No article element found for title: ${article.title}`);
      }
    });

    console.log("Reaction counts updated successfully.");
  } catch (error) {
    console.error("Error fetching and updating reaction counts:", error);
  }
}

// Retry mechanism for `updateReactionCounts`
function retryUpdateReactionCounts(maxRetries = 3, delay = 2000) {
  let attempts = 0;

  const retry = async () => {
    attempts++;
    try {
      await updateReactionCounts();
      console.log("Reaction counts updated successfully.");
    } catch (error) {
      if (attempts < maxRetries) {
        console.warn(`Retrying... Attempt ${attempts}`);
        setTimeout(retry, delay);
      } else {
        console.error("Failed to update reaction counts after multiple attempts:", error);
      }
    }
  };

  retry();
}

// Run the retry mechanism on page load
retryUpdateReactionCounts();

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
  
menuIcon.addEventListener("click", async () => {
  event.stopPropagation(); // Prevent event from bubbling up to the document
  
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

    const { username, email, balance, referrals, referralCode, name } = user;

    const referralCount = referrals.length;
    let streakLevel;
    if (referralCount < 5) streakLevel = "Regular";
    else if (referralCount < 10) streakLevel = "Intermediate";
    else if (referralCount < 20) streakLevel = "Partner";
    else if (referralCount < 30) streakLevel = "Advanced";
    else if (referralCount < 50) streakLevel = "Expert";
    else streakLevel = "Master";


    // Construct referral link

const referralLink = `Mai is an AI language model. Early users who complete daily tasks are rewarded with Mai ai crypto token, join using my referral link: https://mai-psi.vercel.app/register?ref=${referralCode}`;
    console.log("Referral link constructed:", referralLink);

  // Default mining rate
const defaultRate = 0.0005;

// Get referral count from user data
//const referralCount = referrals.length;

// Calculate the bonus multiplier based on referrals (5% per referral)
const referralBonus = 1 + (referralCount * 0.05); // 5% boost per referral

// Optional: Cap the referral bonus multiplier to prevent extreme boosts
const cappedReferralBonus = Math.min(referralBonus, 2); // Max 100% bonus

// Calculate the dynamic mining rate
const miningRate = defaultRate * cappedReferralBonus;

// Display mining rate
const miningRateDisplay = document.getElementById("mining-rate");
if (miningRateDisplay) {
  miningRateDisplay.textContent = `Mining Rate: ${miningRate.toFixed(5)} MAI/sec`;
}

// Calculate new balance
    const currentBalance = parseFloat(localStorage.getItem("minedBalance")) || 0;
const newBalance = currentBalance + miningRate;

// Update balance in localStorage and UI
localStorage.setItem("minedBalance", newBalance.toFixed(4));
minedBalanceDisplay.textContent = `${newBalance.toFixed(4)} MAI`;
      
     
    
    // Update dropdown content
// Update dropdown content
userInfoDropdown.innerHTML = `
  <p style="text-align: center"><strong>MAI App</strong></p>
  <p><i class="fas fa-user"></i> <strong></strong> ${name}</p>
  <p><i class="fas fa-user-tag"></i> <strong></strong> ${username}</p>
  <p><i class="fas fa-envelope"></i> <strong></strong> ${email}</p>
  <p><i class="fas fa-fire"></i> <strong></strong> ${streakLevel}</p>
  <p><i class="fas fa-cogs"></i> <strong></strong> ${miningRate.toFixed(5)} MAI/sec</p>
  <p><i class="fas fa-wallet"></i> <strong></strong> ${balance.toFixed(5)} MAI</p>
  <p><i class="fas fa-users"></i> <strong></strong> ${referralCount}</p>
  <p><i class="fas fa-star"></i> <strong></strong> <span id="user-points">0.0 Points</span></p>

  
  <hr>
  
  <p><i class="fas fa-toolbox"></i> <strong><a href="more.html#utilities">Utilities</a></strong></p>
  <p><i class="fas fa-road"></i> <strong><a href="more.html#roadmap">Roadmap</a></strong></p>
  <p><i class="fas fa-file-alt"></i> <strong><a href="#">White Paper</a></strong></p>
  <p><i class="fas fa-question-circle"></i> <strong><a href="more.html#fag">FAQs</a></strong></p>
  <p><i class="fas fa-shield-alt"></i> <strong><a href="more.html#privacy-policy">Privacy Policy</a></strong></p>
  
  <hr>
  
  <p><i class="fas fa-link"></i> <strong>Referral Link:</strong></p>
  <button id="share-button"><i class="fas fa-share-alt"></i> Share</button>
  <button id="logout-button"><i class="fas fa-sign-out-alt"></i> Log Out</button>
    <p>v1.03</p>
`;

    userInfoDropdown.classList.toggle("active");


  
// Add event listener for the share button click
const shareButton = document.getElementById("share-button");

if (shareButton) {
  shareButton.addEventListener("click", () => {
    // Toggle the "clicked" class to change color to dark green
    shareButton.classList.toggle("clicked");

    // Show or hide share options
    const existingShareOptions = document.getElementById("share-options");

    if (existingShareOptions) {
      // If share options exist, hide them
      existingShareOptions.remove();
    } else {
      // If share options do not exist, show them directly below the share button
      const shareOptions = `
        <div id="share-options" style="margin-top: 10px;">
          <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}" target="_blank">Share on Facebook</a><br>
          <a href="https://api.whatsapp.com/send?text=${encodeURIComponent("Mai is an AI language model. Early users who complete daily tasks are rewarded with Mai ai crypto token, join using my referral link: " + referralLink)}" target="_blank">Share on WhatsApp</a><br>
          <a href="https://www.instagram.com/" target="_blank">Share on Instagram</a><br>
          <button id="copy-link">Copy Link</button>
        </div>
      `;
      
      // Insert the share options directly below the share button
      shareButton.insertAdjacentHTML("afterend", shareOptions);

      // Add copy link functionality after appending the link
      const copyLinkButton = document.getElementById("copy-link");
      if (copyLinkButton) {
        copyLinkButton.addEventListener("click", () => {
          navigator.clipboard
            .writeText(referralLink)
            .then(() => alert("Referral link copied to clipboard!"))
            .catch((err) => console.error("Failed to copy referral link:", err));
        });
      }
    }
  });
}

    
    // Close dropdown when clicking outside
document.addEventListener("click", (event) => {
  if (
    userInfoDropdown.classList.contains("active") &&
    !userInfoDropdown.contains(event.target) && // Check if clicked outside dropdown
    event.target !== menuIcon // Check if clicked is not the menu icon
  ) {
    userInfoDropdown.classList.remove("active");
  }
});
    
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

// Function to fetch the user data (adjust based on your API)
async function fetchUserData() {
  try {
    // Assuming you have a token stored in localStorage for authentication
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found. Please log in.");
      return;
    }

    // Make an API call to fetch the user's referral data (replace with your actual API endpoint)
    const response = await fetch("https://mai.fly.dev/api/auth/details", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch user data");
    }

    const userData = await response.json();

    // Assuming the response contains a 'referrals' array
    const referrals = userData.referrals || []; // Fallback to empty array if not found

    // Now calculate the streak level dynamically based on referral count
    const referralCount = referrals.length;
    let streakLevel;
    if (referralCount < 5) streakLevel = "Regular";
    else if (referralCount < 10) streakLevel = "Intermediate";
    else if (referralCount < 20) streakLevel = "Partner";
    else if (referralCount < 30) streakLevel = "Advanced";
    else if (referralCount < 50) streakLevel = "Expert";
    else streakLevel = "Master";


    // Populate the streak level in the dashboard
    const streakLevelContainer = document.getElementById("streak-level-container");

    if (streakLevelContainer) {
      streakLevelContainer.innerHTML = `
        <div class="streak-level">
          <span id="current-streak-level">Level: <strong>${streakLevel}</strong></span>
          <button id="streak-dropdown-toggle">▼</button>
        </div>
        <div id="streak-dropdown" class="hidden">
          <ul>
            <li>Regular</li>
            <li>Intermediate</li>
            <li>Partner</li>
            <li>Advanced</li>
            <li>Expert</li>
            <li>Master</li>
          </ul>
        </div>
      `;
    }

    // Add event listener for dropdown toggle
    const streakDropdownToggle = document.getElementById("streak-dropdown-toggle");
    const streakDropdown = document.getElementById("streak-dropdown");

    if (streakDropdownToggle) {
      streakDropdownToggle.addEventListener("click", () => {
        event.stopPropagation(); // Prevent the click from propagating to the document
        streakDropdown.classList.toggle("hidden");

        // Change button text based on dropdown visibility
        if (streakDropdown.classList.contains("hidden")) {
          streakDropdownToggle.textContent = "▼";
        } else {
          streakDropdownToggle.textContent = "▲";
        }
      });
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
  }
}

// Call the function to load user data on page load
fetchUserData();
  
  // footer btns
  document.getElementById("home-btn").addEventListener("click", () => {
    href = "#index.html"; // Navigate to Home
});

document.getElementById("news-btn").addEventListener("click", () => {
  window.location.href = "news.html"; // Navigate to News/Updates
});

document.getElementById("ai-btn").addEventListener("click", () => {
  window.location.href = "ai.html"; // Navigate to Mai AI
});

  
  document.getElementById("menu-btn").addEventListener("click", () => {
  window.location.href = "more.html"; // Navigate to Mai AI
});

  
  //document.getElementById("menu-btn").addEventListener("click", () => {
 // window.location.href = ""; // Navigate to Wallet
//});
  
//document.getElementById("wallet-btn").addEventListener("click", () => {
//window.location.href = ""; // Navigate to Wallet
//});
  
  // Restore session on page load
  checkPersistentLogin();
  console.log("checkPersistentLogin called");
});