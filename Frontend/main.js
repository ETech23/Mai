document.addEventListener("DOMContentLoaded", () => {
  const MINING_DURATION = 3600;

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("/miningWorker.js")
      .then((registration) => console.log("Service Worker registered:", registration))
      .catch((error) => console.error("Service Worker registration failed:", error));
  }

  const miningButton = document.getElementById("activate-mining");
  const balanceDisplay = document.getElementById("mined-balance");
  const countdownDisplay = document.getElementById("mining-countdown");

  let userData = {
    userId: localStorage.getItem("token"),
    referrals: 0,
    miningActive: false,
  };

  const updateUI = (state) => {
    if (!state) return;

    balanceDisplay.textContent = parseFloat(state.balance || 0).toFixed(4) + " MAI";
    countdownDisplay.textContent =
      state.timeLeft > 0 ? `Mining ends in: ${Math.floor(state.timeLeft / 60)}m ${state.timeLeft % 60}s` : "Session ended!";

    miningButton.textContent = state.miningActive ? "Mining..." : "Start Mining";
    miningButton.disabled = state.miningActive || state.timeLeft <= 0;
  };

  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data.type === "update") updateUI(event.data.state);
    if (event.data.type === "stop") {
      updateUI(event.data.state);
      alert("Mining session completed!");
    }
  });

  miningButton.addEventListener("click", async () => {
    console.log("Mining button clicked");

    navigator.serviceWorker.ready.then((registration) => {
      console.log("Service Worker ready, sending start message");

      registration.active.postMessage({
        type: "start",
        userId: userData.userId,
        referrals: userData.referrals,
      });
    });
  });

  navigator.serviceWorker.ready.then((registration) => {
    registration.active.postMessage({ type: "restore", userId: userData.userId });
  });
});