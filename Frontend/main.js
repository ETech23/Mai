if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/miningWorker.js")
    .then((registration) => console.log("Service Worker registered:", registration))
    .catch((error) => console.error("Service Worker registration failed:", error));
}

const miningButton = document.getElementById("activate-mining");
const balanceDisplay = document.getElementById("mined-balance");
const countdownDisplay = document.getElementById("mining-countdown");
const progressCircle = document.getElementById("progressCircle");

let userData = {
  userId: localStorage.getItem("token"),
  referrals: 0,
  miningActive: false,
};

// Update UI
const updateUI = (state) => {
  if (!state) return;

  balanceDisplay.textContent = state.balance ? parseFloat(state.balance).toFixed(4) + " MAI" : "0.0000 MAI";
  countdownDisplay.textContent =
    state.timeLeft > 0 ? `Mining ends in: ${Math.floor(state.timeLeft / 60)}m ${state.timeLeft % 60}s` : "Session ended!";

  miningButton.textContent = state.miningActive ? "Mining..." : "Start Mining";
  miningButton.disabled = state.miningActive || state.timeLeft <= 0;

  const progressPercentage = ((MINING_DURATION - state.timeLeft) / MINING_DURATION) * 100;
  progressCircle.style.background = `conic-gradient(#2C3E30 ${progressPercentage}%, #718074 ${progressPercentage}% 100%)`;
};

// Handle Service Worker messages
navigator.serviceWorker.addEventListener("message", (event) => {
  if (event.data.type === "update") updateUI(event.data.state);
  if (event.data.type === "stop") {
    updateUI(event.data.state);
    alert("Mining session completed!");
  }
});

// Start mining
miningButton.addEventListener("click", () => {
  navigator.serviceWorker.ready.then((registration) => {
    registration.active.postMessage({ type: "start", userId: userData.userId, referrals: userData.referrals });
  });
});

// Restore session on load
navigator.serviceWorker.ready.then((registration) => {
  registration.active.postMessage({ type: "restore", userId: userData.userId });
});