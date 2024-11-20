// Mining.js: Handles mining progress and activation logic

// DOM Elements
const progressCircle = document.getElementById("progress-circle");
const minedBalanceDisplay = document.getElementById("mined-balance");
const activateMiningButton = document.getElementById("activate-mining");

// State Variables
let isMiningActive = false;
let miningProgress = 0; // In percentage
let minedBalance = 0; // MAI balance
let miningInterval; // Reference to the interval

// Start Mining Function
function startMining() {
  if (isMiningActive) {
    alert("Mining is already active!");
    return;
  }

  // Reset progress and set mining as active
  isMiningActive = true;
  miningProgress = 0;
  updateProgressCircle();

  // Increment progress every minute and update balance every 10 minutes
  miningInterval = setInterval(() => {
    miningProgress += 1.67; // 1.67% per minute to reach 100% in 60 minutes
    updateProgressCircle();

    if (miningProgress % 16.67 === 0) {
      // Add 2 MAI every 10 minutes
      minedBalance += 2;
      updateMinedBalance();
    }

    if (miningProgress >= 100) {
      // Stop mining once progress reaches 100%
      stopMining();
      alert("Mining session completed! Activate again to continue.");
    }
  }, 60000); // Update every minute

  // Automatically deactivate mining after 3 hours
  setTimeout(() => {
    stopMining();
    alert("Mining session has expired. Activate mining again to continue.");
  }, 3 * 60 * 60 * 1000);
}

// Stop Mining Function
function stopMining() {
  clearInterval(miningInterval);
  isMiningActive = false;
}

// Update Progress Circle
function updateProgressCircle() {
  progressCircle.style.background = `conic-gradient(#0f0 ${miningProgress}%, #f00 ${miningProgress}%)`;
}

// Update Mined Balance
function updateMinedBalance() {
  minedBalanceDisplay.textContent = `${minedBalance} MAI`;
}

// Add Event Listener to Activate Mining Button
activateMiningButton.addEventListener("click", startMining);