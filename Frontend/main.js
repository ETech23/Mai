document.addEventListener("DOMContentLoaded", () => {
    const activateMiningButton = document.getElementById("activate-mining");
    const miningCountdown = document.getElementById("mining-countdown");
    const minedBalanceDisplay = document.getElementById("mined-balance");
    const progressCircle = document.getElementById("progress-circle");
  
    // Register service worker
    navigator.serviceWorker.register('/service-worker.js')
        .then((registration) => {
            console.log('Service Worker registered:', registration);
        })
        .catch((error) => {
            console.error('Service Worker registration failed:', error);
        });
       
    let miningInterval;
    let countdownInterval;
    let isInitialSync = true; // Flag to track initial sync
    
    // Setup network status listener
    window.addEventListener('online', handleNetworkStatusChange);
    window.addEventListener('offline', handleNetworkStatusChange);

    // Proper sequence for app initialization
    initializeApp();
    
    // Attach Click Event to Mining Button
    if (activateMiningButton) {
        activateMiningButton.addEventListener("click", () => {
            const userId = getUserId();
            if (!userId) {
                alert("Please log in to start mining.");
                return;
            }

            if (getUserMiningStatus(userId)) {
                alert("Mining is already active!");
                return;
            }

            const miningDuration = 60 * 180 * 1000; // 3 hour
            const miningEndTime = Date.now() + miningDuration;
            const miningStartTime = Date.now();

            setUserMiningData(userId, {
                isMiningActive: true,
                miningProgress: "0",
                miningEndTime: miningEndTime.toString(),
                miningStartTime: miningStartTime.toString(),
                lastUpdateTime: Date.now().toString()
            });

            startCountdown(miningDuration);
            startMiningProcess(miningDuration);
        });
    } else {
        console.error("Mining button not found! Ensure the button ID is correct.");
    }

    // Handle when user comes back to the app
    document.addEventListener("visibilitychange", () => {
        const userId = getUserId();
        if (!userId) return;
        
        if (document.visibilityState === "visible") {
            console.log("App is visible again. Syncing data...");
            
            // First, get data from the backend
            if (navigator.onLine) {
                getBackendBalance().then(backendBalance => {
                    // Then calculate offline mining
                    const offlineMined = calculateOfflineMining(userId);
                    
                    // Set the local balance to backend + offline mined
                    if (backendBalance !== null) {
                        const newTotalBalance = backendBalance + offlineMined;
                        setUserMinedBalance(userId, newTotalBalance.toFixed(4));
                        updateUIBalance(newTotalBalance);
                        
                        // Then sync this combined balance back to the backend
                        if (offlineMined > 0) {
                            syncBalanceWithBackend(newTotalBalance, true);
                        }
                    }
                    
                    // Finally restore the mining session UI
                    restoreMiningSession(userId);
                });
            } else {
                // If offline, just calculate and show local mining
                const offlineMined = calculateOfflineMining(userId);
                const currentBalance = parseFloat(getUserMinedBalance(userId)) || 0;
                const newBalance = currentBalance + offlineMined;
                setUserMinedBalance(userId, newBalance.toFixed(4));
                updateUIBalance(newBalance);
                
                // Save for later sync
                if (offlineMined > 0) {
                    savePendingBalance(userId, newBalance);
                }
                
                restoreMiningSession(userId);
            }
            
            // Save the current time
            updateUserMiningData(userId, { lastUpdateTime: Date.now().toString() });
        } else {
            // Save the last time user left
            updateUserMiningData(userId, { lastUpdateTime: Date.now().toString() });
        }
    });

    // Regular check for offline mining and network status - run every 15 seconds
    setInterval(() => {
        const userId = getUserId();
        if (!userId) return;
        
        if (document.visibilityState === "visible" && navigator.onLine) {
            // When visible and online, periodically sync with backend
            const pendingBalance = getUserPendingBalance(userId);
            if (pendingBalance) {
                syncPendingBalances(userId);
            }
        }
    }, 15000);

    // Main App Initialization Function
    async function initializeApp() {
        const userId = getUserId();
        if (!userId) {
            console.log("No user logged in");
            return;
        }
        
        // First try to get the balance from backend
        if (navigator.onLine) {
            try {
                const backendBalance = await getBackendBalance();
                
                if (backendBalance !== null) {
                    // Calculate any offline mining
                    const offlineMined = calculateOfflineMining(userId);
                    console.log(`Backend balance: ${backendBalance}, Offline mined: ${offlineMined}`);
                    
                    // Set the new total balance
                    const newTotalBalance = backendBalance + offlineMined;
                    setUserMinedBalance(userId, newTotalBalance.toFixed(4));
                    
                    // Update UI with the combined balance
                    updateUIBalance(newTotalBalance);
                    
                    // Sync back to backend if we mined while offline
                    if (offlineMined > 0) {
                        await syncBalanceWithBackend(newTotalBalance, true);
                    }
                } else {
                    // If backend balance fetch failed, use local
                    updateUIFromStoredValues(userId);
                }
            } catch (error) {
                console.error("Failed to initialize app with backend data:", error);
                updateUIFromStoredValues(userId);
            }
        } else {
            // Offline mode - just use local storage
            calculateOfflineMining(userId);
            updateUIFromStoredValues(userId);
        }
        
        // Always restore mining session
        restoreMiningSession(userId);
        isInitialSync = false;
    }
});

