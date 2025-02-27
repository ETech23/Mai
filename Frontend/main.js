document.addEventListener("DOMContentLoaded", () => {
    const activateMiningButton = document.getElementById("activate-mining");
    const miningCountdown = document.getElementById("mining-countdown");
    const minedBalanceDisplay = document.getElementById("mined-balance");
    const progressCircle = document.getElementById("progress-circle");
    
    if ('serviceWorker' in navigator) {
         navigator.serviceWorker.register('/service-worker.js')
           .then((registration) => {
             console.log('Service Worker registered:', registration);
           })
           .catch((error) => {
             console.error('Service Worker registration failed:', error);
           });
       }

    let countdownInterval;
    let isMiningActive = localStorage.getItem('isMiningActive') === 'true';
    
    // Constants
    const MINING_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
    const MINING_RATE_PER_SECOND = 0.0005 ; // 0.0005 per second
    const SYNC_INTERVAL = 30; // Sync with backend every 30 seconds

    // IMPORTANT: Update UI immediately from stored values
    updateUIFromStoredValues();
    
    // Process any pending offline balances first
    syncPendingBalances();
    
    // Calculate and apply any offline mining immediately
    calculateOfflineMining();
    
    // Then restore any active mining session
    restoreMiningSession();

    // Attach Click Event to Mining Button
    if (activateMiningButton) {
        activateMiningButton.addEventListener("click", () => {
            if (isMiningActive) {
                alert("Mining is already active!");
                return;
            }

            const miningEndTime = Date.now() + MINING_DURATION;
            const miningStartTime = Date.now();

            isMiningActive = true;
            localStorage.setItem("miningProgress", "0");
            localStorage.setItem("miningEndTime", miningEndTime.toString());
            localStorage.setItem("miningStartTime", miningStartTime.toString());
            localStorage.setItem("isMiningActive", "true");
            localStorage.setItem("lastUpdateTime", Date.now().toString());

            // Start the timer and mining process together
            startMiningSession(MINING_DURATION);
        });
    } else {
        console.error("Mining button not found! Ensure the button ID is correct.");
    }

    // Handle when user comes back to the app
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
            // CRITICAL: Calculate and apply offline mining first
            calculateOfflineMining();
            
            // Then restore the regular timer
            restoreMiningSession();
            
            // Finally sync any pending balances
            syncPendingBalances();
        } else {
            // Save the last time user left
            localStorage.setItem("lastUpdateTime", Date.now().toString());
        }
    });

    // Regular check for offline mining - run every 10 seconds when visible
    setInterval(() => {
        if (document.visibilityState === "visible") {
            calculateOfflineMining();
        }
    }, 10000);

    // Function to start mining session - combines countdown and mining
    function startMiningSession(remainingTime) {
        if (countdownInterval) clearInterval(countdownInterval);
        
        const miningCountdown = document.getElementById("mining-countdown");
        const progressCircle = document.getElementById("progress-circle");
        const activateMiningButton = document.getElementById("activate-mining");
        
        const endTime = Date.now() + remainingTime;
        
        if (activateMiningButton) {
            activateMiningButton.textContent = "Mining...";
            activateMiningButton.disabled = true;
        }
        
        // Single interval that handles both countdown UI updates and mining balance updates
        countdownInterval = setInterval(async () => {
            const currentTime = Date.now();
            const timeLeft = endTime - currentTime;
            const totalTime = MINING_DURATION;
            
            if (timeLeft <= 0) {
                clearInterval(countdownInterval);
                
                if (miningCountdown) {
                    miningCountdown.textContent = "Next session available!";
                }
                
                if (progressCircle) {
                    progressCircle.style.background = `conic-gradient(#2C3E30 100%, #718074 100%)`;
                }
                
                resetMiningSession(true);
                return;
            }
            
            // Update countdown timer UI
            const minutes = Math.floor(timeLeft / (60 * 1000));
            const seconds = Math.floor((timeLeft % (60 * 1000)) / 1000);
            
            if (miningCountdown) {
                miningCountdown.textContent = `Next session: ${minutes}m ${seconds}s`;
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
            localStorage.setItem("miningProgress", progressPercentage.toString());
            
            // Update mining balance with EACH timer tick - ensures tight coupling
            await updateMiningBalance();
            
            // Update the lastUpdateTime with every tick
            localStorage.setItem("lastUpdateTime", currentTime.toString());
            
        }, 1000); // Update every second
    }
});

