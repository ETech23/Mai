<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TechLearn Platform</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>
        /* Previous styles remain the same */
        .level-selector-container {
            position: relative;
            margin-bottom: 20px;
        }

        .level-selector-header {
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            background-color: #f0f4ff;
            padding: 10px;
            border-radius: 8px;
        }

        .level-selector-header i {
            margin-left: 10px;
            transition: transform 0.3s ease;
        }

        .level-selector-header.expanded i {
            transform: rotate(180deg);
        }

        .level-dropdown {
            display: none;
            position: absolute;
            top: 100%;
            left: 0;
            width: 100%;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 10;
            margin-top: 10px;
        }

        .level-dropdown.show {
            display: block;
        }

        .level-btn {
            width: 100%;
            text-align: center;
            padding: 12px;
            border: none;
            background-color: transparent;
            cursor: pointer;
            transition: background-color 0.3s ease;
        }

        .level-btn:hover {
            background-color: #f0f4ff;
        }

        .level-btn.locked {
            color: #aaa;
            cursor: not-allowed;
            position: relative;
        }

        .level-btn.locked::after {
            content: '🔒';
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);
        }
    </style>
</head>
<body>
    <div class="app-container">
        <!-- Sidebar -->
        <div class="sidebar">
            <div class="sidebar-logo">
                TechLearn
            </div>

            <!-- Course Selector -->
            <div class="course-selector">
                <button class="course-btn active" data-course="ai">AI Course</button>
                <button class="course-btn" data-course="crypto">Crypto Course</button>
            </div>

            <!-- Level Selector with Dropdown -->
            <div class="level-selector-container">
                <div class="level-selector-header">
                    <span id="currentLevelDisplay">Beginner Level</span>
                    <i>▼</i>
                </div>
                <div class="level-dropdown" id="levelDropdown">
                    <button class="level-btn active" data-level="beginner">Beginner</button>
                    <button class="level-btn" data-level="intermediate" id="intermediateLevel">Intermediate</button>
                    <button class="level-btn" data-level="advanced" id="advancedLevel">Advanced</button>
                </div>
            </div>

            <!-- Lessons Container -->
            <div class="sidebar-lessons" id="lessonsList">
                <!-- Lessons will be dynamically populated here -->
            </div>
        </div>

        <!-- Rest of the previous HTML remains the same -->
    </div>

    <script>
        // Global state
        let currentCourse = 'ai';
        let currentLevel = 'beginner';
        let currentLessonIndex = 0;
        let courseData = null;
        let quizAttempts = 0;
        const MAX_QUIZ_ATTEMPTS = 3;

        // Level progression tracking
        const levelProgress = {
            beginner: false,
            intermediate: false,
            advanced: false
        };

        // DOM Elements
        const courseButtons = document.querySelectorAll('.course-btn');
        const levelSelectorHeader = document.querySelector('.level-selector-header');
        const levelDropdown = document.getElementById('levelDropdown');
        const currentLevelDisplay = document.getElementById('currentLevelDisplay');
        const intermediateLevel = document.getElementById('intermediateLevel');
        const advancedLevel = document.getElementById('advancedLevel');
        const lessonsList = document.getElementById('lessonsList');
        const courseTitle = document.getElementById('courseTitle');
        const lessonContentArea = document.getElementById('lessonContentArea');
        const quizContainer = document.getElementById('quizContainer');
        const quizQuestions = document.getElementById('quizQuestions');
        const quizResult = document.getElementById('quizResult');
        const submitQuizBtn = document.getElementById('submitQuizBtn');
        const interactiveChallengeArea = document.getElementById('interactiveChallengeArea');
        const challengeContent = document.getElementById('challengeContent');
        const challengeInput = document.getElementById('challengeInput');
        const checkChallengeBtn = document.getElementById('checkChallengeBtn');
        const challengeFeedback = document.getElementById('challengeFeedback');
        const prevLessonBtn = document.getElementById('prevLessonBtn');
        const nextLessonBtn = document.getElementById('nextLessonBtn');
        const progressBarFill = document.getElementById('progressBarFill');

        // Toggle Level Selector Dropdown
        levelSelectorHeader.addEventListener('click', () => {
            levelSelectorHeader.classList.toggle('expanded');
            levelDropdown.classList.toggle('show');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (event) => {
            if (!levelSelectorHeader.contains(event.target) && 
                !levelDropdown.contains(event.target)) {
                levelSelectorHeader.classList.remove('expanded');
                levelDropdown.classList.remove('show');
            }
        });

        // Update level selector buttons based on progress
        function updateLevelButtons() {
            // Intermediate level locked if beginner not completed
            if (!levelProgress.beginner) {
                intermediateLevel.classList.add('locked');
                intermediateLevel.disabled = true;
            } else {
                intermediateLevel.classList.remove('locked');
                intermediateLevel.disabled = false;
            }

            // Advanced level locked if intermediate not completed
            if (!levelProgress.intermediate) {
                advancedLevel.classList.add('locked');
                advancedLevel.disabled = true;
            } else {
                advancedLevel.classList.remove('locked');
                advancedLevel.disabled = false;
            }
        }

        // Load Lessons from JSON
        async function loadLessons(course, level) {
            try {
                const response = await fetch(`${course}_${level}_lessons.json`);
                courseData = await response.json();

                // Populate sidebar lessons
                lessonsList.innerHTML = courseData.lessons.map((lesson, index) => `
                    <div class="lesson-item ${index === 0 ? 'active' : ''}" data-index="${index}">
                        <i>📚</i> ${lesson.title}
                    </div>
                `).join('');

                // Add event listeners to lesson items
                document.querySelectorAll('.lesson-item').forEach(item => {
                    item.addEventListener('click', () => {
                        // Remove active from all lessons
                        document.querySelectorAll('.lesson-item').forEach(el => el.classList.remove('active'));
                        
                        // Add active to clicked lesson
                        item.classList.add('active');
                        
                        // Load lesson content
                        currentLessonIndex = parseInt(item.dataset.index);
                        loadLessonContent(currentLessonIndex);
                    });
                });

                // Load first lesson by default
                loadLessonContent(0);

                // Update progress bar
                updateProgressBar();
            } catch (error) {
                console.error('Error loading lessons:', error);
                lessonContentArea.innerHTML = `<p>Error loading lessons: ${error.message}</p>`;
            }
        }

        // Submit Quiz with Level Progression
        function submitQuiz() {
            const quiz = courseData.lessons[currentLessonIndex].quiz;
            let correctAnswers = 0;
            let totalQuestions = quiz.length;

            // Check answers
            quiz.forEach((question, qIndex) => {
                const selectedOption = document.querySelector(
                    `.quiz-option[data-question="${qIndex}"].selected`
                );
                
                if (selectedOption && 
                    parseInt(selectedOption.dataset.option) === question.correctAnswer) {
                    correctAnswers++;
                }
            });

            // Calculate score
            const score = (correctAnswers / totalQuestions) * 100;
            quizAttempts++;

            // Display result
            quizResult.style.display = 'block';
            
            if (score >= 70) {
                quizResult.innerHTML = `
                    <h4>Congratulations! 🎉</h4>
                    <p>You passed the quiz with ${score.toFixed(0)}% (${correctAnswers}/${totalQuestions} correct).</p>
                `;
                quizResult.classList.remove('fail');
                quizResult.classList.add('pass');
                submitQuizBtn.style.display = 'none';

                // Update level progression
                if (currentLevel === 'beginner') {
                    levelProgress.beginner = true;
                } else if (currentLevel === 'intermediate') {
                    levelProgress.intermediate = true;
                } else if (currentLevel === 'advanced') {
                    levelProgress.advanced = true;
                }

                // Update level buttons
                updateLevelButtons();
            } else {
                if (quizAttempts < MAX_QUIZ_ATTEMPTS) {
                    quizResult.innerHTML = `
                        <h4>Try Again</h4>
                        <p>You scored ${score.toFixed(0)}% (${correctAnswers}/${totalQuestions} correct).</p>
                        <p>Attempt ${quizAttempts} of ${MAX_QUIZ_ATTEMPTS}. Keep studying!</p>
                    `;
                    quizResult.classList.remove('pass');
                    quizResult.classList.add('fail');
                } else {
                    quizResult.innerHTML = `
                        <h4>Quiz Attempts Exhausted</h4>
                        <p>You've used all ${MAX_QUIZ_ATTEMPTS} attempts. Please review the lesson materials.</p>
                    `;
                    quizResult.classList.remove('pass');
                    quizResult.classList.add('fail');
                    submitQuizBtn.style.display = 'none';
                }
            }
        }

        // Level Selector Functionality
        document.querySelectorAll('.level-btn').forEach(button => {
            button.addEventListener('click', function() {
                // Check if level is locked
                if (this.classList.contains('locked')) {
                    return;
                }

                // Remove active from all buttons
                document.querySelectorAll('.level-btn').forEach(btn => btn.classList.remove('active'));
                
                // Add active to clicked button
                this.classList.add('active');

                // Update current level
                currentLevel = this.dataset.level;
                
                // Update level display
                currentLevelDisplay.textContent = `${currentLevel.charAt(0).toUpperCase() + currentLevel.slice(1)} Level`;
                
                // Update page title
                courseTitle.textContent = `${currentCourse.toUpperCase()} Course - ${currentLevel.charAt(0).toUpperCase() + currentLevel.slice(1)} Level`;

                // Close dropdown
                levelSelectorHeader.classList.remove('expanded');
                levelDropdown.classList.remove('show');

                // Load lessons for selected level
                loadLessons(currentCourse, currentLevel);
            });
        });

        // Rest of the previous script remains the same...

        // Initial load and setup
        loadLessons(currentCourse, currentLevel);
        updateLevelButtons();
    </script>
</body>
</html>