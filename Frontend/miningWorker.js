const MINING_RATE = 0.0005; // Base mining rate per second
const MINING_DURATION = 3600; // 1 hour in seconds
const SYNC_INTERVAL = 10000; // Sync with backend every 10 seconds

let miningInterval;
let syncInterval;

console.log("Service Worker: Script loaded");

// Open or create IndexedDB
const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("MiningDB", 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("miningState")) {
        db.createObjectStore("miningState", { keyPath: "userId" });
      }
    };

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
};

// Save mining state
const saveMiningState = async (userId, state) => {
  const db = await openDB();
  const transaction = db.transaction("miningState", "readwrite");
  const store = transaction.objectStore("miningState");
  store.put({ userId, ...state });
};

// Get mining state
const getMiningState = async (userId) => {
  const db = await openDB();
  const transaction = db.transaction("miningState", "readonly");
  const store = transaction.objectStore("miningState");
  return new Promise((resolve, reject) => {
    const request = store.get(userId);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
};

// Calculate boosted mining rate
const calculateBoostedRate = (referrals) => {
  const boost = Math.min(referrals * 0.05, 1.0); // 5% boost per referral, max 100%
  return MINING_RATE * (1 + boost);
};

// Start mining
const startMining = async (userId, referrals) => {
  console.log("Service Worker: Starting mining for user", userId);

  let state = await getMiningState(userId);

  if (!state) {
    state = {
      balance: 0,
      timeLeft: MINING_DURATION,
      startTime: Date.now(),
      miningActive: true,
      referrals,
    };
  } else {
    state.miningActive = true;
    state.startTime = Date.now();
  }

  // Mining interval - increases balance every second
  miningInterval = setInterval(async () => {
    if (state.timeLeft <= 0) {
      stopMining(userId);
      return;
    }

    const boostedRate = calculateBoostedRate(referrals);
    state.balance = (parseFloat(state.balance) || 0) + boostedRate;
    state.timeLeft -= 1;

    await saveMiningState(userId, state);

    self.clients.matchAll().then((clients) =>
      clients.forEach((client) => client.postMessage({ type: "update", state }))
    );
  }, 1000);

  // **Sync balance with backend every 10 seconds**
  syncInterval = setInterval(async () => {
    try {
      console.log("Syncing balance with backend...");
      const response = await fetch("https://maicoin-41vo.onrender.com/api/mining/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userId}`,
        },
        body: JSON.stringify({
          balance: state.balance,
          sessionActive: state.miningActive,
          sessionStartTime: state.startTime,
          timeLeft: state.timeLeft,
        }),
      });

      if (!response.ok) {
        console.error("Failed to update backend:", await response.text());
      } else {
        console.log("Balance synced successfully!");
      }
    } catch (error) {
      console.error("Error syncing balance:", error);
    }
  }, SYNC_INTERVAL);
};

// Stop mining
const stopMining = async (userId) => {
  console.log("Service Worker: Stopping mining for user", userId);

  clearInterval(miningInterval);
  clearInterval(syncInterval);

  let state = await getMiningState(userId);
  if (state) {
    state.miningActive = false;
    await saveMiningState(userId, state);

    self.clients.matchAll().then((clients) =>
      clients.forEach((client) => client.postMessage({ type: "stop", state }))
    );
  }
};

// Handle messages
self.addEventListener("message", (event) => {
  const { type, userId, referrals } = event.data;

  if (type === "start") {
    startMining(userId, referrals);
  } else if (type === "stop") {
    stopMining(userId);
  } else if (type === "restore") {
    getMiningState(userId).then((state) => {
      if (state && state.miningActive) startMining(userId, state.referrals);
    });
  }
});

// Lifecycle events
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));