document.addEventListener("DOMContentLoaded", () => {
    const activateMiningButton = document.getElementById("activate-mining");
    const miningCountdown = document.getElementById("mining-countdown");
    const minedBalanceDisplay = document.getElementById("mined-balance");
    const progressCircle = document.getElementById("progress-circle");
  
  navigator.serviceWorker.register('/service-worker.js')
           .then((registration) => {
             console.log('Service Worker registered:', registration);
           })
           .catch((error) => {
             console.error('Service Worker registration failed:', error);
           });
       

    let miningInterval;
    let countdownInterval;
    let isMiningActive = localStorage.getItem('isMiningActive') === 'true';

    // Update UI immediately from stored values
    updateUIFromStoredValues();
    
    // Process any pending offline balances first
    syncPendingBalances();
    
    // Calculate and apply any offline mining immediately
    calculateOfflineMining();
    
    // Restore any active mining session
    restoreMiningSession();

    // Attach Click Event to Mining Button
    if (activateMiningButton) {
        activateMiningButton.addEventListener("click", () => {
            if (isMiningActive) {
                alert("Mining is already active!");
                return;
            }

            const miningDuration = 60 * 60 * 1000; // 1 hour
            const miningEndTime = Date.now() + miningDuration;
            const miningStartTime = Date.now();

            isMiningActive = true;
            localStorage.setItem("miningProgress", "0");
            localStorage.setItem("miningEndTime", miningEndTime.toString());
            localStorage.setItem("miningStartTime", miningStartTime.toString());
            localStorage.setItem("isMiningActive", "true");
            localStorage.setItem("lastUpdateTime", Date.now().toString());

            startCountdown(miningDuration);
            startMiningProcess(miningDuration);
        });
    } else {
        console.error("Mining button not found! Ensure the button ID is correct.");
    }

    // Handle when user comes back to the app
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
            // Calculate and apply offline mining first
            calculateOfflineMining();
            
            // Restore the regular timer
            restoreMiningSession();
            
            // Sync any pending balances
            syncPendingBalances();
        } else {
            // Save the last time user left
            localStorage.setItem("lastUpdateTime", Date.now().toString());
        }
    });

    // Regular check for offline mining - run every 10 seconds
    setInterval(() => {
        if (document.visibilityState === "visible") {
            calculateOfflineMining();
        }
    }, 10000);
});

// Update UI immediately from stored values
function updateUIFromStoredValues() {
    const minedBalanceDisplay = document.getElementById("mined-balance");
    const storedBalance = parseFloat(localStorage.getItem("minedBalance")) || 0;
    
    if (minedBalanceDisplay) {
        minedBalanceDisplay.textContent = `${storedBalance.toFixed(4)} MAI`;
    }
    
    // Update the mining button state
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
            timeToProcess = Math.max(0, miningEndTime - lastUpdateTime);
            
            // Mark mining as complete if it hasn't been done already
            if (now >= miningEndTime && localStorage.getItem("isMiningActive") === "true") {
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
        
        // Calculate mining rate per second
        const miningRatePerSecond = 0.0005; // Base mining rate
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
        startCountdown(remainingTime);
        startMiningProcess(remainingTime);
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

// Start Countdown Timer and Update Mining Progress
function startCountdown(remainingTime) {
    if (countdownInterval) clearInterval(countdownInterval);
    
    const miningCountdown = document.getElementById("mining-countdown");
    const progressCircle = document.getElementById("progress-circle");
    
    const endTime = Date.now() + remainingTime;
    const totalTime = 60 * 60 * 1000; // 1 hour
    
    countdownInterval = setInterval(() => {
        const currentTime = Date.now();
        const timeLeft = endTime - currentTime;

        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            
            if (miningCountdown) {
                miningCountdown.textContent = "Next session available!";
            }
            
            if (progressCircle) {
                progressCircle.style.background = `conic-gradient(#2C3E30 100%, #718074 100%)`;
            }
            
            resetMiningSession(true);
        } else {
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
        }
    }, 1000);
}

// Start Mining Process and Sync Balance
function startMiningProcess(remainingTime) {
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
            resetMiningSession(true);
            return;
        }

        updateMiningBalance();
        localStorage.setItem("lastUpdateTime", now.toString());
    }, 1000);
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
        
        // Base Mining rate per second (0.0005 per second)
        const miningRatePerSecond = 0.0005;
        const newBalance = currentBalance + miningRatePerSecond * referralBonus;

        // Store the updated balance
        localStorage.setItem("minedBalance", newBalance.toFixed(4));
        
        // Update UI immediately
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