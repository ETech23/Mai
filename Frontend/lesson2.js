// Main application class
class LearningApp {
  constructor() {
    this.coursesData = null;
    this.currentTrack = null;
    this.currentLevel = null;
    this.currentModule = null;
    this.currentLesson = null;
    this.userProgress = this.loadUserProgress();
    
    // DOM elements
    this.appContainer = document.querySelector('.app-container');
this.mainContent = document.querySelector('.main-content'); // Changed from #main-content
this.sideNav = document.querySelector('.sidebar'); // Changed from #side-nav
this.topNav = document.createElement('nav'); // We'll add this dynamically
this.topNav.id = 'top-nav';
document.body.prepend(this.topNav);
  }
  
  updateNavState(view, trackId = null, levelId = null, moduleId = null, lessonId = null) {
    // Update current navigation state
    this.currentView = view;
    this.currentTrack = trackId;
    this.currentLevel = levelId;
    this.currentModule = moduleId;
    this.currentLesson = lessonId;
    
    // Update active navigation UI
    this.updateActiveNav();
    
    // Push to history
    this.pushHistoryState({ view, trackId, levelId, moduleId, lessonId });
  }


  // Initialize the application
  async init() {
    try {
      // Fetch course data
      const response = await fetch('./data.json');
      if (!response.ok) throw new Error('Failed to fetch course data');
      this.coursesData = await response.json();
      
      // Initialize UI components
      this.initUI();
      
      if (!this.coursesData) {
  this.renderError("Course data not loaded - using sample data");
  this.coursesData = {
    "default-track": {
      title: "Sample Track",
      description: "Demo content",
      levels: [{
        name: "Level 1",
        modules: [{
          title: "Sample Module",
          description: "Demo module",
          lessons: [{
            title: "Sample Lesson",
            type: "reading",
            duration: "5 min",
            content: ["This is a placeholder lesson."]
          }]
        }]
      }]
    }
  };
}
      

      
      // Load the tracks overview by default
      this.renderTracksOverview();
      
      // Add event listeners
      this.addEventListeners();
      
      // Check for deep linking
      this.handleDeepLinking();
    } catch (error) {
      console.error('Failed to initialize application:', error);
      this.renderError('Failed to load course data. Please try again later.');
    }
  }

  // Initialize UI components
  initUI() {
    // Create top navigation
    this.topNav.innerHTML = `
      <div class="logo">
        <img src="logo.svg" alt="Learning App Logo">
        <h1>LearnHub</h1>
      </div>
      <div class="user-menu">
        <div class="progress-summary">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${this.calculateOverallProgress()}%"></div>
          </div>
          <span>${this.calculateOverallProgress()}% Complete</span>
        </div>
        <button id="profile-btn" class="icon-btn">
          <i class="fa-solid fa-user"></i>
        </button>
      </div>
    `;
    
    // Create side navigation structure
    this.renderSideNav();
  }

  // Render the side navigation
  renderSideNav() {
    if (!this.coursesData) return;
    
    let navContent = `
      <div class="nav-header">
        <button id="home-btn" class="nav-item active">
          <i class="fa-solid fa-house"></i>
          <span>Home</span>
        </button>
      </div>
      <div class="nav-tracks">
    `;
    
    // Add tracks to navigation
    Object.keys(this.coursesData).forEach(trackId => {
      const track = this.coursesData[trackId];
      const isUnlocked = this.isTrackUnlocked(trackId);
      navContent += `
        <button class="nav-item track-item ${isUnlocked ? 'unlocked' : 'locked'}" 
                data-track="${trackId}" ${!isUnlocked ? 'disabled' : ''}>
          <i class="fa-solid ${this.getTrackIcon(trackId)}"></i>
          <span>${track.title}</span>
          ${!isUnlocked ? '<i class="fa-solid fa-lock lock-icon"></i>' : ''}
        </button>
      `;
    });
    
    navContent += `
      </div>
      <div class="nav-footer">
        <button id="settings-btn" class="nav-item">
          <i class="fa-solid fa-gear"></i>
          <span>Settings</span>
        </button>
        <button id="help-btn" class="nav-item">
          <i class="fa-solid fa-circle-question"></i>
          <span>Help</span>
        </button>
      </div>
    `;
    
    this.sideNav.innerHTML = navContent;
    
    // Add event listeners to nav items
    this.sideNav.querySelectorAll('.track-item').forEach(item => {
      if (!item.disabled) {
        item.addEventListener('click', (e) => {
          const trackId = e.currentTarget.dataset.track;
          this.loadTrack(trackId);
        });
      }
    });
    
    document.getElementById('home-btn').addEventListener('click', () => {
      this.renderTracksOverview();
    });
  }

  // Add global event listeners
  addEventListeners() {
    // Handle window resize for responsive design
    window.addEventListener('resize', this.handleResize.bind(this));
    
    // Handle navigation toggle for mobile
    document.getElementById('nav-toggle').addEventListener('click', () => {
      this.sideNav.classList.toggle('open');
    });
    
    // Handle history state changes
    window.addEventListener('popstate', (event) => {
      if (event.state) {
        this.handleStateNavigation(event.state);
      } else {
        this.renderTracksOverview();
      }
    });
  }

  // Handle deep linking from URL
  handleDeepLinking() {
    const params = new URLSearchParams(window.location.search);
    const trackId = params.get('track');
    const levelId = params.get('level');
    const moduleId = params.get('module');
    const lessonId = params.get('lesson');
    
    if (trackId && this.isTrackUnlocked(trackId)) {
      this.loadTrack(trackId, levelId, moduleId, lessonId);
    }
  }

  // Navigation state handler
  handleStateNavigation(state) {
    const { view, trackId, levelId, moduleId, lessonId } = state;
    
    switch (view) {
      case 'tracks':
        this.renderTracksOverview();
        break;
      case 'track':
        this.loadTrack(trackId);
        break;
      case 'level':
        this.loadLevel(trackId, levelId);
        break;
      case 'module':
        this.loadModule(trackId, levelId, moduleId);
        break;
      case 'lesson':
        this.loadLesson(trackId, levelId, moduleId, lessonId);
        break;
      case 'quiz':
        this.loadQuiz(trackId, levelId, moduleId);
        break;
      case 'exam':
        this.loadExam(trackId, levelId);
        break;
      default:
        this.renderTracksOverview();
    }
  }