// USER-SPECIFIC STORAGE FUNCTIONS

// Get the current user ID from token
function getUserId() {
    const token = localStorage.getItem("token");
    if (!token) return null;
    
    try {
        // Extract user ID from JWT token
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const payload = JSON.parse(jsonPayload);
        return payload.userId || payload.sub || payload.id; // Different JWT implementations use different fields
    } catch (e) {
        console.error("Error extracting user ID from token:", e);
        return null;
    }
}

// Get user-specific storage key
function getUserStorageKey(userId, key) {
    return `user_${userId}_${key}`;
}

// Get mining status for specific user
function getUserMiningStatus(userId) {
    return localStorage.getItem(getUserStorageKey(userId, "isMiningActive")) === 'true';
}

// Get mining data for specific user
function getUserMiningData(userId, key) {
    return localStorage.getItem(getUserStorageKey(userId, key));
}

// Set specific mining data for user
function setUserMiningData(userId, dataObject) {
    for (const [key, value] of Object.entries(dataObject)) {
        localStorage.setItem(getUserStorageKey(userId, key), value);
    }
}

// Update specific user mining data
function updateUserMiningData(userId, dataObject) {
    for (const [key, value] of Object.entries(dataObject)) {
        localStorage.setItem(getUserStorageKey(userId, key), value);
    }
}

// Get user mined balance
function getUserMinedBalance(userId) {
    return localStorage.getItem(getUserStorageKey(userId, "minedBalance")) || "0";
}

// Set user mined balance
function setUserMinedBalance(userId, balance) {
    localStorage.setItem(getUserStorageKey(userId, "minedBalance"), balance);
}

// Get user pending balance
function getUserPendingBalance(userId) {
    return localStorage.getItem(getUserStorageKey(userId, "pendingBalance"));
}

// Set user pending balance
function setUserPendingBalance(userId, balance) {
    localStorage.setItem(getUserStorageKey(userId, "pendingBalance"), balance);
}

// Remove user pending balance
function removeUserPendingBalance(userId) {
    localStorage.removeItem(getUserStorageKey(userId, "pendingBalance"));
}

// Clear all mining data for a user
function clearUserMiningData(userId) {
    const keysToRemove = [
        "isMiningActive", "miningProgress", "miningEndTime", 
        "miningStartTime", "lastUpdateTime", "alerted"
    ];
    
    keysToRemove.forEach(key => {
        localStorage.removeItem(getUserStorageKey(userId, key));
    });
}

// ORIGINAL FUNCTIONS UPDATED TO USE USER-SPECIFIC STORAGE

