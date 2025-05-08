document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const quizArea = document.getElementById('quizArea');
    const pointsDisplay = document.getElementById('points');
    const streakDisplay = document.getElementById('streak');
    const levelDisplay = document.getElementById('level');
    const feedbackModal = document.getElementById('feedbackModal');
    const feedbackTitle = document.getElementById('feedbackTitle');
    const feedbackText = document.getElementById('feedbackText');
    const pointsEarned = document.getElementById('pointsEarned');
    const nextQuestionBtn = document.getElementById('nextQuestion');
    const sectionNav = document.getElementById('sectionNav');
    const feedbackIcon = document.getElementById('feedbackIcon'); // Added missing element

    // Quiz State
    const state = {
        currentSection: null,
        currentQuestionIndex: 0,
        score: 0,
        streak: 0,
        lastPlayedDate: null,
        cooldownUntil: null,
        level: 1,
        questionsAnsweredToday: 0,
        maxQuestionsPerDay: 15,
        completedSectionsToday: 0,
        maxSectionsPerDay: 3,
        usedQuestionIds: new Set(),
        userPerformance: [],
        questionBank: getQuestionBank(),
        sectionScores: {}
    };
    
    function initializeState() {
    // Load persisted state from localStorage
    const savedState = localStorage.getItem('quizState');
    const savedStreak = localStorage.getItem('streak');
    const savedLastPlayed = localStorage.getItem('lastPlayedDate');
    const savedCooldown = localStorage.getItem('cooldownUntil');
    
    // Parse saved state if it exists
    if (savedState) {
        try {
            const parsed = JSON.parse(savedState);
            state.completedSectionsToday = parsed.completedSectionsToday || 0;
            state.cooldownUntil = parsed.cooldownUntil ? new Date(parsed.cooldownUntil) : null;
            
            // Initialize section completion status
            Object.keys(state.questionBank).forEach(section => {
                state.sectionScores[section] = {
                    completedToday: parsed.sectionScores?.[section]?.completedToday || false,
                    lastScore: parsed.sectionScores?.[section]?.lastScore || 0,
                    correct: 0,
                    total: 0
                };
            });
        } catch (e) {
            console.error("Failed to parse saved state", e);
        }
    }
    
    // Initialize streak data
    if (savedStreak) state.streak = parseInt(savedStreak);
    if (savedLastPlayed) state.lastPlayedDate = new Date(savedLastPlayed);
    if (savedCooldown) state.cooldownUntil = new Date(savedCooldown);
    
    // Check if we need to reset for a new day
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (state.lastPlayedDate) {
        const lastPlayed = new Date(state.lastPlayedDate);
        lastPlayed.setHours(0, 0, 0, 0);
        
        // Reset if it's a new day
        if (lastPlayed.getTime() < today.getTime()) {
            state.completedSectionsToday = 0;
            state.questionsAnsweredToday = 0;
            Object.keys(state.sectionScores).forEach(section => {
                state.sectionScores[section].completedToday = false;
            });
            
            // Clear cooldown if it was from previous day
            if (state.cooldownUntil && new Date(state.cooldownUntil) < today) {
                state.cooldownUntil = null;
                localStorage.removeItem('cooldownUntil');
            }
        }
    }
    
    // Initialize any remaining state that wasn't loaded
    if (!state.sectionScores) {
        state.sectionScores = {};
        Object.keys(state.questionBank).forEach(section => {
            state.sectionScores[section] = {
                completedToday: false,
                lastScore: 0,
                correct: 0,
                total: 0
            };
        });
    }
    
    // Verify cooldown status
    if (state.cooldownUntil && new Date() >= new Date(state.cooldownUntil)) {
        state.cooldownUntil = null;
        localStorage.removeItem('cooldownUntil');
    }
}
    // Initialize or load streak from localStorage
