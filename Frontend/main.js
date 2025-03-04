document.addEventListener("DOMContentLoaded", () => {
    const activateMiningButton = document.getElementById("activate-mining");
    const miningCountdown = document.getElementById("mining-countdown");
    const minedBalanceDisplay = document.getElementById("mined-balance");
    const progressCircle = document.getElementById("progress-circle");
  
    // Register service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js')
            .then((registration) => {
                console.log('Service Worker registered:', registration);
            })
            .catch((error) => {
                console.error('Service Worker registration failed:', error);
            });
    }
    
    // Function to update the notification count
    function updateNotificationCount(count) {
        const badge = document.querySelector('.badge');
        const bell = document.querySelector('.bell');

        if (!badge || !bell) return;

        // Update the badge text
        badge.textContent = count;

        // Show/hide the badge and toggle animations
        if (count > 0) {
            badge.style.display = 'block';
            bell.classList.add('shake');
            badge.classList.add('pulse');
        } else {
            badge.style.display = 'none';
            bell.classList.remove('shake');
            badge.classList.remove('pulse');
        }
    }
    updateNotificationCount(3);
    setTimeout(() => updateNotificationCount(0), 35000);
       
    let miningInterval;
    let countdownInterval;
    let isInitialSync = true;
    
    // Constants for mining
    const BASE_MINING_RATE = 0.0005; // Tokens per second
    const REFERRAL_BONUS_RATE = 0.05; // 5% bonus per referral
    const MINING_DURATION = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
    const SYNC_INTERVAL = 30 * 1000; // Sync every 30 seconds
    const UPDATE_INTERVAL = 1000; // Update UI every second
    
    // Setup network status listener
    window.addEventListener('online', handleNetworkStatusChange);
    window.addEventListener('offline', handleNetworkStatusChange);

    // Initialize app
    initializeApp();
    
    // Attach Click Event to Mining Button
    if (activateMiningButton) {
        activateMiningButton.addEventListener("click", startMining);
    } else {
        console.error("Mining button not found! Ensure the button ID is correct.");
    }

    // Handle visibility changes (tab switching, app minimizing)
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Regular interval for syncing and maintenance - runs every 15 seconds
    setInterval(performPeriodicMaintenance, 15000);

    // FUNCTION DEFINITIONS

    // Start mining when button is clicked
    function startMining() {
        const userId = getUserId();
        if (!userId) {
            alert("Please log in to start mining.");
            return;
        }

        if (getUserMiningStatus(userId)) {
            alert("Mining is already active!");
            return;
        }

        const miningEndTime = Date.now() + MINING_DURATION;
        const miningStartTime = Date.now();

        // Store all mining session data
        setUserMiningData(userId, {
            isMiningActive: "true",
            miningProgress: "0",
            miningEndTime: miningEndTime.toString(),
            miningStartTime: miningStartTime.toString(),
            lastUpdateTime: Date.now().toString(),
            miningRate: BASE_MINING_RATE.toString(), // Store base rate, will be updated with referrals
            lastReferralCheck: Date.now().toString()
        });

        // Fetch user data to get initial referral count
        updateUserMiningRate(userId).then(() => {
            // Start the mining UI and process
            startCountdown(MINING_DURATION);
            startMiningProcess(MINING_DURATION);
        });
    }

    // Handle app visibility changes (switching tabs, minimizing)
    function handleVisibilityChange() {
        const userId = getUserId();
        if (!userId) return;
        
        if (document.visibilityState === "visible") {
            console.log("App is visible again. Syncing data...");
            
            // Calculate offline mining first
            const offlineMined = calculateOfflineMining(userId);
            
            // Then sync with backend if online
            if (navigator.onLine) {
                getBackendBalance().then(backendBalance => {
                    if (backendBalance !== null) {
                        const newTotalBalance = backendBalance + offlineMined;
                        setUserMinedBalance(userId, newTotalBalance.toFixed(4));
                        updateUIBalance(newTotalBalance);
                        
                        // Sync combined balance back to backend
                        if (offlineMined > 0) {
                            syncBalanceWithBackend(newTotalBalance, true);
                        }
                    } else {
                        // If backend fetch failed, use local balance + offline mining
                        const currentBalance = parseFloat(getUserMinedBalance(userId)) || 0;
                        const newBalance = currentBalance + offlineMined;
                        setUserMinedBalance(userId, newBalance.toFixed(4));
                        updateUIBalance(newBalance);
                    }
                    
                    // Update mining rate based on current referrals
                    updateUserMiningRate(userId);
                });
            } else {
                // If offline, just update local balance
                const currentBalance = parseFloat(getUserMinedBalance(userId)) || 0;
                const newBalance = currentBalance + offlineMined;
                setUserMinedBalance(userId, newBalance.toFixed(4));
                updateUIBalance(newBalance);
                
                // Save for later sync
                if (offlineMined > 0) {
                    savePendingBalance(userId, newBalance);
                }
            }
            
            // Restore mining session UI
            restoreMiningSession(userId);
            
            // Update the last time checked
            updateUserMiningData(userId, { lastUpdateTime: Date.now().toString() });
        } else {
            // Save the last time user left
            updateUserMiningData(userId, { lastUpdateTime: Date.now().toString() });
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
            // Update mining rate based on current referrals
            updateUserMiningRate(userId);
        }
    }

    // Periodic maintenance tasks
    function performPeriodicMaintenance() {
        const userId = getUserId();
        if (!userId) return;
        
        if (document.visibilityState === "visible") {
            // Check if we need to update the mining rate (every 5 minutes)
            const lastReferralCheck = parseInt(getUserMiningData(userId, "lastReferralCheck")) || 0;
            const referralCheckInterval = 5 * 60 * 1000; // 5 minutes
            
            if (Date.now() - lastReferralCheck > referralCheckInterval && navigator.onLine) {
                updateUserMiningRate(userId);
            }
            
            // Sync pending balances if online
            if (navigator.onLine) {
                const pendingBalance = getUserPendingBalance(userId);
                if (pendingBalance) {
                    syncPendingBalances(userId);
                }
            }
        }
    }

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
                // Update mining rate based on current referrals
                await updateUserMiningRate(userId);
                
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

    // Update mining rate based on user's referrals
    async function updateUserMiningRate(userId) {
        if (!navigator.onLine) return false;
        
        const token = localStorage.getItem("token");
        if (!token) return false;
        
        try {
            const response = await fetch("https://maicoin-41vo.onrender.com/api/auth/details", {
                method: "GET",
                headers: { Authorization: `Bearer ${token}` },
            });
            
            if (!response.ok) throw new Error("Failed to fetch user data");
            
            const userData = await response.json();
            const referralCount = (userData.referrals || []).length;
            
            // Calculate mining rate with referral bonus
            const referralBonus = 1 + (referralCount * REFERRAL_BONUS_RATE);
            const miningRate = BASE_MINING_RATE * referralBonus;
            
            // Store the new mining rate
            updateUserMiningData(userId, {
                miningRate: miningRate.toString(),
                referralCount: referralCount.toString(),
                referralBonus: referralBonus.toString(),
                lastReferralCheck: Date.now().toString()
            });
            
            console.log(`Updated mining rate for user ${userId}: ${miningRate} (${referralCount} referrals, ${referralBonus}x bonus)`);
            return true;
        } catch (error) {
            console.error("Failed to update mining rate:", error);
            return false;
        }
    }

    // Calculate and return any mining that happened while the app was closed
    function calculateOfflineMining(userId) {
        // Get mining session data
        const miningEndTime = parseInt(getUserMiningData(userId, "miningEndTime")) || 0;
        const lastUpdateTime = parseInt(getUserMiningData(userId, "lastUpdateTime")) || Date.now();
        const miningRate = parseFloat(getUserMiningData(userId, "miningRate")) || BASE_MINING_RATE;
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
                    const offlineMined = elapsedSeconds * miningRate;
                    console.log(`Mined offline: ${offlineMined.toFixed(4)} over ${elapsedSeconds} seconds at rate ${miningRate}/s`);
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
            // Session is still active
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
        // Stop any running intervals
        if (miningInterval) clearInterval(miningInterval);
        if (countdownInterval) clearInterval(countdownInterval);
        
        // Clear mining status but keep mining rate and referral data
        const miningRate = getUserMiningData(userId, "miningRate");
        const referralCount = getUserMiningData(userId, "referralCount");
        const referralBonus = getUserMiningData(userId, "referralBonus");
        const lastReferralCheck = getUserMiningData(userId, "lastReferralCheck");
        
        // Clear all mining session data
        clearUserMiningData(userId);
        
        // Restore mining rate and referral data
        if (miningRate) updateUserMiningData(userId, { miningRate: miningRate });
        if (referralCount) updateUserMiningData(userId, { referralCount: referralCount });
        if (referralBonus) updateUserMiningData(userId, { referralBonus: referralBonus });
        if (lastReferralCheck) updateUserMiningData(userId, { lastReferralCheck: lastReferralCheck });

        if (showAlert && !getUserMiningData(userId, "alerted")) {
            alert("Mining session completed!");
            updateUserMiningData(userId, { alerted: "true" });
        } else if (!showAlert) {
            localStorage.removeItem(getUserStorageKey(userId, "alerted")); // Allow next alert
        }

        // Update UI
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
    function startCountdown(remainingTime) {
        const userId = getUserId();
        if (!userId) return;

        if (countdownInterval) clearInterval(countdownInterval);

        const endTime = Date.now() + remainingTime;
        const totalTime = MINING_DURATION; 

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
                const hours = Math.floor(timeLeft / (60 * 60 * 1000));
                const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
                const seconds = Math.floor((timeLeft % (60 * 1000)) / 1000);

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
        let lastSyncTime = Date.now();

        // Update button state
        if (activateMiningButton) {
            activateMiningButton.textContent = "Mining...";
            activateMiningButton.disabled = true;
        }

        // Start the mining interval
        miningInterval = setInterval(() => {
            const now = Date.now();
            
            // Check if mining session has ended
            if (now >= miningEndTime) {
                clearInterval(miningInterval);
                resetMiningSession(userId, true);
                return;
            }

            // Update local balance
            updateMiningBalance(userId);
            
            // Update timestamp of last processing
            updateUserMiningData(userId, { lastUpdateTime: now.toString() });
            
            // Check if it's time to sync with backend
            if (now - lastSyncTime >= SYNC_INTERVAL && navigator.onLine) {
                const currentBalance = parseFloat(getUserMinedBalance(userId)) || 0;
                syncBalanceWithBackend(currentBalance);
                lastSyncTime = now;
            }
        }, UPDATE_INTERVAL);
    }

    // Update Balance During Active Mining
    function updateMiningBalance(userId) {
        const currentBalance = parseFloat(getUserMinedBalance(userId)) || 0;
        const miningRate = parseFloat(getUserMiningData(userId, "miningRate")) || BASE_MINING_RATE;
        
        // Calculate new balance (miningRate tokens per second)
        const newBalance = currentBalance + miningRate;
        
        // Store the updated balance
        setUserMinedBalance(userId, newBalance.toFixed(4));
        
        // Update UI immediately
        updateUIBalance(newBalance);
        
        // Save for future sync if offline
        if (!navigator.onLine) {
            savePendingBalance(userId, newBalance);
        }
    }

    // Update UI with stored values
    function updateUIFromStoredValues(userId) {
        const storedBalance = parseFloat(getUserMinedBalance(userId)) || 0;
        
        if (minedBalanceDisplay) {
            minedBalanceDisplay.textContent = `${storedBalance.toFixed(4)} MAI`;
        }
        
        // Update the mining button state
        if (activateMiningButton && getUserMiningStatus(userId)) {
            activateMiningButton.textContent = "Mining...";
            activateMiningButton.disabled = true;
        }
    }

    // Update UI balance specifically
    function updateUIBalance(balance) {
        if (minedBalanceDisplay) {
            minedBalanceDisplay.textContent = `${balance.toFixed(4)} MAI`;
        }
    }

    // Enhanced Sync Balance with Backend with priority flag
    async function syncBalanceWithBackend(balance, isPriority = false) {
        const token = localStorage.getItem("token");
        const userId = getUserId();
        if (!token || !userId) return false;
        
        // Skip if balance is invalid
        if (isNaN(balance) || balance < 0) {
            console.error(`Invalid balance for sync: ${balance}`);
            return false;
        }
        
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
    
    // Get user's balance from the backend
    // Get user's balance from the backend
async function getBackendBalance() {
    let token = localStorage.getItem("token");
    if (!token) {
        console.warn("No token found. User is not logged in.");
        return null;
    }

    try {
        const response = await fetch("https://maicoin-41vo.onrender.com/api/auth/details", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            credentials: "include" // Ensures cookies are sent if needed
        });

        if (response.status === 401) { // ❌ Token expired or invalid
            console.warn("Token expired. Attempting to refresh...");
            const newToken = await refreshAuthToken();
            if (newToken) {
                return await getBackendBalance(); // Retry with new token
            } else {
                console.error("Token refresh failed. Logging out...");
                logoutUser();
                return null;
            }
        }

        if (!response.ok) {
            throw new Error(`Failed to fetch user data. Status: ${response.status}`);
        }

        const userData = await response.json();
        return userData.balance || 0; // Return backend balance

    } catch (error) {
        console.error("Failed to get backend balance:", error);
        return null;
    }
}

// Refresh token if expired
async function refreshAuthToken() {
    try {
        const response = await fetch("https://maicoin-41vo.onrender.com/api/auth/refresh", {
            method: "POST",
            credentials: "include"
        });

        if (!response.ok) {
            console.warn("Refresh token request failed.");
            return null;
        }

        const data = await response.json();
        if (data.token) {
            localStorage.setItem("token", data.token); // Save new token
            return data.token;
        }
        return null;

    } catch (error) {
        console.error("Error refreshing token:", error);
        return null;
    }
}


});
  /**  async function getBackendBalance() {
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
});**/

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