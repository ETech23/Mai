// Register the Service Worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/miningworker.js") // Correct path to the Service Worker file
    .then((registration) => {
      console.log("Service Worker registered:", registration);

      // Listen for the Service Worker to become active
      registration.addEventListener("updatefound", () => {
        const installingWorker = registration.installing;
        installingWorker.addEventListener("statechange", () => {
          if (installingWorker.state === "activated") {
            console.log("Service Worker activated");
          }
        });
      });
    })
    .catch((error) => {
      console.error("Service Worker registration failed:", error);
    });
}

// Get DOM elements
const miningButton = document.getElementById("activate-mining");
const balanceDisplay = document.getElementById("mined-balance");
const countdownDisplay = document.getElementById("mining-countdown");
const progressCircle = document.getElementById("progressCircle");

let userData = {
  userId: localStorage.getItem("token"),
  referrals: 0, // Replace with actual referral count
  miningActive: false,
};

// Update the UI
const updateUI = (state) => {
  if (balanceDisplay) {
    balanceDisplay.textContent = state.balance.toFixed(4) + " MAI";
  }

  if (countdownDisplay) {
    countdownDisplay.textContent = state.timeLeft > 0
      ? `Mining ends in: ${Math.floor(state.timeLeft / 60)}m ${state.timeLeft % 60}s`
      : "Mining session completed!";
  }

  if (miningButton) {
    if (state.miningActive) {
      miningButton.textContent = "Mining...";
      miningButton.disabled = true;
    } else {
      miningButton.textContent = "Start Mining";
      miningButton.disabled = state.timeLeft <= 0;
    }
  }

  if (progressCircle) {
    const progressPercentage = ((MINING_DURATION - state.timeLeft) / MINING_DURATION) * 100;
    progressCircle.style.background = `conic-gradient(
      #2C3E30 ${progressPercentage}%, 
      #718074 ${progressPercentage}% 100%
    )`;
  }
};

// Handle messages from the Service Worker
navigator.serviceWorker.addEventListener("message", (event) => {
  const { type, state } = event.data;

  if (type === "update") {
    console.log("Received update from Service Worker:", state);
    updateUI(state);
  } else if (type === "stop") {
    console.log("Mining session completed:", state);
    updateUI(state);
    alert("Mining session completed!");
  }
});

// Start mining
miningButton.addEventListener("click", () => {
  console.log("Activate Mining button clicked");

  navigator.serviceWorker.ready.then((registration) => {
    console.log("Service Worker ready");

    registration.active.postMessage({
      type: "start",
      userId: userData.userId,
      referrals: userData.referrals,
    });
  });
});

// Restore mining session on page load
navigator.serviceWorker.ready.then((registration) => {
  console.log("Restoring mining session");

  registration.active.postMessage({
    type: "restore",
    userId: userData.userId,
  });
});