// Add to initialization
function initializeStreak() {
    const savedStreak = localStorage.getItem('streak');
    const lastPlayed = localStorage.getItem('lastPlayedDate');
    const cooldown = localStorage.getItem('cooldownUntil');
    
    if (savedStreak) state.streak = parseInt(savedStreak);
    if (lastPlayed) state.lastPlayedDate = new Date(lastPlayed);
    if (cooldown) state.cooldownUntil = new Date(cooldown);
    
    checkStreak();
}

// Add new function
function checkStreak() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (!state.lastPlayedDate) return;
    
    const lastPlayed = new Date(state.lastPlayedDate);
    lastPlayed.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (lastPlayed.getTime() === today.getTime()) return;
    
    if (lastPlayed.getTime() === yesterday.getTime()) {
        state.streak++;
    } else if (lastPlayed.getTime() < yesterday.getTime()) {
        state.streak = 0;
    }
    
    updateLastPlayed();
}

// Check and update streak status
function checkStreak() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastPlayed = new Date(state.lastPlayedDate);
    lastPlayed.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // If played today, do nothing
    if (lastPlayed.getTime() === today.getTime()) return;
    
    // If played yesterday, increment streak
    if (lastPlayed.getTime() === yesterday.getTime()) {
        state.streak++;
    } 
    // Otherwise reset streak (missed a day)
    else if (lastPlayed.getTime() < yesterday.getTime()) {
        state.streak = 0;
    }
    
    // Update last played date
    updateLastPlayed();
}

// Update last played date and save to localStorage
function updateLastPlayed() {
    state.lastPlayedDate = new Date();
    localStorage.setItem('lastPlayedDate', state.lastPlayedDate.toISOString());
    localStorage.setItem('streak', state.streak.toString());
    updateStatsDisplay();
}
    // Initialize the app
    init();
    
    function init() {
        initializeState();
    initializeStreak();
    initializeSectionScores();
    renderSectionButtons();
    setupEventListeners();
    updateStatsDisplay();
    hideModal();
    
    // Auto-select first available section (updated)
    const availableSection = getNextAvailableSection();
    if (availableSection) {
        selectSection(availableSection);
    } else {
        showCooldownScreen();
    }
}
    // FUNCTION TO ADD (for cooldown screen):
