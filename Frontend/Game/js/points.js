let lastActivityTime = Date.now();
let totalPoints = 0;
let pointsInterval;
const ACTIVITY_TIMEOUT = 15000; // 15 seconds in ms
let syncInterval;

// Update activity status on user interaction
function recordActivity() {
    lastActivityTime = Date.now();
    updateStatus();
}

// Check if user was active recently
function isUserActive() {
    return (Date.now() - lastActivityTime) < ACTIVITY_TIMEOUT;
}

// Show points animation
function showPointsAnimation() {
    totalPoints += 0.1;
    updatePointsDisplay();
    
    const pointsElement = document.createElement('div');
    pointsElement.className = 'points-animation';
    pointsElement.textContent = '+0.10 Point!';
    
    document.body.appendChild(pointsElement);
    
    setTimeout(() => {
        pointsElement.remove();
    }, 2500);
}

// Update points display with 2 decimal places
function updatePointsDisplay() {
    document.getElementById('pointsCounter').textContent = `Total Points: ${totalPoints.toFixed(2)}`;
}

// Sync with balance (mock function)
function syncWithBalance() {
    console.log(`Syncing points with balance: ${totalPoints.toFixed(2)}`);
    // Here you would add your actual sync logic
}

// Show info message when points counter is clicked
function showPointsInfo() {
    const infoElement = document.createElement('div');
    infoElement.className = 'points-info';
    infoElement.textContent = 'You receive points for being active and it syncs with the balance every 60sec';
    infoElement.style.position = 'fixed';
    infoElement.style.bottom = '20px';
    infoElement.style.left = '50%';
    infoElement.style.transform = 'translateX(-50%)';
    infoElement.style.backgroundColor = 'rgba(0,0,0,0.8)';
    infoElement.style.color = 'white';
    infoElement.style.padding = '10px 20px';
    infoElement.style.borderRadius = '5px';
    infoElement.style.zIndex = '1000';
    
    document.body.appendChild(infoElement);
    
    setTimeout(() => {
        infoElement.remove();
    }, 3000);
}

// Update status display
function updateStatus() {
    const statusEl = document.getElementById('activityStatus');
    const secondsSinceActive = Math.floor((Date.now() - lastActivityTime) / 1000);
    
    if (secondsSinceActive < 15) {
        statusEl.textContent = `Last active: ${secondsSinceActive} sec ago`;
        statusEl.style.color = '#4CAF50';
    } else {
        statusEl.textContent = 'Inactive';
        statusEl.style.color = '#F44336';
    }
}

// Start checking every second
function startPointsTimer() {
    clearInterval(pointsInterval);
    pointsInterval = setInterval(() => {
        if (isUserActive()) {
            showPointsAnimation();
        }
        updateStatus();
    }, 15000);
}

// Start sync interval (every 60 seconds)
function startSyncInterval() {
    clearInterval(syncInterval);
    syncInterval = setInterval(() => {
        syncWithBalance();
    }, 60000);
}

// Set up event listeners
['mousemove', 'click', 'keydown', 'scroll'].forEach(event => {
    document.addEventListener(event, recordActivity, { passive: true });
});

// Add click handler to points counter
document.getElementById('pointsCounter').addEventListener('click', showPointsInfo);

// Initialize
startPointsTimer();
startSyncInterval();
updateStatus();
updatePointsDisplay();