// Get balance from backend
async function getBackendBalance() {
    const token = localStorage.getItem("token");
    if (!token) return null;
    
    try {
        const response = await fetch("https://maicoin-41vo.onrender.com/api/auth/details", {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
        });
        
        if (!response.ok) throw new Error("Failed to fetch user data");
        
        const userData = await response.json();
        return userData.balance || 0; // Return the backend balance
    } catch (error) {
        console.error("Failed to get backend balance:", error);
        return null;
    }
}

// Network status change handler
function handleNetworkStatusChange(event) {
    console.log(`Network status changed: ${event.type}`);
    const userId = getUserId();
    if (!userId) return;
    
    if (event.type === 'online') {
        // We're back online, sync immediately
        syncPendingBalances(userId);
    }
}

// Update UI with stored values
function updateUIFromStoredValues(userId) {
    const minedBalanceDisplay = document.getElementById("mined-balance");
    const storedBalance = parseFloat(getUserMinedBalance(userId)) || 0;
    
    if (minedBalanceDisplay) {
        minedBalanceDisplay.textContent = `${storedBalance.toFixed(4)} MAI`;
    }
    
    // Update the mining button state
    const activateMiningButton = document.getElementById("activate-mining");
    const isMiningActive = getUserMiningStatus(userId);
    
    if (activateMiningButton && isMiningActive) {
        activateMiningButton.textContent = "Mining...";
        activateMiningButton.disabled = true;
    }
}

// Update UI balance specifically
function updateUIBalance(balance) {
    const minedBalanceDisplay = document.getElementById("mined-balance");
    if (minedBalanceDisplay) {
        minedBalanceDisplay.textContent = `${balance.toFixed(4)} MAI`;
    }
}

// Calculate and return any mining that happened while the app was closed
function calculateOfflineMining(userId) {
    const miningEndTime = parseInt(getUserMiningData(userId, "miningEndTime")) || 0;
    const lastUpdateTime = parseInt(getUserMiningData(userId, "lastUpdateTime")) || Date.now();
    const now = Date.now();
    
    // Only process if mining was active
    if (miningEndTime > 0 && getUserMiningStatus(userId)) {
        let timeToProcess;
        
        if (now >= miningEndTime) {
            // Mining session ended while offline
            timeToProcess = Math.max(0, miningEndTime - lastUpdateTime);
            
            // Mark mining as complete if it hasn't been done already
            if (getUserMiningStatus(userId)) {
                console.log("Mining session completed while offline");
                resetMiningSession(userId, false); // Don't show alert for offline completion
            }
        } else {
            // Mining session still active
            timeToProcess = now - lastUpdateTime;
        }
        
        // Calculate earned tokens during offline period
        if (timeToProcess > 1000) { // At least 1 second
            const elapsedSeconds = Math.floor(timeToProcess / 1000);
            
            if (elapsedSeconds > 0) {
                // Calculate how much was mined offline based on referral data
                // For now, use the base rate - we'll get referral data when online
                const miningRatePerSecond = 0.0005; // Base mining rate
                const offlineMined = elapsedSeconds * miningRatePerSecond;
                console.log(`Mined offline: ${offlineMined.toFixed(4)} over ${elapsedSeconds} seconds`);
                return offlineMined;
            }
        }
    }
    
    updateUserMiningData(userId, { lastUpdateTime: now.toString() });
    return 0; // Return 0 if no mining happened
}

// Restore Mining Session
function restoreMiningSession(userId) {
    const miningEndTime = parseInt(getUserMiningData(userId, "miningEndTime")) || 0;
    const now = Date.now();

    if (miningEndTime > now && getUserMiningStatus(userId)) {
        const remainingTime = miningEndTime - now;
        startCountdown(remainingTime);
        startMiningProcess(remainingTime);
    } else if (miningEndTime <= now && getUserMiningStatus(userId)) {
        // Mining should have finished while app was closed
        resetMiningSession(userId, false); // Don't show alert for expired sessions
    }
}

