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
        level: 1,
        questionsAnsweredToday: 0,
        maxQuestionsPerDay: 15,
        usedQuestionIds: new Set(),
        userPerformance: [],
        questionBank: getQuestionBank(),
        sectionScores: {}
    };

    // Initialize the app
    init();

    function init() {
        initializeSectionScores();
        renderSectionButtons();
        setupEventListeners();
        updateStatsDisplay();
        hideModal();
        
        // Auto-select first section
        const sections = Object.keys(state.questionBank);
        if (sections.length > 0) {
            selectSection(sections[0]);
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
                correct: 0,
                total: 0,
                lastScore: 0
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
        const isPerfect = correctCount === 5;
        const sectionScore = sessionAnswers.reduce((sum, perf) => {
            return sum + (perf.isCorrect ? calculatePoints(perf.difficulty) : 0);
        }, 0);
        
        // Update section stats
        state.sectionScores[section].lastScore = correctCount;
        
        // Show results
        feedbackIcon.textContent = isPerfect ? '🏆' : '📊';
        feedbackIcon.style.color = isPerfect ? 'var(--warning-color)' : 'var(--secondary-color)';
        feedbackTitle.textContent = isPerfect ? 'Perfect Score!' : 'Section Complete';
        feedbackText.textContent = `You answered ${correctCount} out of 5 correctly.`;
        pointsEarned.textContent = sectionScore;
        nextQuestionBtn.textContent = 'Back to Sections';
        
        // Update button behavior
        nextQuestionBtn.onclick = () => {
            hideModal();
            selectSection(section);
        };
        
        showModal();
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
        streakDisplay.textContent = state.streak;
        levelDisplay.textContent = state.level;
    }

    function showDailyLimitReached() {
        quizArea.innerHTML = `
            <div class="start-screen">
                <div class="start-content">
                    <h2>Daily Limit Reached</h2>
                    <p>Come back tomorrow for more challenges!</p>
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