  // Handle responsive design
  handleResize() {
    const isMobile = window.innerWidth < 768;
    
    if (isMobile) {
      this.sideNav.classList.remove('open');
      this.appContainer.classList.add('mobile');
    } else {
      this.appContainer.classList.remove('mobile');
    }
  }
  
  

  // Render the tracks overview (home screen)
  renderTracksOverview() {
    this.currentTrack = null;
    this.currentLevel = null;
    this.currentModule = null;
    this.currentLesson = null;
    
    // Update navigation state
    this.updateNavState('tracks');
    
    // Update active navigation
    this.updateActiveNav();
    
    let content = `
      <div class="tracks-container">
        <h2 class="section-title">Available Learning Tracks</h2>
        <div class="tracks-grid">
    `;
    
    // Generate track cards
    Object.keys(this.coursesData).forEach(trackId => {
      const track = this.coursesData[trackId];
      const isUnlocked = this.isTrackUnlocked(trackId);
      const progress = this.calculateTrackProgress(trackId);
      
      content += `
        <div class="track-card ${isUnlocked ? 'unlocked' : 'locked'}">
          <div class="track-icon">
            <i class="fa-solid ${this.getTrackIcon(trackId)}"></i>
            ${!isUnlocked ? '<i class="fa-solid fa-lock lock-overlay"></i>' : ''}
          </div>
          <div class="track-info">
            <h3>${track.title}</h3>
            <p>${track.description}</p>
            <div class="track-progress">
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${progress}%"></div>
              </div>
              <span>${progress}% Complete</span>
            </div>
          </div>
          <button class="track-btn" data-track="${trackId}" ${!isUnlocked ? 'disabled' : ''}>
            ${progress > 0 ? 'Continue' : 'Start Learning'}
          </button>
        </div>
      `;
    });
    
    content += `
        </div>
      </div>
    `;
    
    this.mainContent.innerHTML = content;
    
    // Add event listeners to track buttons
    this.mainContent.querySelectorAll('.track-btn').forEach(btn => {
      if (!btn.disabled) {
        btn.addEventListener('click', (e) => {
          const trackId = e.currentTarget.dataset.track;
          this.loadTrack(trackId);
        });
      }
    });
    
    // Push state to history
    this.pushHistoryState({ view: 'tracks' }, 'Learning Tracks - LearnHub');
  }

  // Load a specific track
  loadTrack(trackId, levelId = null, moduleId = null, lessonId = null) {
    if (!this.isTrackUnlocked(trackId)) return;
    
    this.currentTrack = trackId;
    const track = this.coursesData[trackId];
    
    // Update navigation state
    this.updateNavState('track', trackId);
    
    // Update active navigation
    this.updateActiveNav();
    
    let content = `
      <div class="track-detail">
        <div class="track-header">
          <div class="back-button" id="back-to-tracks">
            <i class="fa-solid fa-arrow-left"></i>
          </div>
          <div class="track-header-content">
            <h2>${track.title}</h2>
            <p>${track.description}</p>
          </div>
        </div>
        <div class="levels-container">
    `;
    
    // Generate levels
    track.levels.forEach((level, levelIndex) => {
      const isLevelUnlocked = this.isLevelUnlocked(trackId, levelIndex);
      const levelProgress = this.calculateLevelProgress(trackId, levelIndex);
      
      content += `
        <div class="level-card ${isLevelUnlocked ? 'unlocked' : 'locked'}">
          <div class="level-header">
            <h3>${level.name}</h3>
            ${!isLevelUnlocked ? '<i class="fa-solid fa-lock lock-icon"></i>' : ''}
            <div class="level-progress">
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${levelProgress}%"></div>
              </div>
              <span>${levelProgress}% Complete</span>
            </div>
          </div>
          <div class="modules-container">
      `;
      
      // Generate modules
      level.modules.forEach((module, moduleIndex) => {
        const isModuleUnlocked = isLevelUnlocked && this.isModuleUnlocked(trackId, levelIndex, moduleIndex);
        const moduleProgress = this.calculateModuleProgress(trackId, levelIndex, moduleIndex);
        
        content += `
          <div class="module-card ${isModuleUnlocked ? 'unlocked' : 'locked'}">
            <div class="module-header">
              <h4>${module.title}</h4>
              ${!isModuleUnlocked ? '<i class="fa-solid fa-lock lock-icon"></i>' : ''}
              <p>${module.description}</p>
              <div class="module-progress">
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${moduleProgress}%"></div>
                </div>
                <span>${moduleProgress}% Complete</span>
              </div>
            </div>
            <button class="module-btn" data-level="${levelIndex}" data-module="${moduleIndex}" 
                    ${!isModuleUnlocked ? 'disabled' : ''}>
              View Module
            </button>
          </div>
        `;
      });
      
      // Add final exam section if available
      if (level.exam) {
        const isExamUnlocked = this.isExamUnlocked(trackId, levelIndex);
        const examCompleted = this.isExamCompleted(trackId, levelIndex);
        
        content += `
          <div class="exam-card ${isExamUnlocked ? 'unlocked' : 'locked'}">
            <div class="exam-header">
              <h4>${level.exam.title}</h4>
              ${!isExamUnlocked ? '<i class="fa-solid fa-lock lock-icon"></i>' : ''}
              <p>${level.exam.description}</p>
              <p>Passing Score: ${level.exam.passingScore}%</p>
            </div>
            <button class="exam-btn" data-level="${levelIndex}" 
                    ${!isExamUnlocked ? 'disabled' : ''}>
              ${examCompleted ? 'Review Exam' : 'Take Final Exam'}
            </button>
          </div>
        `;
      }
      
      content += `
          </div>
        </div>
      `;
    });
    
    content += `
        </div>
      </div>
    `;
    
    this.mainContent.innerHTML = content;
    
    // Add event listeners
    document.getElementById('back-to-tracks').addEventListener('click', () => {
      this.renderTracksOverview();
    });
    
    this.mainContent.querySelectorAll('.module-btn').forEach(btn => {
      if (!btn.disabled) {
        btn.addEventListener('click', (e) => {
          const levelIndex = parseInt(e.currentTarget.dataset.level);
          const moduleIndex = parseInt(e.currentTarget.dataset.module);
          this.loadModule(trackId, levelIndex, moduleIndex);
        });
      }
    });
    
    this.mainContent.querySelectorAll('.exam-btn').forEach(btn => {
      if (!btn.disabled) {
        btn.addEventListener('click', (e) => {
          const levelIndex = parseInt(e.currentTarget.dataset.level);
          this.loadExam(trackId, levelIndex);
        });
      }
    });
    
    // If specific module requested, load it
    if (levelId !== null && moduleId !== null) {
      this.loadModule(trackId, parseInt(levelId), parseInt(moduleId), lessonId);
    }
    
    // Push state to history
    this.pushHistoryState({ view: 'track', trackId }, `${track.title} - LearnHub`);
  }