// Reset Mining Session After Completion
function resetMiningSession(userId, showAlert = true) {
    // Clear all mining data for user
    updateUserMiningData(userId, {
        isMiningActive: "false",
        miningProgress: "",
        miningEndTime: "",
        miningStartTime: ""
    });

    if (showAlert && !getUserMiningData(userId, "alerted")) {
        alert("Mining session completed!");
        updateUserMiningData(userId, { alerted: "true" });
    } else if (!showAlert) {
        localStorage.removeItem(getUserStorageKey(userId, "alerted")); // Allow next alert
    }

    const activateMiningButton = document.getElementById("activate-mining");
    const progressCircle = document.getElementById("progress-circle");
    const miningCountdown = document.getElementById("mining-countdown");
    
    if (activateMiningButton) {
        activateMiningButton.textContent = "Activate Mining";
        activateMiningButton.disabled = false;
    }
    
    if (progressCircle) {
        progressCircle.style.background = `conic-gradient(#2C3E30 100%, #718074 100%)`;
    }
    
    if (miningCountdown) {
        miningCountdown.textContent = "Next session available!";
    }
    
    // Final backend sync before finishing
    if (navigator.onLine) {
        const finalBalance = parseFloat(getUserMinedBalance(userId)) || 0;
        syncBalanceWithBackend(finalBalance, true);
    }
}

// Start Countdown Timer and Update Mining Progress
  // Start Countdown Timer and Update Mining Progress
function startCountdown(remainingTime) {
    const userId = getUserId();
    if (!userId) return;

    if (countdownInterval) clearInterval(countdownInterval);

    const miningCountdown = document.getElementById("mining-countdown");
    const progressCircle = document.getElementById("progress-circle");

    const endTime = Date.now() + remainingTime;
    const totalTime = 3 * 60 * 60 * 1000; // 3 hours in milliseconds

    countdownInterval = setInterval(() => {
        const currentTime = Date.now();
        const timeLeft = endTime - currentTime;

        if (timeLeft <= 0) {
            clearInterval(countdownInterval);

            if (miningCountdown) {
                miningCountdown.textContent = "Next session available!";
            }

            if (progressCircle) {
                progressCircle.style.background = `conic-gradient(#2C3E50 100%, #718074 100%)`;
            }

            resetMiningSession(userId, true);
        } else {
            const hours = Math.floor(timeLeft / (60 * 60 * 1000)); // Calculate hours
const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000)); // Calculate minutes
const seconds = Math.floor((timeLeft % (60 * 1000)) / 1000); // Calculate seconds

if (miningCountdown) {
    miningCountdown.textContent = `Next session: ${hours}h ${minutes}m ${seconds}s`;
}
          // Calculate progress percentage
            const progressPercentage = 100 - ((timeLeft / totalTime) * 100);
            
            if (progressCircle) {
                progressCircle.style.background = `conic-gradient(
                    #2C3E30 ${progressPercentage}%, 
                    #718074 ${progressPercentage}% 100%
                )`;
            }
            
            // Save progress percentage for resuming after refresh
            updateUserMiningData(userId, { miningProgress: progressPercentage.toString() });
        }
    }, 1000);
}

// Start Mining Process and Sync Balance
function startMiningProcess(remainingTime) {
    const userId = getUserId();
    if (!userId) return;
    
    if (miningInterval) clearInterval(miningInterval);
    
    const miningEndTime = Date.now() + remainingTime;

    const activateMiningButton = document.getElementById("activate-mining");
    if (activateMiningButton) {
        activateMiningButton.textContent = "Mining...";
        activateMiningButton.disabled = true;
    }

    miningInterval = setInterval(async () => {
        const now = Date.now();
        
        if (now >= miningEndTime) {
            clearInterval(miningInterval);
            resetMiningSession(userId, true);
            return;
        }

        updateMiningBalance(userId);
        updateUserMiningData(userId, { lastUpdateTime: now.toString() });
    }, 1000);
}

