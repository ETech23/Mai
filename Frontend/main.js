document.addEventListener("DOMContentLoaded", () => {
    const activateMiningButton = document.getElementById("activate-mining"); // Ensure correct ID
    const miningCountdown = document.getElementById("mining-countdown");
    const minedBalanceDisplay = document.getElementById("mined-balance");
    const progressCircle = document.getElementById("progressCircle");

    let miningInterval;
    let countdownInterval;
    let isMiningActive = localStorage.getItem('isMiningActive') === 'true';

    // **Restore Mining Session on Page Load**
    restoreMiningSession();
    resumeCountdown();

    // **Attach Click Event to Mining Button**
    if (activateMiningButton) {
        activateMiningButton.addEventListener("click", () => {
            if (isMiningActive) {
                alert("Mining is already active!");
                return;
            }

            const miningDuration = 60 * 60 * 1000; // 1 hour
            const miningEndTime = Date.now() + miningDuration;

            isMiningActive = true;
            localStorage.setItem("miningProgress", "0");
            localStorage.setItem("miningEndTime", miningEndTime.toString());
            localStorage.setItem("isMiningActive", "true");

            continueMining(0, miningDuration);
            startCountdown(miningDuration);
        });
    } else {
        console.error("Mining button not found! Ensure the button ID is correct.");
    }
});

// **Restore Mining Session**
function restoreMiningSession() {
    const savedProgress = parseFloat(localStorage.getItem("miningProgress")) || 0;
    const miningEndTime = parseInt(localStorage.getItem("miningEndTime")) || 0;
    const now = Date.now();

    if (savedProgress < 100 && miningEndTime > now) {
        continueMining(savedProgress, miningEndTime - now);
        startCountdown(miningEndTime - now);
    } else {
        localStorage.removeItem("miningProgress");
        localStorage.removeItem("miningEndTime");
        activateMiningButton.textContent = "Activate Mining";
        activateMiningButton.disabled = false;
    }
}

// **Start Countdown Timer with Progress Circle Sync**
function startCountdown(remainingTime) {
    if (countdownInterval) clearInterval(countdownInterval);

    const startTime = Date.now();
    const endTime = startTime + remainingTime;

    // Save endTime and totalTime in localStorage
    localStorage.setItem("countdownEndTime", endTime);

    countdownInterval = setInterval(() => {
        const currentTime = Date.now();
        const timeLeft = endTime - currentTime;

        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            miningCountdown.textContent = "Next session available!";
            progressCircle.style.background = `conic-gradient(#2C3E30 100%, #718074 100%)`;
            localStorage.removeItem("countdownEndTime");
        } else {
            const minutes = Math.floor(timeLeft / (60 * 1000));
            const seconds = Math.floor((timeLeft % (60 * 1000)) / 1000);
            miningCountdown.textContent = `Next session: ${minutes}m ${seconds}s`;

            // Update Progress Circle
            const totalTimeStored = parseInt(localStorage.getItem("countdownTotalTime"), 10) || remainingTime;
            const progressPercentage = ((totalTimeStored - timeLeft) / totalTimeStored) * 100;
            progressCircle.style.background = `conic-gradient(
                #2C3E30 ${progressPercentage}%, 
                #718074 ${progressPercentage}% 100%
            )`;
        }
    }, 1000);
}

// **Resume Countdown on Page Reload**
function resumeCountdown() {
    const endTime = parseInt(localStorage.getItem('countdownEndTime'), 10);

    if (endTime) {
        const currentTime = Date.now();
        const remainingTime = endTime - currentTime;

        if (remainingTime > 0) {
            startCountdown(remainingTime);
        } else {
            miningCountdown.textContent = "Next session available!";
            progressCircle.style.background = `conic-gradient(#2C3E30 100%, #718074 100%)`;
        }
    }
}

// **Continue Mining Function**
async function continueMining(savedProgress, remainingTime) {
    miningProgress = savedProgress;
    isMiningActive = true;
    activateMiningButton.disabled = true;
    activateMiningButton.textContent = "Mining...";

    const incrementInterval = 1000; // 1 second
    const miningEndTime = Date.now() + remainingTime;

    startCountdown(remainingTime);

    miningInterval = setInterval(async () => {
        if (Date.now() >= miningEndTime || miningProgress >= 100) {
            clearInterval(miningInterval);
            isMiningActive = false;
            miningProgress = 100;
            activateMiningButton.disabled = false;
            activateMiningButton.textContent = "Activate Mining";

            alert("Mining session completed!");

            // Clear local storage for mining
            localStorage.removeItem("miningProgress");
            localStorage.removeItem("miningEndTime");
        } else {
            miningProgress += 100 / 3600; // Each second, add 1/3600th of 100%
            const currentBalance = parseFloat(localStorage.getItem("minedBalance")) || 0;

            // **Boost Mining Rate Based on Referrals**
            const token = localStorage.getItem("token");
            const response = await fetch("https://mai.fly.dev/api/auth/details", {
                method: "GET",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) throw new Error("Failed to fetch user data");

            const userData = await response.json();
            const referralCount = (userData.referrals || []).length;
            const referralBonus = 1 + (referralCount * 0.05); // 5% boost per referral

            const newBalance = currentBalance + (0.0005 * referralBonus);
            localStorage.setItem("minedBalance", newBalance.toFixed(4));
            minedBalanceDisplay.textContent = `${newBalance.toFixed(4)} MAI`;

            localStorage.setItem("miningProgress", miningProgress);

            // **Update Backend Balance**
            try {
                await updateBalance(newBalance);
            } catch (error) {
                console.error("Failed to update balance to backend:", error);
            }
        }
    }, incrementInterval);
}

// **Update Backend Balance**
async function updateBalance(newBalance) {
    const token = localStorage.getItem("token");
    if (!token) return console.error("No token found. Cannot update balance.");

    try {
        const response = await fetch("https://mai.fly.dev/api/mining/update", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ balance: parseFloat(newBalance.toFixed(4)) }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Failed to update balance:", errorData.message || response.statusText);
        }
    } catch (error) {
        console.error("Error updating balance:", error);
    }
}

// **Start Mining**
function startMining() {
    if (!isMiningActive) {
        miningStartTime = Date.now();
        miningEndTime = miningStartTime + 3600 * 1000; // 1 hour later
        isMiningActive = true;

        // Save to localStorage
        localStorage.setItem('miningStartTime', miningStartTime);
        localStorage.setItem('miningEndTime', miningEndTime);
        localStorage.setItem('isMiningActive', 'true');

        continueMining(0, 3600 * 1000);
    }
}

// **Resume Mining Progress on App Reopen**
document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
        restoreMiningSession();
    }
});

// **Activate Mining Button Click Event**
activateMiningButton.addEventListener("click", () => {
    if (isMiningActive) {
        alert("Mining is already active!");
        return;
    }

    const miningDuration = 60 * 60 * 1000; // 1 hour
    const miningEndTime = Date.now() + miningDuration;

    isMiningActive = true;
    localStorage.setItem("miningProgress", "0");
    localStorage.setItem("miningEndTime", miningEndTime.toString());

    continueMining(0, miningDuration);
    startCountdown(miningDuration);
});

// **Check & Restore Mining on Page Load**
restoreMiningSession();
resumeCountdown();