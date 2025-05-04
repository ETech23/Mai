document.addEventListener('DOMContentLoaded', () => {
    // Game state
    const state = {
        wallet: 0,
        collected: 0,
        missed: 0,
        spawnRate: 2000, // milliseconds
        bitcoinSpeed: 5, // pixels per frame
        autoCollectRate: 0, // BTC per minute
        upgrades: {
            hashRate: { level: 0, cost: 10, effect: 0.8 },
            efficiency: { level: 0, cost: 25, effect: 0.9 },
            autoMiner: { level: 0, cost: 50, effect: 0.1 }
        },
        lastSpawnTime: 0,
        lastAutoCollectTime: 0
    };

    // DOM elements
    const walletDisplay = document.getElementById('wallet');
    const collectedDisplay = document.getElementById('collected');
    const missedDisplay = document.getElementById('missed');
    const rateDisplay = document.getElementById('rate');
    const bitcoinContainer = document.getElementById('bitcoinContainer');
    const particlesContainer = document.getElementById('particles');
    const upgradeBtn = document.getElementById('upgradeBtn');
    const upgradeModal = document.getElementById('upgradeModal');
    const closeModal = document.getElementById('closeModal');
    const hashRateBtn = document.getElementById('hashRateBtn');
    const efficiencyBtn = document.getElementById('efficiencyBtn');
    const autoMinerBtn = document.getElementById('autoMinerBtn');

    // Initialize game
    function init() {
        updateDisplays();
        gameLoop();
        setupEventListeners();
    }

    // Update all displays
    function updateDisplays() {
        walletDisplay.textContent = state.wallet.toFixed(8);
        collectedDisplay.textContent = state.collected;
        missedDisplay.textContent = state.missed;
        rateDisplay.textContent = (state.autoCollectRate * 60).toFixed(1);
        
        // Update upgrade buttons
        hashRateBtn.textContent = `${state.upgrades.hashRate.cost} BTC`;
        efficiencyBtn.textContent = `${state.upgrades.efficiency.cost} BTC`;
        autoMinerBtn.textContent = `${state.upgrades.autoMiner.cost} BTC`;
    }

    // Main game loop
    function gameLoop() {
        const now = Date.now();
        
        // Spawn new Bitcoin
        if (now - state.lastSpawnTime > state.spawnRate) {
            spawnBitcoin();
            state.lastSpawnTime = now;
        }
        
        // Auto collect BTC
        if (state.autoCollectRate > 0 && now - state.lastAutoCollectTime > 1000) {
            const btcCollected = state.autoCollectRate / 60;
            state.wallet += btcCollected;
            state.collected += btcCollected;
            state.lastAutoCollectTime = now;
            updateDisplays();
            
            // Show auto collect notification
            showParticles(1, 'auto');
        }
        
        // Move all Bitcoins
        moveBitcoins();
        
        requestAnimationFrame(gameLoop);
    }

    // Spawn a new Bitcoin element
    function spawnBitcoin() {
        const bitcoin = document.createElement('div');
        bitcoin.className = 'bitcoin';
        bitcoin.innerHTML = '<i class="fab fa-bitcoin"></i>';
        
        // Random position at top of screen
        const startX = Math.random() * (window.innerWidth - 40);
        bitcoin.style.left = `${startX}px`;
        bitcoin.style.top = '-40px';
        
        // Random size
        const size = 30 + Math.random() * 30;
        bitcoin.style.fontSize = `${size}px`;
        
        // Random speed variation
        const speed = state.bitcoinSpeed * (0.8 + Math.random() * 0.4);
        
        // Store data on element
        bitcoin.dataset.speed = speed;
        bitcoin.dataset.value = (size / 50).toFixed(8);
        
        bitcoin.addEventListener('click', collectBitcoin);
        
        bitcoinContainer.appendChild(bitcoin);
    }

    // Move all Bitcoin elements
    function moveBitcoins() {
        const bitcoins = document.querySelectorAll('.bitcoin');
        const windowHeight = window.innerHeight;
        
        bitcoins.forEach(bitcoin => {
            const currentTop = parseFloat(bitcoin.style.top);
            const speed = parseFloat(bitcoin.dataset.speed);
            const newTop = currentTop + speed;
            
            bitcoin.style.top = `${newTop}px`;
            
            // Remove if off screen
            if (newTop > windowHeight) {
                bitcoin.remove();
                state.missed++;
                updateDisplays();
            }
        });
    }

    // Collect Bitcoin when clicked
    function collectBitcoin(e) {
        const bitcoin = e.target.closest('.bitcoin');
        const value = parseFloat(bitcoin.dataset.value);
        
        // Add to wallet
        state.wallet += value;
        state.collected += value;
        updateDisplays();
        
        // Visual effects
        showParticles(value, 'click');
        bitcoin.classList.add('float-up');
        
        // Remove after animation
        setTimeout(() => {
            bitcoin.remove();
        }, 500);
    }

    // Show particle effects
    function showParticles(value, type) {
        const count = type === 'click' ? Math.min(20, value * 10) : 5;
        const baseSize = type === 'click' ? 3 : 2;
        const color = type === 'click' ? '#f7931a' : '#4cc9f0';
        
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            // Random position around center if auto, or mouse position if click
            let x, y;
            if (type === 'click') {
                x = event.clientX;
                y = event.clientY;
            } else {
                x = window.innerWidth / 2;
                y = window.innerHeight / 2;
            }
            
            // Add some randomness to position
            x += (Math.random() - 0.5) * 100;
            y += (Math.random() - 0.5) * 100;
            
            particle.style.left = `${x}px`;
            particle.style.top = `${y}px`;
            
            // Random size
            const size = baseSize + Math.random() * 3;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.backgroundColor = color;
            
            // Random animation
            const angle = Math.random() * Math.PI * 2;
            const distance = 20 + Math.random() * 50;
            const duration = 0.5 + Math.random() * 1;
            
            particle.style.transition = `all ${duration}s ease-out`;
            
            particlesContainer.appendChild(particle);
            
            // Animate
            setTimeout(() => {
                particle.style.transform = `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px)`;
                particle.style.opacity = '0';
            }, 10);
            
            // Remove after animation
            setTimeout(() => {
                particle.remove();
            }, duration * 1000);
        }
    }

    // Upgrade functions
    function buyUpgrade(upgradeType) {
        const upgrade = state.upgrades[upgradeType];
        
        if (state.wallet >= upgrade.cost) {
            state.wallet -= upgrade.cost;
            upgrade.level++;
            
            // Apply upgrade effect
            switch (upgradeType) {
                case 'hashRate':
                    state.spawnRate *= upgrade.effect;
                    upgrade.cost = Math.floor(upgrade.cost * 1.5);
                    break;
                case 'efficiency':
                    state.bitcoinSpeed *= upgrade.effect;
                    upgrade.cost = Math.floor(upgrade.cost * 1.8);
                    break;
                case 'autoMiner':
                    state.autoCollectRate += upgrade.effect;
                    upgrade.cost = Math.floor(upgrade.cost * 2.2);
                    break;
            }
            
            updateDisplays();
            showParticles(5, 'auto'); // Celebration particles
        } else {
            // Not enough funds effect
            const wallet = document.querySelector('.wallet-display');
            wallet.style.animation = 'shake 0.5s';
            setTimeout(() => {
                wallet.style.animation = '';
            }, 500);
        }
    }

    // Event listeners
    function setupEventListeners() {
        // Upgrade modal
        upgradeBtn.addEventListener('click', () => {
            upgradeModal.style.display = 'flex';
        });
        
        closeModal.addEventListener('click', () => {
            upgradeModal.style.display = 'none';
        });
        
        // Upgrade buttons
        hashRateBtn.addEventListener('click', () => buyUpgrade('hashRate'));
        efficiencyBtn.addEventListener('click', () => buyUpgrade('efficiency'));
        autoMinerBtn.addEventListener('click', () => buyUpgrade('autoMiner'));
        
        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === upgradeModal) {
                upgradeModal.style.display = 'none';
            }
        });
        
        // Touch support for mobile
        document.addEventListener('touchstart', (e) => {
            // Simulate click for Bitcoin elements
            const bitcoin = e.target.closest('.bitcoin');
            if (bitcoin) {
                const event = new MouseEvent('click', {
                    view: window,
                    bubbles: true,
                    cancelable: true
                });
                bitcoin.dispatchEvent(event);
                e.preventDefault();
            }
        }, { passive: false });
    }

    // Start the game
    init();
});

// Shake animation for insufficient funds
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);

