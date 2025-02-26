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
    request.onsuccess = () => resolve(request.result || {});
    request.onerror = () => reject(request.error);
  });
};

// Calculate boosted mining rate
const calculateBoostedRate = (referrals) => {
  const boost = Math.min(referrals * 0.05, 1.0); // 5% boost per referral, max 100%
  return MINING_RATE * (1 + boost);
};

// Restore mining session
const restoreMiningSession = async (userId) => {
  let state = await getMiningState(userId);

  if (state.miningActive) {
    const elapsedTime = Math.floor((Date.now() - state.startTime) / 1000);
    state.timeLeft = Math.max(0, state.timeLeft - elapsedTime);
    await saveMiningState(userId, state);
  }
  return state;
};

// Start mining
const startMining = async (userId, referrals) => {
  console.log("Service Worker: Starting mining for user", userId);

  let state = await restoreMiningSession(userId);
  state.balance = parseFloat(state.balance) || 0;

  if (!state.miningActive) {
    state = {
      balance: state.balance,
      timeLeft: MINING_DURATION,
      startTime: Date.now(),
      miningActive: true,
      referrals,
    };
  }

  miningInterval = setInterval(async () => {
    if (state.timeLeft <= 0) {
      stopMining(userId);
      return;
    }

    state.balance += calculateBoostedRate(referrals);
    state.timeLeft -= 1;
    await saveMiningState(userId, state);

    self.clients.matchAll().then((clients) =>
      clients.forEach((client) => client.postMessage({ type: "update", state }))
    );
  }, 1000);

  syncInterval = setInterval(async () => {
    try {
      await fetch("https://maicoin-41vo.onrender.com/api/mining/update", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${userId}` },
        body: JSON.stringify(state),
      });
    } catch (error) {
      console.error("Failed to sync with backend:", error);
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

  if (type === "start") startMining(userId, referrals);
  else if (type === "stop") stopMining(userId);
  else if (type === "restore") restoreMiningSession(userId).then((state) => startMining(userId, state.referrals));
});

// Lifecycle events
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));