function showCooldownScreen() {
    quizArea.innerHTML = `
        <div class="start-screen">
            <div class="start-content">
                <h2>Come Back Later</h2>
                <p>Next section available in ${getTimeRemaining()}</p>
                <div class="cooldown-timer" id="cooldownTimer"></div>
            </div>
        </div>
    `;
    
    // Update timer every minute
    const timerElement = document.getElementById('cooldownTimer');
    if (timerElement) {
        setInterval(() => {
            timerElement.textContent = `Time remaining: ${getTimeRemaining()}`;
        }, 60000);
    }
}

    function getQuestionBank() {
        return {
                    "section1": [
            {
                "id": "s1q1",
                "text": "What is the primary purpose of a blockchain?",
                "options": [
                    "To store data in a centralized database",
                    "To create a decentralized, immutable ledger",
                    "To increase internet speed",
                    "To replace traditional banking completely"
                ],
                "correctAnswer": 1,
                "explanation": "Blockchain's primary purpose is to create a decentralized, immutable ledger that allows transactions to be recorded transparently and securely without a central authority.",
                "difficulty": "easy"
            },
            {
                "id": "s1q2",
                "text": "Which cryptocurrency was the first to implement smart contracts?",
                "options": [
                    "Bitcoin",
                    "Ethereum",
                    "Ripple",
                    "Litecoin"
                ],
                "correctAnswer": 1,
                "explanation": "Ethereum was the first blockchain platform to implement smart contracts, which are self-executing contracts with the terms directly written into code.",
                "difficulty": "easy"
            },
            {
                "id": "s1q3",
                "text": "What does 'HODL' mean in crypto slang?",
                "options": [
                    "Hold On for Dear Life",
                    "High Output Digital Ledger",
                    "Hash Of Digital Link",
                    "Hold Only Digital Loot"
                ],
                "correctAnswer": 0,
                "explanation": "HODL originated from a misspelling of 'hold' in a Bitcoin forum post and has come to mean 'Hold On for Dear Life' in crypto culture.",
                "difficulty": "easy"
            },
            {
                "id": "s1q4",
                "text": "What consensus mechanism does Bitcoin use?",
                "options": [
                    "Proof of Stake (PoS)",
                    "Delegated Proof of Stake (DPoS)",
                    "Proof of Work (PoW)",
                    "Proof of Authority (PoA)"
                ],
                "correctAnswer": 2,
                "explanation": "Bitcoin uses Proof of Work (PoW), where miners compete to solve complex mathematical problems to validate transactions and create new blocks.",
                "difficulty": "medium"
            },
            {
                "id": "s1q5",
                "text": "What is a '51% attack' in blockchain?",
                "options": [
                    "When 51% of nodes upgrade their software",
                    "When a single entity controls 51% of the network's mining power",
                    "When 51% of users vote to change a protocol",
                    "When 51% of coins are held by one wallet"
                ],
                "correctAnswer": 1,
                "explanation": "A 51% attack occurs when a single entity gains control of more than 50% of a blockchain's mining power, allowing them to manipulate the network.",
                "difficulty": "medium"
            }
        ],
        "section2": [
            {
                "id": "s2q1",
                "text": "What is the purpose of a nonce in Bitcoin mining?",
                "options": [
                    "To prevent double spending",
                    "To create a unique transaction ID",
                    "To vary the input of the hash function",
                    "To encrypt wallet private keys"
                ],
                "correctAnswer": 2,
                "explanation": "A nonce is a random number miners change to vary the input of the hash function in order to find a valid block hash.",
                "difficulty": "medium"
            },
            {
                "id": "s2q2",
                "text": "What does 'DeFi' stand for?",
                "options": [
                    "Decentralized Finance",
                    "Digital Finance",
                    "Distributed Finance",
                    "Decrypted Finance"
                ],
                "correctAnswer": 0,
                "explanation": "DeFi stands for Decentralized Finance, which refers to financial applications built on blockchain technologies that operate without central intermediaries.",
                "difficulty": "easy"
            },
            {
                "id": "s2q3",
                "text": "What is an NFT?",
                "options": [
                    "A type of cryptocurrency",
                    "A non-fungible token representing unique digital items",
                    "A new file transfer protocol",
                    "A node federation token"
                ],
                "correctAnswer": 1,
                "explanation": "NFT stands for Non-Fungible Token, which represents ownership of unique digital items like art, collectibles, or virtual real estate.",
                "difficulty": "easy"
            },
            {
                "id": "s2q4",
                "text": "What problem does the Byzantine Generals Problem describe?",
                "options": [
                    "The difficulty of reaching consensus in distributed systems",
                    "The security risks of centralized exchanges",
                    "The energy consumption of proof-of-work",
                    "The scalability limitations of blockchains"
                ],
                "correctAnswer": 0,
                "explanation": "The Byzantine Generals Problem describes the challenge of reaching consensus in distributed systems when some participants might be unreliable or malicious.",
                "difficulty": "hard"
            },
            {
                "id": "s2q5",
                "text": "What is sharding in blockchain technology?",
                "options": [
                    "Breaking the database into smaller, faster pieces",
                    "A type of cryptographic hash function",
                    "The process of creating new blocks",
                    "A method for securing private keys"
                ],
                "correctAnswer": 0,
                "explanation": "Sharding is a scaling solution that breaks the blockchain into smaller partitions called shards, each capable of processing transactions independently.",
                "difficulty": "hard"
            }
        ],
        "section3": [
            {
                "id": "s3q1",
                "text": "In AI, what does the term 'transformer' refer to?",
                "options": [
                    "A device that changes electrical voltage",
                    "A type of neural network architecture using self-attention mechanisms",
                    "A robot that can change its shape",
                    "A data conversion tool"
                ],
                "correctAnswer": 1,
                "explanation": "In AI, a transformer is a type of neural network architecture that uses self-attention mechanisms to process sequential data, making it particularly effective for natural language processing tasks.",
                "difficulty": "hard"
            },
            {
                "id": "s3q2",
                "text": "What is the 'tokenomics' of a cryptocurrency?",
                "options": [
                    "The study of token shapes and designs",
                    "The economic system and policies governing a token",
                    "The process of creating new tokens",
                    "The legal framework for token sales"
                ],
                "correctAnswer": 1,
                "explanation": "Tokenomics refers to the economic system and policies that govern a cryptocurrency token, including its supply, distribution, and utility.",
                "difficulty": "medium"
            },
            {
                "id": "s3q3",
                "text": "What is a DAO?",
                "options": [
                    "A type of Asian cryptocurrency",
                    "A Decentralized Autonomous Organization",
                    "A Digital Asset Operator",
                    "A Distributed Algorithmic Oracle"
                ],
                "correctAnswer": 1,
                "explanation": "A DAO (Decentralized Autonomous Organization) is an organization represented by rules encoded as a computer program that is transparent, controlled by organization members and not influenced by a central government.",
                "difficulty": "medium"
            },
            {
                "id": "s3q4",
                "text": "What is the 'halving' in Bitcoin?",
                "options": [
                    "When transaction fees are reduced by half",
                    "When the block reward for miners is cut in half",
                    "When the blockchain is split into two chains",
                    "When the total supply of Bitcoin is reduced by half"
                ],
                "correctAnswer": 1,
                "explanation": "The Bitcoin halving is an event that occurs every 210,000 blocks where the block reward given to miners is cut in half, reducing the rate at which new Bitcoin is created.",
                "difficulty": "medium"
            },
            {
                "id": "s3q5",
                "text": "What is zero-knowledge proof in cryptography?",
                "options": [
                    "A way to prove knowledge without revealing the information itself",
                    "A method to verify transactions without a blockchain",
                    "A technique to encrypt data with zero computational cost",
                    "A protocol for anonymous mining"
                ],
                "correctAnswer": 0,
                "explanation": "Zero-knowledge proof is a cryptographic method by which one party can prove to another that they know a value, without conveying any information apart from the fact that they know the value.",
                "difficulty": "hard"
            }
        ]
        };
    }

    function initializeSectionScores() {
    Object.keys(state.questionBank).forEach(section => {
        state.sectionScores[section] = {
            completedToday: false,  // Add this
            lastScore: 0,
            correct: 0,
            total: 0
        };
    });
}

    function renderSectionButtons() {
        sectionNav.innerHTML = '';
        Object.keys(state.questionBank).forEach((section, index) => {
            const button = document.createElement('button');
            button.className = 'section-btn';
            button.textContent = `Section ${index + 1}`;
            button.dataset.section = section;
            sectionNav.appendChild(button);
        });
    }

    function setupEventListeners() {
        // Section navigation
        document.querySelectorAll('.section-btn').forEach(btn => {
            btn.addEventListener('click', () => selectSection(btn.dataset.section));
        });
        
        // Continue button
        nextQuestionBtn.addEventListener('click', handleContinue);
        
        // Event delegation for dynamically created buttons
        document.addEventListener('click', function(e) {
            if (e.target.id === 'startSection') {
                startQuiz();
            }
            if (e.target.classList.contains('option-btn')) {
                const questionContainer = e.target.closest('.question-container');
                if (questionContainer) {
                    const questionId = questionContainer.dataset.questionId;
                    const question = state.questionBank[state.currentSection]
                        .find(q => q.id === questionId);
                    const selectedIndex = parseInt(e.target.dataset.index);
                    checkAnswer(selectedIndex, question);
                }
            }
        });
    }

    function selectSection(section) {
        state.currentSection = section;
        state.currentQuestionIndex = 0;
        state.usedQuestionIds.clear();
        
        // Update active section button
        document.querySelectorAll('.section-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.section === section);
        });
        
        // Show section start screen
        showSectionStartScreen(section);
    }

    function showSectionStartScreen(section) {
        quizArea.innerHTML = `
            <div class="start-screen">
                <div class="start-content">
                    <h2>Section ${section.charAt(section.length-1)} Challenge</h2>
                    <p>Test your knowledge with 5 questions about crypto, blockchain and AI</p>
                    <div class="section-stats">
                        <span>Best: ${state.sectionScores[section].lastScore}/5</span>
                        <span>Streak: ${state.streak} days</span>
                    </div>
                    <button id="startSection" class="mine-button pulse">Begin Section</button>
                </div>
            </div>
        `;
    }

    function startQuiz() {
        if (state.questionsAnsweredToday >= state.maxQuestionsPerDay) {
            showDailyLimitReached();
            return;
        }
        
        state.currentQuestionIndex = 0;
        state.usedQuestionIds.clear();
        loadQuestion();
    }

    function loadQuestion() {
        const section = state.currentSection;
        const questions = state.questionBank[section];
        const availableQuestions = questions.filter(q => !state.usedQuestionIds.has(q.id));
        
        if (availableQuestions.length === 0 || state.currentQuestionIndex >= 5) {
            endSection();
            return;
        }
        
        const question = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
        state.usedQuestionIds.add(question.id);
        
        quizArea.innerHTML = `
            <div class="question-container" data-question-id="${question.id}">
                <div class="question-header">
                    <span class="question-progress">Question ${state.currentQuestionIndex + 1} of 5</span>
                    <span class="difficulty-badge" data-difficulty="${question.difficulty}">
                        ${question.difficulty}
                    </span>
                </div>
                <h3 class="question-text">${question.text}</h3>
                <div class="options-container">
                    ${question.options.map((opt, index) => 
                        `<button class="option-btn" data-index="${index}">${opt}</button>`
                    ).join('')}
                </div>
            </div>
        `;
    }

    function checkAnswer(selectedIndex, question) {
        const isCorrect = selectedIndex === question.correctAnswer;
        const pointsEarned = isCorrect ? calculatePoints(question.difficulty) : 0;
        
        // Track performance
        state.userPerformance.push({
            isCorrect,
            difficulty: question.difficulty,
            section: state.currentSection,
            questionId: question.id,
            timestamp: new Date().toISOString()
        });
        
        if (isCorrect) {
            state.score += pointsEarned;
            state.questionsAnsweredToday++;
            state.sectionScores[state.currentSection].correct++;
            checkLevelUp();
        }
        
        state.sectionScores[state.currentSection].total++;
        
        // Visual feedback
        document.querySelectorAll('.option-btn').forEach((btn, index) => {
            if (index === question.correctAnswer) {
                btn.classList.add('correct');
            } else if (index === selectedIndex && !isCorrect) {
                btn.classList.add('incorrect');
            }
            btn.disabled = true;
        });
        
        showFeedback(isCorrect, question.explanation, pointsEarned);
        updateStatsDisplay();
    }

    // ADDED MISSING showFeedback FUNCTION
    function showFeedback(isCorrect, explanation, pointsEarned) {
        feedbackIcon.textContent = isCorrect ? '⚡' : '🛠️';
        feedbackIcon.style.color = isCorrect ? 'var(--success-color)' : 'var(--error-color)';
        feedbackTitle.textContent = isCorrect ? 'Correct!' : 'Try Again';
        feedbackText.textContent = explanation;
        pointsEarned.textContent = pointsEarned;
        
        // Update continue button
        nextQuestionBtn.textContent = state.currentQuestionIndex < 4 ? 'Continue' : 'View Results';
        
        showModal();
    }

    function handleContinue() {
        hideModal();
        
        if (state.currentQuestionIndex < 4) {
            state.currentQuestionIndex++;
            loadQuestion();
        } else {
            endSection();
        }
    }

    function endSection() {
    const section = state.currentSection;
    const sessionAnswers = state.userPerformance
        .filter(perf => perf.section === section)
        .slice(-5);
    
    const correctCount = sessionAnswers.filter(perf => perf.isCorrect).length;
    const sectionScore = sessionAnswers.reduce((sum, perf) => {
        return sum + (perf.isCorrect ? calculatePoints(perf.difficulty) : 0);
    }, 0);

    // Update section tracking
    state.sectionScores[section].lastScore = correctCount;
    state.sectionScores[section].completedToday = true;
    state.completedSectionsToday++;
    
    // Update stats
    updateLastPlayed();
    setCooldown();

    // Find next available section
    const nextSection = getNextAvailableSection();
    
    // Show appropriate feedback
    if (nextSection) {
        showSectionCompleteFeedback(correctCount, sectionScore, true, nextSection);
    } else {
        if (shouldStartCooldown()) {
            showSectionCompleteFeedback(correctCount, sectionScore, false);
        } else {
            // This shouldn't happen - means we have no next section but shouldn't be in cooldown
            console.error("Unexpected state: No next section but cooldown not active");
            const firstSection = Object.keys(state.questionBank)[0];
            selectSection(firstSection);
        }
    }
}
    
    function getNextAvailableSection() {
    if (checkCooldown()) return null;

    const sections = Object.keys(state.questionBank);
    for (const section of sections) {
        if (!state.sectionScores[section]?.completedToday) {
            return section;
        }
    }
    return null;
}


    function saveFullState() {
    localStorage.setItem('quizState', JSON.stringify({
        completedSectionsToday: state.completedSectionsToday,
        cooldownUntil: state.cooldownUntil?.toISOString(),
        sectionScores: state.sectionScores,
        questionsAnsweredToday: state.questionsAnsweredToday
    }));
    
    localStorage.setItem('streak', state.streak.toString());
    localStorage.setItem('lastPlayedDate', state.lastPlayedDate?.toISOString());
}
function showSectionCompleteFeedback(correctCount, sectionScore, hasNextSection, nextSection) {
    const isPerfect = correctCount === 5;
    
    feedbackIcon.textContent = isPerfect ? '🏆' : '📊';
    feedbackIcon.style.color = isPerfect ? 'var(--warning-color)' : 'var(--secondary-color)';
    feedbackTitle.textContent = isPerfect ? 'Perfect Score!' : 'Section Complete';
    feedbackText.textContent = `You answered ${correctCount} out of 5 correctly.`;
    pointsEarned.textContent = sectionScore;

    if (hasNextSection) {
        nextQuestionBtn.textContent = 'Continue to Next Section';
        nextQuestionBtn.onclick = () => {
            hideModal();
            selectSection(nextSection);
        };
    } else {
        nextQuestionBtn.textContent = `Come back in ${getTimeRemaining()}`;
        nextQuestionBtn.onclick = () => {
            hideModal();
            showDailyLimitReached();
        };
    }
    
    showModal();
}

    // Helper function to format streak display