// Update UI immediately from stored values
function updateUIFromStoredValues() {
    const minedBalanceDisplay = document.getElementById("mined-balance");
    const storedBalance = parseFloat(localStorage.getItem("minedBalance")) || 0;
    
    if (minedBalanceDisplay) {
        minedBalanceDisplay.textContent = `${storedBalance.toFixed(4)} MAI`;
    }
    
    // Also update the mining button state
    const activateMiningButton = document.getElementById("activate-mining");
    const isMiningActive = localStorage.getItem('isMiningActive') === 'true';
    
    if (activateMiningButton && isMiningActive) {
        activateMiningButton.textContent = "Mining...";
        activateMiningButton.disabled = true;
    }
}

// Calculate and apply any mining that happened while the app was closed
function calculateOfflineMining() {
    const miningEndTime = parseInt(localStorage.getItem("miningEndTime")) || 0;
    const lastUpdateTime = parseInt(localStorage.getItem("lastUpdateTime")) || Date.now();
    const storedBalance = parseFloat(localStorage.getItem("minedBalance")) || 0;
    const now = Date.now();
    
    // Only process if mining was active
    if (miningEndTime > 0 && localStorage.getItem("isMiningActive") === "true") {
        let timeToProcess;
        
        if (now >= miningEndTime) {
            // Mining session ended while offline
            // Only count time until the end of the session
            timeToProcess = Math.max(0, miningEndTime - lastUpdateTime);
            
            // Then mark mining as complete if it hasn't been done already
            if (localStorage.getItem("isMiningActive") === "true") {
                console.log("Mining session completed while offline");
                resetMiningSession(false); // Don't show alert for offline completion
            }
        } else {
            // Mining session still active
            timeToProcess = now - lastUpdateTime;
        }
        
        // Calculate earned tokens during offline period
        if (timeToProcess > 1000) { // At least 1 second
            const elapsedSeconds = Math.floor(timeToProcess / 1000);
            
            if (elapsedSeconds > 0) {
                updateBalanceBasedOnElapsedTime(elapsedSeconds, storedBalance);
            }
        }
    }
    
    localStorage.setItem("lastUpdateTime", now.toString());
}

// Update balance based on elapsed time and referral bonus
function updateBalanceBasedOnElapsedTime(elapsedSeconds, previousBalance) {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Fetch user data to calculate referral bonus
    fetch("https://mai.fly.dev/api/auth/details", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
    })
    .then(response => {
        if (!response.ok) throw new Error("Failed to fetch user data");
        return response.json();
    })
    .then(userData => {
        const referralCount = (userData.referrals || []).length;
        const referralBonus = 1 + (referralCount * 0.05);
        
        // Calculate mining rate per second 0.0005per second
        const miningRatePerSecond = 0.0005 ;
        const additionalBalance = elapsedSeconds * miningRatePerSecond * referralBonus;
        const newBalance = previousBalance + additionalBalance;

        // Store the updated balance
        localStorage.setItem("minedBalance", newBalance.toFixed(4));
        
        // Update UI immediately
        const minedBalanceDisplay = document.getElementById("mined-balance");
        if (minedBalanceDisplay) {
            minedBalanceDisplay.textContent = `${newBalance.toFixed(4)} MAI`;
        }

        // Sync with backend every 30 seconds
        if (elapsedSeconds % 30 === 0) {
            syncBalanceWithBackend(newBalance);
        }
    })
    .catch(error => {
        console.error("Failed to update background balance:", error);
        savePendingBalance();
    });
}

// Restore Mining Session
function restoreMiningSession() {
    const miningEndTime = parseInt(localStorage.getItem("miningEndTime")) || 0;
    const now = Date.now();

    if (miningEndTime > now && localStorage.getItem("isMiningActive") === "true") {
        const remainingTime = miningEndTime - now;
        startMiningSession(remainingTime);
    } else if (miningEndTime <= now && localStorage.getItem("isMiningActive") === "true") {
        // Mining should have finished while app was closed
        resetMiningSession(false); // Don't show alert for expired sessions
    }
}

