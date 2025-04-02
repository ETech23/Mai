// Main Application JavaScript
document.addEventListener('DOMContentLoaded', () => {
    // Fetch course data from data.json
    fetch('data.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            initializeApp(data);
        })
        .catch(error => {
            console.error('Error loading course data:', error);
            document.getElementById('app').innerHTML = `
                <div class="error-container">
                    <h2>Error Loading Course Data</h2>
                    <p>Unable to load course information. Please try again later.</p>
                </div>
            `;
        });
});

function initializeApp(courseData) {
    const appContainer = document.getElementById('app');
    const trackSelector = createTrackSelector(courseData);
    const contentContainer = document.createElement('div');
    contentContainer.id = 'content-container';
    
    appContainer.appendChild(trackSelector);
    appContainer.appendChild(contentContainer);
    
    // Get the first track key to display by default
    const defaultTrack = Object.keys(courseData)[0];
    renderTrack(courseData, defaultTrack);
    
    // Set first button as active
    document.querySelector('.track-btn').classList.add('active');
}

function createTrackSelector(courseData) {
    const trackSelector = document.createElement('div');
    trackSelector.className = 'track-selector';
    
    Object.keys(courseData).forEach(trackKey => {
        const track = courseData[trackKey];
        const button = document.createElement('button');
        button.className = 'track-btn';
        button.textContent = track.title;
        button.dataset.track = trackKey;
        
        button.addEventListener('click', (event) => {
            // Remove active class from all buttons
            document.querySelectorAll('.track-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Add active class to clicked button
            event.target.classList.add('active');
            
            // Render selected track
            renderTrack(courseData, trackKey);
        });
        
        trackSelector.appendChild(button);
    });
    
    return trackSelector;
}

function renderTrack(courseData, trackKey) {
    const track = courseData[trackKey];
    const contentContainer = document.getElementById('content-container');
    contentContainer.innerHTML = '';
    
    const trackContent = document.createElement('div');
    trackContent.className = 'track-content';
    
    // Track header
    const trackHeader = document.createElement('div');
    trackHeader.className = 'track-header';
    trackHeader.innerHTML = `
        <h2>${track.title}</h2>
        <p>${track.description}</p>
    `;
    trackContent.appendChild(trackHeader);
    
    // Render each level
    track.levels.forEach(level => {
        const levelContainer = document.createElement('div');
        levelContainer.className = 'level-container';
        
        // Level header
        const levelHeader = document.createElement('div');
        levelHeader.className = 'level-header';
        levelHeader.innerHTML = `<h3>${level.name}</h3>`;
        levelContainer.appendChild(levelHeader);
        
        // Render modules
        level.modules.forEach((module, moduleIndex) => {
            const moduleContainer = document.createElement('div');
            moduleContainer.className = 'module-container';
            
            // Module header
            moduleContainer.innerHTML = `
                <div class="module-header">
                    <h4>${moduleIndex + 1}. ${module.title}</h4>
                    <p>${module.description}</p>
                </div>
            `;
            
            // Lessons
            const lessonsContainer = document.createElement('div');
            lessonsContainer.className = 'lessons-container';
            
            module.lessons.forEach((lesson, lessonIndex) => {
                const lessonElement = document.createElement('div');
                lessonElement.className = 'lesson';
                
                let lessonContent = '';
                if (Array.isArray(lesson.content)) {
                    lessonContent = lesson.content.map(item => `<p>${item}</p>`).join('');
                } else {
                    lessonContent = `<p>${lesson.content}</p>`;
                }
                
                lessonElement.innerHTML = `
                    <div class="lesson-header">
                        <h5>${lessonIndex + 1}. ${lesson.title}</h5>
                        <div class="lesson-meta">
                            <span class="lesson-type">${lesson.type}</span>
                            <span class="lesson-duration">${lesson.duration}</span>
                        </div>
                    </div>
                    <div class="lesson-content">${lessonContent}</div>
                `;
                
                lessonsContainer.appendChild(lessonElement);
            });
            
            moduleContainer.appendChild(lessonsContainer);
            
            // Quiz
            if (module.quiz) {
                const quizContainer = createQuizContainer(module.quiz, moduleIndex);
                moduleContainer.appendChild(quizContainer);
            }
            
            levelContainer.appendChild(moduleContainer);
        });
        
        // Final Exam
        if (level.exam) {
            const examContainer = createExamContainer(level.exam);
            levelContainer.appendChild(examContainer);
        }
        
        trackContent.appendChild(levelContainer);
    });
    
    contentContainer.appendChild(trackContent);
    
    // Initialize quiz functionality after rendering
    initializeQuizzes();
}

function createQuizContainer(quiz, moduleIndex) {
    const quizContainer = document.createElement('div');
    quizContainer.className = 'quiz-container';
    quizContainer.dataset.moduleIndex = moduleIndex;
    
    const quizHeader = document.createElement('div');
    quizHeader.className = 'quiz-header';
    quizHeader.innerHTML = `
        <h5>${quiz.title}</h5>
        <p>Passing Score: ${quiz.passingScore}%</p>
    `;
    
    const quizContent = document.createElement('div');
    quizContent.className = 'quiz-content';
    
    const quizForm = document.createElement('form');
    quizForm.className = 'quiz-form';
    quizForm.dataset.quizId = `quiz-${moduleIndex}`;
    
    quiz.questions.forEach((question, questionIndex) => {
        const questionElement = document.createElement('div');
        questionElement.className = 'quiz-question';
        
        questionElement.innerHTML = `
            <p class="question-text">${questionIndex + 1}. ${question.text}</p>
            <div class="question-options">
                ${question.options.map((option, optionIndex) => `
                    <div class="option">
                        <input type="radio" 
                            id="q${moduleIndex}-${questionIndex}-${optionIndex}" 
                            name="q${moduleIndex}-${questionIndex}" 
                            value="${optionIndex}"
                            data-correct="${optionIndex === question.answer ? 'true' : 'false'}"
                        >
                        <label for="q${moduleIndex}-${questionIndex}-${optionIndex}">${option}</label>
                    </div>
                `).join('')}
            </div>
            <div class="question-explanation" id="explanation-${moduleIndex}-${questionIndex}" style="display: none;">
                <p>${question.explanation}</p>
            </div>
        `;
        
        quizForm.appendChild(questionElement);
    });
    
    // Submit button
    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.className = 'quiz-submit-btn';
    submitButton.textContent = 'Submit Quiz';
    quizForm.appendChild(submitButton);
    
    // Quiz results area
    const quizResults = document.createElement('div');
    quizResults.className = 'quiz-results';
    quizResults.style.display = 'none';
    quizResults.innerHTML = `
        <div class="results-content">
            <h5>Quiz Results</h5>
            <p class="score">Your score: <span class="score-value">0</span>%</p>
            <p class="pass-status"></p>
        </div>
        <button class="retry-quiz-btn">Try Again</button>
    `;
    
    quizContent.appendChild(quizForm);
    quizContent.appendChild(quizResults);
    
    quizContainer.appendChild(quizHeader);
    quizContainer.appendChild(quizContent);
    
    return quizContainer;
}

function createExamContainer(exam) {
    const examContainer = document.createElement('div');
    examContainer.className = 'exam-container';
    
    examContainer.innerHTML = `
        <div class="exam-header">
            <h4>${exam.title}</h4>
            <p>${exam.description}</p>
            <p>Passing Score: ${exam.passingScore}%</p>
        </div>
        <div class="exam-content">
            <button class="start-exam-btn">Start Final Exam</button>
        </div>
        <div class="certificate-info" style="display: none;">
            <h5>${exam.certificate.title}</h5>
            <p>${exam.certificate.description}</p>
        </div>
    `;
    
    return examContainer;
}

function initializeQuizzes() {
    // Add event listeners to quiz forms
    document.querySelectorAll('.quiz-form').forEach(form => {
        form.addEventListener('submit', handleQuizSubmit);
    });
    
    // Add event listeners to retry buttons
    document.querySelectorAll('.retry-quiz-btn').forEach(button => {
        button.addEventListener('click', handleQuizRetry);
    });
    
    // Add event listeners to final exam buttons
    document.querySelectorAll('.start-exam-btn').forEach(button => {
        button.addEventListener('click', handleStartExam);
    });
}

function handleQuizSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const quizId = form.dataset.quizId;
    const questions = form.querySelectorAll('.quiz-question');
    
    let correctAnswers = 0;
    let totalQuestions = questions.length;
    
    questions.forEach((question, index) => {
        const selectedOption = question.querySelector('input[type="radio"]:checked');
        
        // Show all explanations
        const explanation = document.getElementById(`explanation-${quizId.split('-')[1]}-${index}`);
        if (explanation) {
            explanation.style.display = 'block';
        }
        
        if (selectedOption && selectedOption.dataset.correct === 'true') {
            correctAnswers++;
            question.classList.add('correct');
            question.classList.remove('incorrect');
        } else {
            question.classList.add('incorrect');
            question.classList.remove('correct');
        }
    });
    
    const score = Math.round((correctAnswers / totalQuestions) * 100);
    
    // Update and show results
    const resultsContainer = form.parentNode.querySelector('.quiz-results');
    const scoreValue = resultsContainer.querySelector('.score-value');
    const passStatus = resultsContainer.querySelector('.pass-status');
    
    scoreValue.textContent = score;
    
    // Get passing score from quiz header
    const quizContainer = form.closest('.quiz-container');
    const passingScoreText = quizContainer.querySelector('.quiz-header p').textContent;
    const passingScore = parseInt(passingScoreText.match(/\d+/)[0], 10);
    
    if (score >= passingScore) {
        passStatus.textContent = 'Congratulations! You passed the quiz.';
        passStatus.className = 'pass-status passed';
    } else {
        passStatus.textContent = `You did not pass. Required score: ${passingScore}%`;
        passStatus.className = 'pass-status failed';
    }
    
    // Hide form and show results
    form.style.display = 'none';
    resultsContainer.style.display = 'block';
}