function formatStreakDisplay(streak) {
    if (streak === 0) return "No streak yet";
    if (streak === 1) return "1 day";
    return `${streak} days`;
}

    
    function calculatePoints(difficulty) {
        const points = { easy: 10, medium: 20, hard: 30 };
        return points[difficulty] || 10;
    }

    function checkLevelUp() {
        const nextLevelThreshold = state.level * 100;
        if (state.score >= nextLevelThreshold) {
            state.level++;
            updateStatsDisplay();
        }
    }

    function updateStatsDisplay() {
    pointsDisplay.textContent = state.score;
    streakDisplay.textContent = formatStreakDisplay(state.streak); // Updated
    levelDisplay.textContent = state.level;
}

    // COOLDOWN MANAGEMENT
function shouldStartCooldown() {
    // Only start cooldown after all sections are completed
    return state.completedSectionsToday >= state.maxSectionsPerDay;
}

function setCooldown() {
    if (shouldStartCooldown()) {
        const now = new Date();
        const cooldownEnd = new Date(now.getTime() + 6 * 60 * 60 * 1000);
        state.cooldownUntil = cooldownEnd;
        localStorage.setItem('cooldownUntil', cooldownEnd.toISOString());
    }
}

function checkCooldown() {
    if (!state.cooldownUntil) return false;
    return new Date() < new Date(state.cooldownUntil);
}

