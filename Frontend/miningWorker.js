const MINING_RATE = 0.0005; // Base mining rate per second
const MINING_DURATION = 3600; // 1 hour in seconds
const SYNC_INTERVAL = 10000; // Sync with backend every 10 seconds

let miningInterval;
let syncInterval;

console.log("Service Worker: Script loaded");

// Open or create an IndexedDB database
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

// Save mining state to IndexedDB
const saveMiningState = async (userId, state) => {
  const db = await openDB();
  const transaction = db.transaction("miningState", "readwrite");
  const store = transaction.objectStore("miningState");
  store.put({ userId, ...state });
};

// Get mining state from IndexedDB
const getMiningState = async (userId) => {
  const db = await openDB();
  const transaction = db.transaction("miningState", "readonly");
  const store = transaction.objectStore("miningState");
  return new Promise((resolve, reject) => {
    const request = store.get(userId);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Calculate boosted mining rate
const calculateBoostedRate = (referrals) => {
  const boost = Math.min(referrals * 0.05, 1.0); // 5% boost per referral, capped at 100%
  return MINING_RATE * (1 + boost);
};

// Start mining
const startMining = async (userId, referrals) => {
  console.log("Service Worker: Starting mining for user", userId);

  let state = await getMiningState(userId);

  if (!state || !state.miningActive) {
    state = {
      balance: 0,
      timeLeft: MINING_DURATION,
      startTime: Date.now(),
      miningActive: true,
    };
  }

  miningInterval = setInterval(async () => {
    if (state.timeLeft <= 0) {
      stopMining(userId);
      return;
    }

    const boostedRate = calculateBoostedRate(referrals);
    console.log("Boosted rate:", boostedRate);

    state.balance = parseFloat(state.balance) + boostedRate; // Ensure balance is a number
    state.timeLeft -= 1;
    await saveMiningState(userId, state);

    console.log("Updated state:", state);

    // Send updated state to the main thread
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({ type: "update", state });
      });
    });
  }, 1000);

  // Sync with backend every 10 seconds
  syncInterval = setInterval(async () => {
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
    }
  }, SYNC_INTERVAL);
};

// Stop mining
const stopMining = async (userId) => {
  console.log("Service Worker: Stopping mining for user", userId);

  clearInterval(miningInterval);
  clearInterval(syncInterval);

  const state = await getMiningState(userId);
  if (state) {
    state.miningActive = false;
    await saveMiningState(userId, state);

    // Notify the main thread
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({ type: "stop", state });
      });
    });
  }
};

// Handle messages from the main thread
self.addEventListener("message", (event) => {
  const { type, userId, referrals } = event.data;

  console.log("Service Worker: Received message", event.data);

  if (type === "start") {
    startMining(userId, referrals);
  } else if (type === "stop") {
    stopMining(userId);
  } else if (type === "restore") {
    console.log("Service Worker: Restoring mining session for user", userId);
    startMining(userId, referrals);
  }
});

// Handle Service Worker lifecycle events
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installed");
  self.skipWaiting(); // Activate immediately
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activated");
  event.waitUntil(self.clients.claim()); // Take control of all clients
});