function handleQuizRetry(event) {
    const resultsContainer = event.target.closest('.quiz-results');
    const form = resultsContainer.previousElementSibling;
    
    // Reset form
    form.reset();
    
    // Hide results and explanations
    resultsContainer.style.display = 'none';
    form.style.display = 'block';
    
    // Hide all explanations
    form.querySelectorAll('.question-explanation').forEach(explanation => {
        explanation.style.display = 'none';
    });
    
    // Remove correct/incorrect classes
    form.querySelectorAll('.quiz-question').forEach(question => {
        question.classList.remove('correct', 'incorrect');
    });
}

function handleStartExam(event) {
    const examContainer = event.target.closest('.exam-container');
    const levelContainer = examContainer.closest('.level-container');
    
    // Create combined exam from all quizzes in the level
    const quizzes = levelContainer.querySelectorAll('.quiz-container');
    const examContent = document.createElement('div');
    examContent.className = 'exam-questions';
    
    let allQuestions = [];
    let questionCounter = 0;
    
    quizzes.forEach((quiz, quizIndex) => {
        const moduleIndex = quiz.dataset.moduleIndex;
        const questions = quiz.querySelectorAll('.quiz-question');
        
        questions.forEach((question, questionIndex) => {
            // Clone the question
            const clonedQuestion = question.cloneNode(true);
            
            // Update IDs and names to avoid conflicts
            const inputs = clonedQuestion.querySelectorAll('input[type="radio"]');
            inputs.forEach((input, optionIndex) => {
                input.id = `exam-q${questionCounter}-${optionIndex}`;
                input.name = `exam-q${questionCounter}`;
            });
            
            const labels = clonedQuestion.querySelectorAll('label');
            labels.forEach((label, optionIndex) => {
                label.htmlFor = `exam-q${questionCounter}-${optionIndex}`;
            });
            
            // Update question number
            const questionText = clonedQuestion.querySelector('.question-text');
            questionText.textContent = `${questionCounter + 1}. ${questionText.textContent.split('. ')[1]}`;
            
            examContent.appendChild(clonedQuestion);
            questionCounter++;
        });
    });
    
    // Create exam form
    const examForm = document.createElement('form');
    examForm.className = 'exam-form';
    examForm.appendChild(examContent);
    
    // Submit button
    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.className = 'exam-submit-btn';
    submitButton.textContent = 'Submit Exam';
    examForm.appendChild(submitButton);
    
    // Replace button with exam form
    const examContentDiv = event.target.parentNode;
    examContentDiv.innerHTML = '';
    examContentDiv.appendChild(examForm);
    
    // Add event listener to exam form
    examForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        let correctAnswers = 0;
        let totalQuestions = examContent.querySelectorAll('.quiz-question').length;
        
        examContent.querySelectorAll('.quiz-question').forEach(question => {
            const selectedOption = question.querySelector('input[type="radio"]:checked');
            
            if (selectedOption && selectedOption.dataset.correct === 'true') {
                correctAnswers++;
                question.classList.add('correct');
                question.classList.remove('incorrect');
            } else {
                question.classList.add('incorrect');
                question.classList.remove('correct');
            }
        });
        
        const score = Math.round((correctAnswers / totalQuestions) * 100);
        
        // Get exam passing score
        const examHeader = examContainer.querySelector('.exam-header');
        const passingScoreText = examHeader.querySelectorAll('p')[1].textContent;
        const passingScore = parseInt(passingScoreText.match(/\d+/)[0], 10);
        
        // Create results div
        const resultsDiv = document.createElement('div');
        resultsDiv.className = 'exam-results';
        
        if (score >= passingScore) {
            resultsDiv.innerHTML = `
                <h4>Exam Results</h4>
                <p class="score">Your score: ${score}%</p>
                <p class="pass-status passed">Congratulations! You passed the exam.</p>
                <div class="certificate">
                    <h5>Certificate Earned!</h5>
                    <div class="certificate-details"></div>
                </div>
            `;
            
            // Show certificate info
            const certificateInfo = examContainer.querySelector('.certificate-info');
            certificateInfo.style.display = 'block';
            
            // Clone certificate info to results
            const certificateDetails = resultsDiv.querySelector('.certificate-details');
            certificateDetails.innerHTML = certificateInfo.innerHTML;
        } else {
            resultsDiv.innerHTML = `
                <h4>Exam Results</h4>
                <p class="score">Your score: ${score}%</p>
                <p class="pass-status failed">You did not pass. Required score: ${passingScore}%</p>
                <button class="retry-exam-btn">Try Again</button>
            `;
            
            // Add event listener to retry button
            resultsDiv.querySelector('.retry-exam-btn').addEventListener('click', function() {
                // Reset and show exam form again
                examForm.reset();
                resultsDiv.style.display = 'none';
                examForm.style.display = 'block';
                
                // Remove correct/incorrect classes
                examForm.querySelectorAll('.quiz-question').forEach(question => {
                    question.classList.remove('correct', 'incorrect');
                });
            });
        }
        
        // Hide form and show results
        examForm.style.display = 'none';
        examContentDiv.appendChild(resultsDiv);
    });
}