  // Load a specific module
  loadModule(trackId, levelIndex, moduleIndex, lessonId = null) {
    if (!this.isModuleUnlocked(trackId, levelIndex, moduleIndex)) return;
    
    this.currentTrack = trackId;
    this.currentLevel = levelIndex;
    this.currentModule = moduleIndex;
    
    const track = this.coursesData[trackId];
    const level = track.levels[levelIndex];
    const module = level.modules[moduleIndex];
    
    // Update navigation state
    this.updateNavState('module', trackId, levelIndex, moduleIndex);
    
    // Update active navigation
    this.updateActiveNav();
    
    let content = `
      <div class="module-detail">
        <div class="module-detail-header">
          <div class="back-button" id="back-to-track">
            <i class="fa-solid fa-arrow-left"></i>
          </div>
          <div class="module-detail-info">
            <h2>${module.title}</h2>
            <p>${module.description}</p>
            <div class="breadcrumbs">
              <span>${track.title}</span>
              <i class="fa-solid fa-chevron-right"></i>
              <span>${level.name}</span>
              <i class="fa-solid fa-chevron-right"></i>
              <span>${module.title}</span>
            </div>
          </div>
        </div>
        <div class="lessons-container">
          <h3>Lessons</h3>
          <div class="lessons-list">
    `;
    
    // Generate lessons
    module.lessons.forEach((lesson, lessonIndex) => {
      const isCompleted = this.isLessonCompleted(trackId, levelIndex, moduleIndex, lessonIndex);
      
      content += `
        <div class="lesson-card ${isCompleted ? 'completed' : ''}">
          <div class="lesson-icon">
            <i class="fa-solid ${this.getLessonTypeIcon(lesson.type)}"></i>
            ${isCompleted ? '<i class="fa-solid fa-check completed-icon"></i>' : ''}
          </div>
          <div class="lesson-info">
            <h4>${lesson.title}</h4>
            <div class="lesson-meta">
              <span class="lesson-type">${lesson.type}</span>
              <span class="lesson-duration">${lesson.duration}</span>
            </div>
          </div>
          <button class="lesson-btn" data-lesson="${lessonIndex}">
            ${isCompleted ? 'Review' : 'Start'} Lesson
          </button>
        </div>
      `;
    });
    
    content += `
          </div>
        </div>
    `;
    
    // Add module quiz section if available
    if (module.quiz) {
      const isQuizUnlocked = this.isQuizUnlocked(trackId, levelIndex, moduleIndex);
      const quizCompleted = this.isQuizCompleted(trackId, levelIndex, moduleIndex);
      
      content += `
        <div class="quiz-section">
          <h3>Module Quiz</h3>
          <div class="quiz-card ${isQuizUnlocked ? 'unlocked' : 'locked'}">
            <div class="quiz-info">
              <h4>${module.quiz.title}</h4>
              ${!isQuizUnlocked ? '<i class="fa-solid fa-lock lock-icon"></i>' : ''}
              <p>Passing Score: ${module.quiz.passingScore}%</p>
              ${quizCompleted ? `
                <div class="quiz-score">
                  <span>Your Score: ${this.getQuizScore(trackId, levelIndex, moduleIndex)}%</span>
                  <i class="fa-solid fa-trophy"></i>
                </div>
              ` : ''}
            </div>
            <button class="quiz-btn" ${!isQuizUnlocked ? 'disabled' : ''}>
              ${quizCompleted ? 'Review Quiz' : 'Take Quiz'}
            </button>
          </div>
        </div>
      `;
    }
    
    content += `</div>`;
    
    this.mainContent.innerHTML = content;
    
    // Add event listeners
    document.getElementById('back-to-track').addEventListener('click', () => {
      this.loadTrack(trackId);
    });
    
    this.mainContent.querySelectorAll('.lesson-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const lessonIndex = parseInt(e.currentTarget.dataset.lesson);
        this.loadLesson(trackId, levelIndex, moduleIndex, lessonIndex);
      });
    });
    
    if (module.quiz) {
      const quizBtn = this.mainContent.querySelector('.quiz-btn');
      if (!quizBtn.disabled) {
        quizBtn.addEventListener('click', () => {
          this.loadQuiz(trackId, levelIndex, moduleIndex);
        });
      }
    }
    
    // If specific lesson requested, load it
    if (lessonId !== null) {
      this.loadLesson(trackId, levelIndex, moduleIndex, parseInt(lessonId));
    }
    
    // Push state to history
    this.pushHistoryState({ 
      view: 'module', 
      trackId, 
      levelId: levelIndex, 
      moduleId: moduleIndex 
    }, `${module.title} - LearnHub`);
  }

  // Load a specific lesson
  loadLesson(trackId, levelIndex, moduleIndex, lessonIndex) {
    if (!this.isModuleUnlocked(trackId, levelIndex, moduleIndex)) return;
    
    this.currentTrack = trackId;
    this.currentLevel = levelIndex;
    this.currentModule = moduleIndex;
    this.currentLesson = lessonIndex;
    
    const track = this.coursesData[trackId];
    const level = track.levels[levelIndex];
    const module = level.modules[moduleIndex];
    const lesson = module.lessons[lessonIndex];
    
    // Update navigation state
    this.updateNavState('lesson', trackId, levelIndex, moduleIndex, lessonIndex);
    
    // Update active navigation
    this.updateActiveNav();
    
    let content = `
      <div class="lesson-detail">
        <div class="lesson-detail-header">
          <div class="back-button" id="back-to-module">
            <i class="fa-solid fa-arrow-left"></i>
          </div>
          <div class="lesson-detail-info">
            <h2>${lesson.title}</h2>
            <div class="lesson-meta">
              <span class="lesson-type">
                <i class="fa-solid ${this.getLessonTypeIcon(lesson.type)}"></i>
                ${lesson.type}
              </span>
              <span class="lesson-duration">
                <i class="fa-regular fa-clock"></i>
                ${lesson.duration}
              </span>
            </div>
            <div class="breadcrumbs">
              <span>${track.title}</span>
              <i class="fa-solid fa-chevron-right"></i>
              <span>${module.title}</span>
              <i class="fa-solid fa-chevron-right"></i>
              <span>${lesson.title}</span>
            </div>
          </div>
        </div>
        <div class="lesson-content">
    `;
    
   // Generate lesson content based on type
    switch (lesson.type.toLowerCase()) {
      case 'video':
        content += `
          <div class="video-container">
            <div class="video-player">
              <div class="video-placeholder">
                <i class="fa-solid fa-play"></i>
                <span>Video Player</span>
              </div>
            </div>
          </div>
        `;
        break;
      case 'interactive':
        content += `
          <div class="interactive-container">
            <div class="interactive-placeholder">
              <i class="fa-solid fa-hand-pointer"></i>
              <span>Interactive Content</span>
            </div>
          </div>
        `;
        break;
    }
    
    // Add textual content
    content += `<div class="lesson-text">`;
    
    lesson.content.forEach(paragraph => {
      if (paragraph.includes('- ')) {
        // Handle bullet points
        const bullets = paragraph.split('\n');
        content += `<p>${bullets[0]}</p><ul>`;
        
        for (let i = 1; i < bullets.length; i++) {
          content += `<li>${bullets[i].replace('- ', '')}</li>`;
        }
        
        content += `</ul>`;
      } else {
        content += `<p>${paragraph}</p>`;
      }
    });
    
    content += `
          </div>
        </div>
        <div class="lesson-navigation">
    `;
    
    // Previous lesson button if available
    if (lessonIndex > 0) {
      content += `
        <button class="nav-btn prev-btn" data-lesson="${lessonIndex - 1}">
          <i class="fa-solid fa-chevron-left"></i>
          Previous Lesson
        </button>
      `;
    }
    
    // Mark as complete button
    const isCompleted = this.isLessonCompleted(trackId, levelIndex, moduleIndex, lessonIndex);
    content += `
      <button class="complete-btn ${isCompleted ? 'completed' : ''}" id="mark-complete">
        ${isCompleted ? 'Completed' : 'Mark as Complete'}
        ${isCompleted ? '<i class="fa-solid fa-check"></i>' : ''}
      </button>
    `;
    
    // Next lesson or quiz button
    if (lessonIndex < module.lessons.length - 1) {
      content += `
        <button class="nav-btn next-btn" data-lesson="${lessonIndex + 1}">
          Next Lesson
          <i class="fa-solid fa-chevron-right"></i>
        </button>
      `;
    } else if (module.quiz) {
      const isQuizUnlocked = this.isQuizUnlocked(trackId, levelIndex, moduleIndex);
      content += `
        <button class="nav-btn next-btn quiz-nav-btn" ${!isQuizUnlocked ? 'disabled' : ''}>
          Take Quiz
          <i class="fa-solid fa-chevron-right"></i>
        </button>
      `;
    }
    
    content += `
        </div>
      </div>
    `;
    
    this.mainContent.innerHTML = content;
    
    // Add event listeners
    document.getElementById('back-to-module').addEventListener('click', () => {
      this.loadModule(trackId, levelIndex, moduleIndex);
    });
    
    // Mark as complete button
    document.getElementById('mark-complete').addEventListener('click', () => {
      this.markLessonComplete(trackId, levelIndex, moduleIndex, lessonIndex);
      document.getElementById('mark-complete').classList.add('completed');
      document.getElementById('mark-complete').innerHTML = 'Completed <i class="fa-solid fa-check"></i>';
      
      // Update quiz button if it exists
      const quizNavBtn = document.querySelector('.quiz-nav-btn');
      if (quizNavBtn && this.isQuizUnlocked(trackId, levelIndex, moduleIndex)) {
        quizNavBtn.disabled = false;
      }
    });
    
    // Previous lesson button
    const prevBtn = this.mainContent.querySelector('.prev-btn');
    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        const lessonIndex = parseInt(e.currentTarget.dataset.lesson);
        this.loadLesson(trackId, levelIndex, moduleIndex, lessonIndex);
      });
    }
    
    // Next lesson button
    const nextBtn = this.mainContent.querySelector('.next-btn');
    if (nextBtn) {
      if (nextBtn.classList.contains('quiz-nav-btn')) {
        nextBtn.addEventListener('click', () => {
          this.loadQuiz(trackId, levelIndex, moduleIndex);
        });
      } else {
        nextBtn.addEventListener('click', (e) => {
          const lessonIndex = parseInt(e.currentTarget.dataset.lesson);
          this.loadLesson(trackId, levelIndex, moduleIndex, lessonIndex);
        });
      }
    }
    
    // Push state to history
    this.pushHistoryState({ 
      view: 'lesson', 
      trackId, 
      levelId: levelIndex, 
      moduleId: moduleIndex,
      lessonId: lessonIndex
    }, `${lesson.title} - LearnHub`);
  }

  // Load a module quiz
  loadQuiz(trackId, levelIndex, moduleIndex) {
    if (!this.isQuizUnlocked(trackId, levelIndex, moduleIndex)) return;
    
    this.currentTrack = trackId;
    this.currentLevel = levelIndex;
    this.currentModule = moduleIndex;
    
    const track = this.coursesData[trackId];
    const level = track.levels[levelIndex];
    const module = level.modules[moduleIndex];
    const quiz = module.quiz;
    
    // Update navigation state
    this.updateNavState('quiz', trackId, levelIndex, moduleIndex);
    
    // Update active navigation
    this.updateActiveNav();
    
    const isCompleted = this.isQuizCompleted(trackId, levelIndex, moduleIndex);
    const userScore = isCompleted ? this.getQuizScore(trackId, levelIndex, moduleIndex) : null;
    const isPassed = isCompleted && userScore >= quiz.passingScore;
    
    let content = `
      <div class="quiz-detail">
        <div class="quiz-detail-header">
          <div class="back-button" id="back-to-module">
            <i class="fa-solid fa-arrow-left"></i>
          </div>
          <div class="quiz-detail-info">
            <h2>${quiz.title}</h2>
            <div class="breadcrumbs">
              <span>${track.title}</span>
              <i class="fa-solid fa-chevron-right"></i>
              <span>${module.title}</span>
              <i class="fa-solid fa-chevron-right"></i>
              <span>${quiz.title}</span>
            </div>
            ${isCompleted ? `
              <div class="quiz-result ${isPassed ? 'passed' : 'failed'}">
                <span>Your Score: ${userScore}%</span>
                <span class="result-label">${isPassed ? 'Passed' : 'Failed'}</span>
              </div>
            ` : ''}
          </div>
        </div>
    `;
    
    if (isCompleted) {
      // Show quiz review
      content += `
        <div class="quiz-review">
          <h3>Quiz Results</h3>
          <div class="questions-review">
      `;
      
      quiz.questions.forEach((question, index) => {
        const userAnswer = this.getUserQuizAnswer(trackId, levelIndex, moduleIndex, index);
        const isCorrect = userAnswer === question.answer;
        
        content += `
          <div class="question-review ${isCorrect ? 'correct' : 'incorrect'}">
            <div class="question-header">
              <span class="question-number">Question ${index + 1}</span>
              <span class="question-result">
                ${isCorrect ? 
                  '<i class="fa-solid fa-check"></i> Correct' : 
                  '<i class="fa-solid fa-xmark"></i> Incorrect'}
              </span>
            </div>
            <div class="question-text">
              <p>${question.text}</p>
            </div>
            <div class="options-review">
        `;
        
        question.options.forEach((option, optionIndex) => {
          const isUserSelection = userAnswer === optionIndex;
          const isCorrectAnswer = question.answer === optionIndex;
          
          content += `
            <div class="option-review ${isUserSelection ? 'selected' : ''} ${isCorrectAnswer ? 'correct-answer' : ''}">
                        <span class="option-letter">${String.fromCharCode(65 + optionIndex)})</span>
            <span class="option-text">${option}</span>
            ${isCorrectAnswer ? '<i class="fa-solid fa-check correct-icon"></i>' : ''}
            ${isUserSelection && !isCorrect ? '<i class="fa-solid fa-xmark incorrect-icon"></i>' : ''}
          </div>
        `;
      });
      
      content += `
          </div>
          ${!isCorrect ? `
            <div class="correct-explanation">
              <strong>Explanation:</strong> ${question.explanation}
            </div>
          ` : ''}
        </div>
      `;
    });
    
    content += `
        </div>
        <div class="quiz-actions">
          <button id="retake-quiz" class="quiz-action-btn">
            <i class="fa-solid fa-rotate-right"></i> Retake Quiz
          </button>
          <button id="continue-after-quiz" class="quiz-action-btn primary">
            Continue Learning
          </button>
        </div>
      </div>
    `;
  } else {
    // Show active quiz
    content += `
      <div class="quiz-active">
        <div class="quiz-info">
          <div class="quiz-stats">
            <span class="questions-count">${quiz.questions.length} Questions</span>
            <span class="passing-score">Passing Score: ${quiz.passingScore}%</span>
          </div>
          <div class="quiz-timer">
            <i class="fa-regular fa-clock"></i>
            <span id="quiz-time">${quiz.timeLimit || 'No time limit'}</span>
          </div>
        </div>
        <form id="quiz-form">
    `;
    
    quiz.questions.forEach((question, index) => {
      content += `
        <div class="quiz-question" data-question="${index}">
          <div class="question-text">
            <h4>Question ${index + 1}</h4>
            <p>${question.text}</p>
          </div>
          <div class="question-options">
      `;
      
      question.options.forEach((option, optionIndex) => {
        content += `
          <label class="option">
            <input type="radio" name="question-${index}" value="${optionIndex}">
            <span class="option-letter">${String.fromCharCode(65 + optionIndex)})</span>
            <span class="option-text">${option}</span>
          </label>
        `;
      });
      
      content += `
          </div>
        </div>
      `;
    });
    
    content += `
          <div class="quiz-submit">
            <button type="submit" id="submit-quiz" class="quiz-submit-btn">
              Submit Quiz
            </button>
          </div>
        </form>
      </div>
    `;
  }
  
  content += `</div>`;
  
  this.mainContent.innerHTML = content;
  
  // Add event listeners
  document.getElementById('back-to-module').addEventListener('click', () => {
    this.loadModule(trackId, levelIndex, moduleIndex);
  });
  
  if (isCompleted) {
    document.getElementById('retake-quiz').addEventListener('click', () => {
      this.resetQuizProgress(trackId, levelIndex, moduleIndex);
      this.loadQuiz(trackId, levelIndex, moduleIndex);
    });
    
    document.getElementById('continue-after-quiz').addEventListener('click', () => {
      this.loadModule(trackId, levelIndex, moduleIndex);
    });
  } else {
    const quizForm = document.getElementById('quiz-form');
    quizForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Calculate score
      let correctAnswers = 0;
      const userAnswers = [];
      
      quiz.questions.forEach((question, index) => {
        const selectedOption = quizForm.querySelector(`input[name="question-${index}"]:checked`);
        if (selectedOption) {
          const answerIndex = parseInt(selectedOption.value);
          userAnswers.push(answerIndex);
          if (answerIndex === question.answer) {
            correctAnswers++;
          }
        } else {
          userAnswers.push(null);
        }
      });
      
      const score = Math.round((correctAnswers / quiz.questions.length) * 100);
      const isPassed = score >= quiz.passingScore;
      
      // Save quiz results
      this.saveQuizResults(trackId, levelIndex, moduleIndex, userAnswers, score);
      
      // Show results
      this.loadQuiz(trackId, levelIndex, moduleIndex);
      
      // Unlock next content if passed
      if (isPassed) {
        this.unlockNextContent(trackId, levelIndex, moduleIndex);
      }
    });
  }
  
  // Push state to history
  this.pushHistoryState({ 
    view: 'quiz', 
    trackId, 
    levelId: levelIndex, 
    moduleId: moduleIndex 
  }, `${quiz.title} - LearnHub`);
}
  
  

  // =============================================
  // Quiz/Exam Related Methods
  // =============================================

  // Save quiz results to user progress
  saveQuizResults(trackId, levelIndex, moduleIndex, userAnswers, score) {
    if (!this.userProgress[trackId]) {
      this.userProgress[trackId] = {};
    }
    if (!this.userProgress[trackId][levelIndex]) {
      this.userProgress[trackId][levelIndex] = {};
    }
    if (!this.userProgress[trackId][levelIndex][moduleIndex]) {
      this.userProgress[trackId][levelIndex][moduleIndex] = {};
    }
    
    this.userProgress[trackId][levelIndex][moduleIndex].quiz = {
      answers: userAnswers,
      score: score,
      completed: true,
      timestamp: Date.now()
    };
    
    this.saveUserProgress();
    
    // Update progress in UI
    this.updateProgressUI();
  }

  // Reset quiz progress
  resetQuizProgress(trackId, levelIndex, moduleIndex) {
    if (this.userProgress[trackId]?.[levelIndex]?.[moduleIndex]?.quiz) {
      delete this.userProgress[trackId][levelIndex][moduleIndex].quiz;
      this.saveUserProgress();
      this.updateProgressUI();
    }
  }

  // Get user's answer for a specific quiz question
  getUserQuizAnswer(trackId, levelIndex, moduleIndex, questionIndex) {
    const quizProgress = this.userProgress[trackId]?.[levelIndex]?.[moduleIndex]?.quiz;
    if (quizProgress && quizProgress.answers && quizProgress.answers[questionIndex] !== undefined) {
      return quizProgress.answers[questionIndex];
    }
    return null;
  }

  // Unlock next content when quiz is passed
  unlockNextContent(trackId, levelIndex, moduleIndex) {
    const track = this.coursesData[trackId];
    const level = track.levels[levelIndex];
    
    // Check if there's another module in this level
    if (moduleIndex < level.modules.length - 1) {
      // Unlock next module
      if (!this.userProgress[trackId][levelIndex][moduleIndex + 1]) {
        this.userProgress[trackId][levelIndex][moduleIndex + 1] = { unlocked: true };
      }
    } else {
      // This was the last module, unlock the exam if exists
      if (level.exam && !this.isExamUnlocked(trackId, levelIndex)) {
        if (!this.userProgress[trackId][levelIndex].exam) {
          this.userProgress[trackId][levelIndex].exam = { unlocked: true };
        }
      }
      
      // Check if there's another level to unlock
      if (levelIndex < track.levels.length - 1) {
        // Check if all modules in current level are completed
        const allModulesCompleted = level.modules.every((_, idx) => 
          this.isModuleCompleted(trackId, levelIndex, idx)
        );
        
        if (allModulesCompleted && level.exam && this.isExamCompleted(trackId, levelIndex)) {
          // Unlock next level
          if (!this.userProgress[trackId][levelIndex + 1]) {
            this.userProgress[trackId][levelIndex + 1] = { unlocked: true };
          }
        }
      }
    }
    
    this.saveUserProgress();
    this.updateProgressUI();
  }

  // =============================================
  // Exam Implementation
  // =============================================

  // Check if exam is unlocked
  isExamUnlocked(trackId, levelIndex) {
    const track = this.coursesData[trackId];
    const level = track.levels[levelIndex];
    
    // Exam exists and all modules are completed
    if (!level.exam) return false;
    
    // Check if explicitly unlocked in progress
    if (this.userProgress[trackId]?.[levelIndex]?.exam?.unlocked) {
      return true;
    }
    
    // Check if all modules are completed
    return level.modules.every((_, moduleIndex) => 
      this.isModuleCompleted(trackId, levelIndex, moduleIndex)
    );
  }

  // Check if exam is completed
  isExamCompleted(trackId, levelIndex) {
    return !!this.userProgress[trackId]?.[levelIndex]?.exam?.completed;
  }

  // Get exam score
  getExamScore(trackId, levelIndex) {
    return this.userProgress[trackId]?.[levelIndex]?.exam?.score || 0;
  }

  // Save exam results
  saveExamResults(trackId, levelIndex, userAnswers, score) {
    if (!this.userProgress[trackId]) {
      this.userProgress[trackId] = {};
    }
    if (!this.userProgress[trackId][levelIndex]) {
      this.userProgress[trackId][levelIndex] = {};
    }
    
    this.userProgress[trackId][levelIndex].exam = {
      answers: userAnswers,
      score: score,
      completed: true,
      timestamp: Date.now()
    };
    
    // Unlock next level if passed
    const level = this.coursesData[trackId].levels[levelIndex];
    if (score >= level.exam.passingScore && levelIndex < this.coursesData[trackId].levels.length - 1) {
      if (!this.userProgress[trackId][levelIndex + 1]) {
        this.userProgress[trackId][levelIndex + 1] = { unlocked: true };
      }
    }
    
    this.saveUserProgress();
    this.updateProgressUI();
  }

  // Reset exam progress
  resetExamProgress(trackId, levelIndex) {
    if (this.userProgress[trackId]?.[levelIndex]?.exam) {
      delete this.userProgress[trackId][levelIndex].exam;
      this.saveUserProgress();
      this.updateProgressUI();
    }
  }

  // Get user's answer for a specific exam question
  getUserExamAnswer(trackId, levelIndex, questionIndex) {
    const examProgress = this.userProgress[trackId]?.[levelIndex]?.exam;
    if (examProgress && examProgress.answers && examProgress.answers[questionIndex] !== undefined) {
      return examProgress.answers[questionIndex];
    }
    return null;
  }

  // =============================================
  // Progress Tracking Methods
  // =============================================

  // Calculate overall progress across all tracks
  calculateOverallProgress() {
    if (!this.coursesData) return 0;
    
    let totalLessons = 0;
    let completedLessons = 0;
    
    Object.keys(this.coursesData).forEach(trackId => {
      const track = this.coursesData[trackId];
      track.levels.forEach((level, levelIndex) => {
        level.modules.forEach((module, moduleIndex) => {
          totalLessons += module.lessons.length;
          module.lessons.forEach((_, lessonIndex) => {
            if (this.isLessonCompleted(trackId, levelIndex, moduleIndex, lessonIndex)) {
              completedLessons++;
            }
          });
        });
      });
    });
    
    return totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  }

  // Calculate track progress
  calculateTrackProgress(trackId) {
    const track = this.coursesData[trackId];
    if (!track) return 0;
    
    let totalLessons = 0;
    let completedLessons = 0;
    
    track.levels.forEach((level, levelIndex) => {
      level.modules.forEach((module, moduleIndex) => {
        totalLessons += module.lessons.length;
        module.lessons.forEach((_, lessonIndex) => {
          if (this.isLessonCompleted(trackId, levelIndex, moduleIndex, lessonIndex)) {
            completedLessons++;
          }
        });
      });
    });
    
    return totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  }

  // Calculate level progress
  calculateLevelProgress(trackId, levelIndex) {
    const level = this.coursesData[trackId].levels[levelIndex];
    if (!level) return 0;
    
    let totalLessons = 0;
    let completedLessons = 0;
    
    level.modules.forEach((module, moduleIndex) => {
      totalLessons += module.lessons.length;
      module.lessons.forEach((_, lessonIndex) => {
        if (this.isLessonCompleted(trackId, levelIndex, moduleIndex, lessonIndex)) {
          completedLessons++;
        }
      });
    });
    
    return totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  }

  // Calculate module progress
  calculateModuleProgress(trackId, levelIndex, moduleIndex) {
    const module = this.coursesData[trackId].levels[levelIndex].modules[moduleIndex];
    if (!module) return 0;
    
    let totalLessons = module.lessons.length;
    let completedLessons = 0;
    
    module.lessons.forEach((_, lessonIndex) => {
      if (this.isLessonCompleted(trackId, levelIndex, moduleIndex, lessonIndex)) {
        completedLessons++;
      }
    });
    
    return totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  }

  // Check if track is unlocked
  isTrackUnlocked(trackId) {
    // First track is always unlocked
    if (Object.keys(this.coursesData)[0] === trackId) return true;
    
    // Check if explicitly unlocked in progress
    if (this.userProgress[trackId]?.unlocked) {
      return true;
    }
    
    // Check if previous track is completed
    const trackIds = Object.keys(this.coursesData);
    const currentIndex = trackIds.indexOf(trackId);
    if (currentIndex > 0) {
      const prevTrackId = trackIds[currentIndex - 1];
      return this.isTrackCompleted(prevTrackId);
    }
    
    return false;
  }

  // Check if track is completed
  isTrackCompleted(trackId) {
    const track = this.coursesData[trackId];
    if (!track) return false;
    
    // Check if all levels are completed
    return track.levels.every((level, levelIndex) => {
      // All modules completed and exam passed if exists
      const allModulesCompleted = level.modules.every((_, moduleIndex) => 
        this.isModuleCompleted(trackId, levelIndex, moduleIndex)
      );
      
      if (level.exam) {
        return allModulesCompleted && this.isExamCompleted(trackId, levelIndex) && 
               this.getExamScore(trackId, levelIndex) >= level.exam.passingScore;
      }
      
      return allModulesCompleted;
    });
  }

  // Check if level is unlocked
  isLevelUnlocked(trackId, levelIndex) {
    // First level is always unlocked if track is unlocked
    if (levelIndex === 0) return this.isTrackUnlocked(trackId);
    
    // Check if explicitly unlocked in progress
    if (this.userProgress[trackId]?.[levelIndex]?.unlocked) {
      return true;
    }
    
    // Check if previous level is completed
    const prevLevelIndex = levelIndex - 1;
    const prevLevel = this.coursesData[trackId].levels[prevLevelIndex];
    
    // Check if all modules in previous level are completed
    const allModulesCompleted = prevLevel.modules.every((_, moduleIndex) => 
      this.isModuleCompleted(trackId, prevLevelIndex, moduleIndex)
    );
    
    // If previous level has exam, it must be passed
    if (prevLevel.exam) {
      return allModulesCompleted && this.isExamCompleted(trackId, prevLevelIndex) && 
             this.getExamScore(trackId, prevLevelIndex) >= prevLevel.exam.passingScore;
    }
    
    return allModulesCompleted;
  }

  // Check if module is unlocked
  isModuleUnlocked(trackId, levelIndex, moduleIndex) {
    // First module is always unlocked if level is unlocked
    if (moduleIndex === 0) return this.isLevelUnlocked(trackId, levelIndex);
    
    // Check if explicitly unlocked in progress
    if (this.userProgress[trackId]?.[levelIndex]?.[moduleIndex]?.unlocked) {
      return true;
    }
    
    // Check if previous module is completed
    return this.isModuleCompleted(trackId, levelIndex, moduleIndex - 1);
  }

  // Check if module is completed
  isModuleCompleted(trackId, levelIndex, moduleIndex) {
    const module = this.coursesData[trackId].levels[levelIndex].modules[moduleIndex];
    
    // All lessons completed and quiz passed if exists
    const allLessonsCompleted = module.lessons.every((_, lessonIndex) => 
      this.isLessonCompleted(trackId, levelIndex, moduleIndex, lessonIndex)
    );
    
    if (module.quiz) {
      return allLessonsCompleted && this.isQuizCompleted(trackId, levelIndex, moduleIndex) && 
             this.getQuizScore(trackId, levelIndex, moduleIndex) >= module.quiz.passingScore;
    }
    
    return allLessonsCompleted;
  }

  // Check if quiz is completed
  isQuizCompleted(trackId, levelIndex, moduleIndex) {
    return !!this.userProgress[trackId]?.[levelIndex]?.[moduleIndex]?.quiz?.completed;
  }

  // Get quiz score
  getQuizScore(trackId, levelIndex, moduleIndex) {
    return this.userProgress[trackId]?.[levelIndex]?.[moduleIndex]?.quiz?.score || 0;
  }

  // Check if lesson is completed
  isLessonCompleted(trackId, levelIndex, moduleIndex, lessonIndex) {
    return !!this.userProgress[trackId]?.[levelIndex]?.[moduleIndex]?.lessons?.[lessonIndex]?.completed;
  }

  // Mark lesson as complete
  markLessonComplete(trackId, levelIndex, moduleIndex, lessonIndex) {
    if (!this.userProgress[trackId]) {
      this.userProgress[trackId] = {};
    }
    if (!this.userProgress[trackId][levelIndex]) {
      this.userProgress[trackId][levelIndex] = {};
    }
    if (!this.userProgress[trackId][levelIndex][moduleIndex]) {
      this.userProgress[trackId][levelIndex][moduleIndex] = {};
    }
    if (!this.userProgress[trackId][levelIndex][moduleIndex].lessons) {
      this.userProgress[trackId][levelIndex][moduleIndex].lessons = [];
    }
    
    this.userProgress[trackId][levelIndex][moduleIndex].lessons[lessonIndex] = {
      completed: true,
      timestamp: Date.now()
    };
    
    this.saveUserProgress();
    this.updateProgressUI();
  }

  // =============================================
  // Utility Methods
  // =============================================

  // Get icon for track based on trackId
  getTrackIcon(trackId) {
    const icons = {
      'web-dev': 'fa-code',
      'data-science': 'fa-chart-line',
      'mobile-dev': 'fa-mobile-screen',
      'design': 'fa-paintbrush',
      'business': 'fa-briefcase'
    };
    return icons[trackId] || 'fa-book';
  }

  // Get icon for lesson type
  getLessonTypeIcon(type) {
    const icons = {
      'video': 'fa-video',
      'reading': 'fa-book-open',
      'interactive': 'fa-hand-pointer',
      'exercise': 'fa-pen-to-square',
      'quiz': 'fa-question-circle'
    };
    return icons[type.toLowerCase()] || 'fa-circle-info';
  }

  // Update active navigation item
  updateActiveNav() {
    // Remove active class from all nav items
    this.sideNav.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });
    
    // Add active class to current item
    if (this.currentTrack) {
      const trackItem = this.sideNav.querySelector(`.track-item[data-track="${this.currentTrack}"]`);
      if (trackItem) trackItem.classList.add('active');
    } else {
      const homeBtn = document.getElementById('home-btn');
      if (homeBtn) homeBtn.classList.add('active');
    }
  }

  // Update progress UI elements
  updateProgressUI() {
    // Update top progress bar
    const overallProgress = this.calculateOverallProgress();
    const progressFill = this.topNav.querySelector('.progress-fill');
    const progressText = this.topNav.querySelector('.progress-summary span');
    
    if (progressFill) progressFill.style.width = `${overallProgress}%`;
    if (progressText) progressText.textContent = `${overallProgress}% Complete`;
    
    // Update side navigation
    this.renderSideNav();
  }

  // Push state to history
  pushHistoryState(state, title) {
    const url = this.generateUrlFromState(state);
    window.history.pushState(state, title, url);
    document.title = title;
  }

  // Generate URL from state
  generateUrlFromState(state) {
    let url = window.location.pathname;
    
    switch (state.view) {
      case 'track':
        url += `?track=${state.trackId}`;
        break;
      case 'level':
        url += `?track=${state.trackId}&level=${state.levelId}`;
        break;
      case 'module':
        url += `?track=${state.trackId}&level=${state.levelId}&module=${state.moduleId}`;
        break;
      case 'lesson':
        url += `?track=${state.trackId}&level=${state.levelId}&module=${state.moduleId}&lesson=${state.lessonId}`;
        break;
      case 'quiz':
        url += `?track=${state.trackId}&level=${state.levelId}&module=${state.moduleId}&view=quiz`;
        break;
      case 'exam':
        url += `?track=${state.trackId}&level=${state.levelId}&view=exam`;
        break;
    }
    
    return url;
  }

  // Load user progress from localStorage
  loadUserProgress() {
    try {
      const progress = localStorage.getItem('learnhub-user-progress');
      return progress ? JSON.parse(progress) : {};
    } catch (e) {
      console.error('Failed to load user progress:', e);
      return {};
    }
  }

  // Save user progress to localStorage
  saveUserProgress() {
    try {
      localStorage.setItem('learnhub-user-progress', JSON.stringify(this.userProgress));
    } catch (e) {
      console.error('Failed to save user progress:', e);
    }
  }

  // Render error message
  renderError(message) {
    this.mainContent.innerHTML = `
      <div class="error-message">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <h2>Something went wrong</h2>
        <p>${message}</p>
        <button id="retry-btn">Try Again</button>
      </div>
    `;
    
    document.getElementById('retry-btn').addEventListener('click', () => {
      this.init();
    });
  }
}