function getTimeRemaining() {
    if (!state.cooldownUntil) return "0 minutes";
    const now = new Date();
    const end = new Date(state.cooldownUntil);
    const diff = end - now;
    
    if (diff <= 0) return "0 minutes";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours > 0 ? hours + ' hours ' : ''}${minutes} minutes`;
}


function showDailyLimitReached() {
    // Check if cooldown is actually needed (all sections completed)
    const allSectionsCompleted = Object.values(state.sectionScores)
        .every(section => section.completedToday);
    
    // If not all sections are completed but we're in cooldown, clear it
    if (!allSectionsCompleted && checkCooldown()) {
        state.cooldownUntil = null;
        localStorage.removeItem('cooldownUntil');
    }

    const now = new Date();
    let message, showTimer = false;
    
    if (checkCooldown() && allSectionsCompleted) {
        const cooldownEnd = new Date(state.cooldownUntil);
        const timeRemaining = getTimeRemaining();
        
        // Format next available time (show tomorrow if after midnight)
        let nextAvailableTime;
        if (cooldownEnd.getDate() !== now.getDate()) {
            nextAvailableTime = 'tomorrow';
        } else {
            nextAvailableTime = cooldownEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        
        message = `Come back in ${timeRemaining} (available ${nextAvailableTime})`;
        showTimer = true;
    } else {
        // Regular daily limit message (not cooldown)
        message = 'Come back tomorrow for more challenges!';
    }

    quizArea.innerHTML = `
        <div class="start-screen">
            <div class="start-content">
                <h2>${allSectionsCompleted ? 'All Sections Completed!' : 'Daily Limit Reached'}</h2>
                <p>${message}</p>
                
                ${showTimer ? `
                <div class="cooldown-info">
                    <p class="cooldown-message">Next challenge available at ${new Date(state.cooldownUntil).toLocaleTimeString()}</p>
                    <div class="cooldown-timer">
                        <span>Time remaining: ${getTimeRemaining()}</span>
                    </div>
                </div>
                ` : ''}
                
                <div class="stats-summary">
                    <div class="stat-item">
                        <span class="stat-value">${state.score}</span>
                        <span class="stat-label">Total Points</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${state.streak}</span>
                        <span class="stat-label">Day Streak</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${state.level}</span>
                        <span class="stat-label">Level</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Update timer every minute if in cooldown
    if (showTimer) {
        const timerElement = document.querySelector('.cooldown-timer span');
        const timerInterval = setInterval(() => {
            const remaining = getTimeRemaining();
            if (remaining === "0 minutes") {
                clearInterval(timerInterval);
                // Reset sections and cooldown
                Object.keys(state.sectionScores).forEach(s => {
                    state.sectionScores[s].completedToday = false;
                });
                state.completedSectionsToday = 0;
                state.cooldownUntil = null;
                localStorage.removeItem('cooldownUntil');
                // Show first section again
                const firstSection = Object.keys(state.questionBank)[0];
                selectSection(firstSection);
            } else {
                timerElement.textContent = `Time remaining: ${remaining}`;
            }
        }, 60000);
    }
}


    function showModal() {
        feedbackModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function hideModal() {
        feedbackModal.classList.remove('active');
        document.body.style.overflow = '';
    }
});