// Update Balance During Active Mining
async function updateMiningBalance(userId) {
    const currentBalance = parseFloat(getUserMinedBalance(userId)) || 0;
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        const response = await fetch("https://maicoin-41vo.onrender.com/api/auth/details", {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Failed to fetch user data");

        const userData = await response.json();
        const referralCount = (userData.referrals || []).length;
        const referralBonus = 1 + (referralCount * 0.05);
        
        // Base Mining rate per second (0.0005 per second)
        const miningRatePerSecond = 0.0005;
        const newAmount = miningRatePerSecond * referralBonus;
        const newBalance = currentBalance + newAmount;

        // Store the updated balance
        setUserMinedBalance(userId, newBalance.toFixed(4));
        
        // Update UI immediately
        updateUIBalance(newBalance);

        // Sync with backend every 30 seconds
        if (Math.floor(Date.now() / 1000) % 30 === 0) {
            if (navigator.onLine) {
                await syncBalanceWithBackend(newBalance);
            } else {
                savePendingBalance(userId, newBalance);
            }
        }
    } catch (error) {
        console.error("Failed to update balance:", error);
        const newBalance = currentBalance + 0.0005; // Add base rate if user data fetch fails
        setUserMinedBalance(userId, newBalance.toFixed(4)); // Still update local storage
        
        // Update UI even if backend sync fails
        updateUIBalance(newBalance);
        
        savePendingBalance(userId, newBalance);
    }
}

// Enhanced Sync Balance with Backend with priority flag
async function syncBalanceWithBackend(balance, isPriority = false) {
    const token = localStorage.getItem("token");
    const userId = getUserId();
    if (!token || !userId) return false;
    
    // Log sync attempt
    console.log(`Attempting to sync balance for user ${userId}: ${balance.toFixed(4)} (Priority: ${isPriority})`);

    try {
        const response = await fetch("https://maicoin-41vo.onrender.com/api/mining/update", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ balance: parseFloat(balance.toFixed(4)) }),
        });

        if (!response.ok) {
            console.error(`Backend update failed with status: ${response.status}`);
            throw new Error("Backend update failed");
        }

        console.log(`Balance successfully updated to backend for user ${userId}: ${balance.toFixed(4)}`);
        removeUserPendingBalance(userId);
        
        // Record last successful sync time
        updateUserMiningData(userId, { lastSuccessfulSync: Date.now().toString() });
        
        return true;
    } catch (error) {
        console.error(`Failed to sync balance with backend for user ${userId}:`, error);
        savePendingBalance(userId, balance);
        
        // If this was a priority sync, try again after a short delay
        if (isPriority && navigator.onLine) {
            console.log(`Will retry priority sync for user ${userId} after 5 seconds`);
            setTimeout(() => {
                syncBalanceWithBackend(balance, true);
            }, 5000);
        }
        
        return false;
    }
}

// Enhanced Save Pending Balance
function savePendingBalance(userId, balance) {
    if (balance <= 0) return;
    
    setUserPendingBalance(userId, balance.toFixed(4));
    console.log(`Saved pending balance for user ${userId} for future sync: ${balance.toFixed(4)}`);
}

// Enhanced Sync Pending Balance
async function syncPendingBalances(userId) {
    const pendingBalance = parseFloat(getUserPendingBalance(userId) || "0");
    const currentBalance = parseFloat(getUserMinedBalance(userId) || "0");
    
    // If no pending balance, just exit
    if (pendingBalance <= 0) return;
    
    // Always sync the higher of the two balances
    const balanceToSync = Math.max(pendingBalance, currentBalance);
    
    console.log(`Syncing pending balance for user ${userId}: ${balanceToSync.toFixed(4)}`);
    
    const success = await syncBalanceWithBackend(balanceToSync, true);
    
    if (success) {
        console.log(`Successfully synced pending balance for user ${userId}`);
        removeUserPendingBalance(userId);
    } else {
        console.error(`Failed to sync pending balance for user ${userId}, will retry later`);
        // The error handling in syncBalanceWithBackend already saves the pending balance
    }
}