// Reset Mining Session After Completion
function resetMiningSession(showAlert = true) {
    localStorage.removeItem("miningProgress");
    localStorage.removeItem("miningEndTime");
    localStorage.removeItem("miningStartTime");
    localStorage.setItem("isMiningActive", "false");
    
    // Update isMiningActive variable
    isMiningActive = false;

    if (showAlert && !localStorage.getItem("alerted")) {
        alert("Mining session completed!");
        localStorage.setItem("alerted", "true");
    } else if (!showAlert) {
        localStorage.removeItem("alerted"); // Allow next alert
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
}

// Update Balance and Save Pending If No Network
async function updateMiningBalance() {
    const currentBalance = parseFloat(localStorage.getItem("minedBalance")) || 0;
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        const response = await fetch("https://mai.fly.dev/api/auth/details", {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Failed to fetch user data");

        const userData = await response.json();
        const referralCount = (userData.referrals || []).length;
        const referralBonus = 1 + (referralCount * 0.05);
        
        // Mining rate per second (0.0005 per second)
        const miningRatePerSecond = 0.0005 ;
        const newBalance = currentBalance + miningRatePerSecond * referralBonus;

        localStorage.setItem("minedBalance", newBalance.toFixed(4));
        
        const minedBalanceDisplay = document.getElementById("mined-balance");
        if (minedBalanceDisplay) {
            minedBalanceDisplay.textContent = `${newBalance.toFixed(4)} MAI`;
        }

        // Sync with backend every 30 seconds
        if (Math.floor(Date.now() / 1000) % 30 === 0) {
            await syncBalanceWithBackend(newBalance);
        }
    } catch (error) {
        console.error("Failed to update balance:", error);
        savePendingBalance();
    }
}

// Sync Balance with Backend
async function syncBalanceWithBackend(balance) {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        const response = await fetch("https://mai.fly.dev/api/mining/update", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ balance: parseFloat(balance.toFixed(4)) }),
        });

        if (!response.ok) throw new Error("Backend update failed");

        console.log("Balance successfully updated to backend");
        localStorage.removeItem("pendingBalance");
    } catch (error) {
        savePendingBalance();
    }
}

// Save Pending Balance if Offline
function savePendingBalance() {
    const balance = parseFloat(localStorage.getItem("minedBalance")) || 0;
    localStorage.setItem("pendingBalance", balance);
}

// Sync Pending Balance When User Returns Online
function syncPendingBalances() {
    const pendingBalance = parseFloat(localStorage.getItem("pendingBalance"));
    if (pendingBalance) {
        syncBalanceWithBackend(pendingBalance).then(() => {
            localStorage.removeItem("pendingBalance");
        }).catch(() => {
            console.error("Failed to sync pending balance.");
        });
    }
}

// Function to start mining session - combines countdown and mining
function startMiningSession(remainingTime) {
    if (countdownInterval) clearInterval(countdownInterval);
    
    const miningCountdown = document.getElementById("mining-countdown");
    const progressCircle = document.getElementById("progress-circle");
    const activateMiningButton = document.getElementById("activate-mining");
    
    const endTime = Date.now() + remainingTime;
    const MINING_DURATION = 60 * 60 * 1000; // 1 hour
    
    if (activateMiningButton) {
        activateMiningButton.textContent = "Mining...";
        activateMiningButton.disabled = true;
    }
    
    // Single interval that handles both countdown UI updates and mining balance updates
    countdownInterval = setInterval(async () => {
        const currentTime = Date.now();
        const timeLeft = endTime - currentTime;
        const totalTime = MINING_DURATION;
        
        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            
            if (miningCountdown) {
                miningCountdown.textContent = "Next session available!";
            }
            
            if (progressCircle) {
                progressCircle.style.background = `conic-gradient(#2C3E30 100%, #718074 100%)`;
            }
            
            resetMiningSession(true);
            return;
        }
        
        // Update countdown timer UI
        const minutes = Math.floor(timeLeft / (60 * 1000));
        const seconds = Math.floor((timeLeft % (60 * 1000)) / 1000);
        
        if (miningCountdown) {
            miningCountdown.textContent = `Next session: ${minutes}m ${seconds}s`;
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
        localStorage.setItem("miningProgress", progressPercentage.toString());
        
        // Update mining balance with EACH timer tick - ensures tight coupling
        await updateMiningBalance();
        
        // Update the lastUpdateTime with every tick
        localStorage.setItem("lastUpdateTime", currentTime.toString());
        
    }, 1000); // Update every second
}