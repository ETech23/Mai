// Main application class
class LearningApp {
  constructor() {
    this.coursesData = null;
    this.currentTrack = null;
    this.currentLevel = null;
    this.currentModule = null;
    this.currentLesson = null;
    this.userProgress = this.loadUserProgress();
    this.currentExam = null;
    this.currentExamResults = null;
  /**  this.mainContent = document.getElementById('main-content') || document.body;**/
    
    
    // DOM elements
    this.appContainer = document.querySelector('.app-container');
this.mainContent = document.querySelector('.main-content'); // Changed from #main-content
this.sideNav = document.querySelector('.side-nav'); // Changed from #side-nav
this.topNav = document.createElement('nav'); // We'll add this dynamically
this.topNav.id = 'top-nav';
document.body.prepend(this.topNav);
    document.getElementById('sidebar-toggle');
    this.themeToggleBtn = document.getElementById('theme-toggle-btn');
    this.sidebarToggle = document.getElementById('sidebar-toggle');
        
    // Verify all critical elements exist
    if (!this.mainContent || !this.sideNav || !this.topNav || !this.sidebarToggle || 
        !this.themeToggleBtn) {
      console.error('Missing required DOM elements');
      this.showCriticalError();
      return;
    }
    
        // Initialize default settings
    this.settings = {
      defaultPassingScore: 75,
      examQuestionCount: 20
    };
    
  
  }
      addEventListeners() {
  // First verify all required elements exist
  const elements = {
    sidebarToggle: document.getElementById('sidebar-toggle'),
    themeToggleBtn: document.getElementById('theme-toggle-btn'),
    retryBtn: document.getElementById('retry-btn'),
    trackButtons: document.querySelectorAll('.track-btn'),
    moduleButtons: document.querySelectorAll('.module-btn'),
    lessonButtons: document.querySelectorAll('.lesson-btn')
  };

  // Safe event listener attachment
  elements.sidebarToggle?.addEventListener('click', this.toggleSidebar.bind(this));
  
  elements.retryBtn?.addEventListener('click', () => location.reload());

  // Dynamic content listeners
  elements.trackButtons.forEach(btn => {
    btn?.addEventListener('click', (e) => {
      const trackId = e.currentTarget.dataset.track;
      this.loadTrack(trackId);
    });
  });

  // Add similar for modules and lessons
  elements.moduleButtons.forEach(btn => {
    btn?.addEventListener('click', (e) => {
      const levelIndex = parseInt(e.currentTarget.dataset.level);
      const moduleIndex = parseInt(e.currentTarget.dataset.module);
      this.loadModule(this.currentTrack, levelIndex, moduleIndex);
    });
  });

  elements.lessonButtons.forEach(btn => {
    btn?.addEventListener('click', (e) => {
      const lessonIndex = parseInt(e.currentTarget.dataset.lesson);
      this.loadLesson(this.currentTrack, this.currentLevel, this.currentModule, lessonIndex);
    });
  });
}
     /** addEventListeners() {
  try {
    // 1. Verify elements exist before adding listeners
    const elements = {
      sidebarToggle: document.getElementById('sidebar-toggle'),
      themeToggleBtn: document.getElementById('theme-toggle-btn'),
      retryBtn: document.getElementById('retry-btn'),
      backButtons: document.querySelectorAll('.back-button'),
      trackButtons: document.querySelectorAll('.track-btn'),
      moduleButtons: document.querySelectorAll('.module-btn'),
      lessonButtons: document.querySelectorAll('.lesson-btn')
    };

    // 2. Add event listeners with null checks
    if (elements.sidebarToggle) {
      elements.sidebarToggle.addEventListener('click', this.toggleSidebar.bind(this));
    }

    if (elements.themeToggleBtn) {
      elements.themeToggleBtn.addEventListener('click', this.toggleTheme.bind(this));
    }

    if (elements.retryBtn) {
      elements.retryBtn.addEventListener('click', () => location.reload());
    }

    // 3. Dynamic content listeners (added when content loads)
    elements.backButtons.forEach(btn => {
      btn?.addEventListener('click', this.handleBackButton.bind(this));
    });

    elements.trackButtons.forEach(btn => {
      btn?.addEventListener('click', (e) => {
        const trackId = e.currentTarget.dataset.track;
        this.loadTrack(trackId);
      });
    });

    elements.moduleButtons.forEach(btn => {
      btn?.addEventListener('click', (e) => {
        const levelIndex = parseInt(e.currentTarget.dataset.level);
        const moduleIndex = parseInt(e.currentTarget.dataset.module);
        this.loadModule(this.currentTrack, levelIndex, moduleIndex);
      });
    });

    elements.lessonButtons.forEach(btn => {
      btn?.addEventListener('click', (e) => {
        const lessonIndex = parseInt(e.currentTarget.dataset.lesson);
        this.loadLesson(this.currentTrack, this.currentLevel, this.currentModule, lessonIndex);
      });
    });

  } catch (error) {
    console.error('Event listener error:', error);
    this.renderError('Interface interaction failed');
  }
}**/

  showCriticalError() {
    document.body.innerHTML = `
      <div style="padding:20px;color:red;">
        <h2>Application Error</h2>
        <p>Required elements missing. Please refresh.</p>
        <button onclick="location.reload()">Reload</button>
      </div>
    `;
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
    // 1. Verify DOM elements exist first
    this.mainContent = document.getElementById('main-content');
    this.sideNav = document.getElementById('side-nav');
    this.topNav = document.getElementById('top-nav');
    
    if (!this.mainContent || !this.sideNav || !this.topNav) {
      throw new Error('Required DOM elements missing');
    }

    // 2. Load course data
    const response = await fetch('./data.json');
    if (!response.ok) throw new Error('Failed to fetch course data');
    this.coursesData = await response.json();
    
    // 3. Initialize UI
    this.initUI();
    
    // 4. Set default view
        this.renderCourseData();
    this.renderTracksOverview();
    
    // 5. Add event listeners after content is rendered
    this.addEventListeners();
    
    // 6. Handle any deep linking
    this.handleDeepLinking();
    
  } catch (error) {
    console.error('Initialization error:', error);
    this.renderError(error.message || 'Failed to initialize application');
    
    // Fallback to sample data if needed
    if (!this.coursesData) {
      this.coursesData = {
  "ai-crypto-track": {
    "title": "Artificial Intelligence and Cryptocurrency Mastery",
    "description": "Explore the intersection of AI and blockchain technology, from fundamentals to advanced applications.",
    "levels": [
      {
        "name": "Level 1",
        "modules": [
          {
            "title": "Foundations of AI and Crypto",
            "description": "Understand the fundamental concepts that connect AI and cryptocurrency.",
            "lessons": [
              {
                "title": "Understanding the Intersection of AI and Cryptocurrency",
                "type": "reading",
                "duration": "15 min",
                "content": [
                  "Artificial Intelligence (AI) and Cryptocurrency are two revolutionary technologies reshaping the digital landscape. When combined, they offer powerful tools for automation, optimization, and innovation across industries.",
                  "",
                  "What is AI?",
                  "Artificial Intelligence refers to the ability of machines to mimic human intelligence—learning from data, recognizing patterns, making decisions, and improving over time without being explicitly programmed.",
                  "",
                  "What is Cryptocurrency?",
                  "Cryptocurrency is a form of digital or virtual currency that relies on cryptographic techniques to secure transactions. It operates on blockchain technology—a decentralized ledger maintained by a network of computers (nodes).",
                  "",
                  "How AI and Crypto Converge",
                  "1. Smart Contract Optimization: AI can analyze historical transaction data to identify optimal ways of structuring smart contracts, reducing gas fees, and improving execution efficiency.",
                  "2. Fraud Detection: AI algorithms can detect fraudulent activities and anomalies in blockchain networks by learning from past behaviors and flagging suspicious patterns.",
                  "3. Predictive Trading Bots: AI powers bots that analyze market sentiment, price trends, and historical data to execute automated trades with high precision and speed.",
                  "4. Data Analysis in DeFi: Decentralized Finance (DeFi) generates massive amounts of transactional data. AI helps filter through this data to uncover insights, predict risks, and suggest investment strategies.",
                  "",
                  "Challenges at the Intersection",
                  "Transparency: Blockchain values transparency, while AI models—especially deep learning—can be black boxes.",
                  "Scalability: AI computations require high processing power, which may strain decentralized networks.",
                  "Security: While AI can strengthen security, if misused, it can also create new attack vectors.",
                  "",
                  "Future Possibilities",
                  "As both AI and blockchain technologies mature, we expect to see more sophisticated integrations, such as AI-governed DAOs (Decentralized Autonomous Organizations), personalized DeFi lending, and on-chain machine learning marketplaces.",
                  "",
                  "Conclusion",
                  "The intersection of AI and cryptocurrency represents a frontier of innovation. Mastering both domains equips learners and developers to build secure, intelligent, and decentralized solutions for tomorrow’s digital economy."
                ]
              }
            ]
          }
        ]
      }
    ]
  }
} 
      ;
      this.renderTracksOverview();
          this.renderCourseData();
    }
  }
}
      
      /**
 * Renders course data in an attractive, responsive HTML layout
 * @param {Object} coursesData - The course data structure
 * @param {HTMLElement} container - Where to render the content (default: this.mainContent)
 */
renderCourseData(coursesData = this.coursesData, container = this.mainContent) {
  try {
    container.innerHTML = `
      <div class="course-container">
        <header class="course-header">
          <h1>Learning Tracks</h1>
          <p class="subtitle">Select a track to begin your learning journey</p>
        </header>
        
        <div class="tracks-grid">
          ${Object.entries(coursesData).map(([trackId, track]) => `
            <article class="track-card" data-track="${trackId}">
              <div class="track-header">
                <h2>${track.title}</h2>
                <p class="track-description">${track.description}</p>
                <div class="track-progress">
                  <progress value="${this.getTrackProgress(trackId)}" max="100"></progress>
                  <span>${this.getTrackProgress(trackId)}% Complete</span>
                </div>
              </div>
              
              <div class="levels-container">
                ${track.levels.map((level, levelIndex) => `
                  <div class="level-card">
                    <h3 class="level-title">
                      <i class="fas fa-layer-group"></i>
                      ${level.name}
                    </h3>
                    
                    <div class="modules-grid">
                      ${level.modules.map((module, moduleIndex) => `
                        <div class="module-card" 
                             data-track="${trackId}"
                             data-level="${levelIndex}"
                             data-module="${moduleIndex}">
                          <div class="module-header">
                            <h4>${module.title}</h4>
                            <p class="module-description">${module.description}</p>
                          </div>
                          
                          <div class="module-stats">
                            <span class="stat-item">
                              <i class="fas fa-book"></i>
                              ${module.lessons.length} Lessons
                            </span>
                            <span class="stat-item">
                              <i class="fas fa-question-circle"></i>
                              ${module.quiz?.questions?.length || 0} Quiz Questions
                            </span>
                          </div>
                          
                          <div class="module-actions">
                            <button class="btn-start">
                              ${this.isModuleCompleted(trackId, levelIndex, moduleIndex) ? 
                                'Review' : 'Start'}
                            </button>
                          </div>
                        </div>
                      `).join('')}
                    </div>
                    
                    ${level.exam ? `
                      <div class="exam-card">
                        <div class="exam-header">
                          <h4><i class="fas fa-graduation-cap"></i> ${level.exam.title}</h4>
                          <p>${level.exam.description}</p>
                          <p class="exam-passing">Passing Score: ${level.exam.passingScore}%</p>
                        </div>
                        <button class="btn-exam" 
                                data-track="${trackId}"
                                data-level="${levelIndex}">
                          ${this.isExamCompleted(trackId, levelIndex) ? 
                            'Review Exam' : 'Take Exam'}
                        </button>
                      </div>
                    ` : ''}
                  </div>
                `).join('')}
              </div>
            </article>
          `).join('')}
        </div>
      </div>
    `;

    this.injectCourseStyles();
    this.setupCourseEventListeners();
    
  } catch (error) {
    console.error('Course rendering error:', error);
    container.innerHTML = `
      <div class="error-message">
        <h2>Display Error</h2>
        <p>${error.message}</p>
      </div>
    `;
  }
}

// Helper methods
injectCourseStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .course-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem 1rem;
      font-family: 'Segoe UI', Roboto, sans-serif;
    }
    
    .course-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    
    .course-header h1 {
      font-size: 2.2rem;
      color: #2c3e50;
    }
    
    .subtitle {
      color: #7f8c8d;
      font-size: 1.1rem;
    }
    
    .tracks-grid {
      display: grid;
      gap: 2rem;
    }
    
    .track-card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    
    .track-header {
      padding: 1.5rem;
      background: linear-gradient(135deg, #3498db, #2c3e50);
      color: white;
    }
    
    .track-header h2 {
      margin: 0 0 0.5rem;
      font-size: 1.5rem;
    }
    
    .track-progress {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 1rem;
    }
    
    .track-progress progress {
      flex-grow: 1;
      height: 6px;
      border-radius: 3px;
    }
    
    .track-progress span {
      font-size: 0.9rem;
    }
    
    .levels-container {
      padding: 1rem;
    }
    
    .level-card {
      margin-bottom: 2rem;
    }
    
    .level-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #2c3e50;
      font-size: 1.2rem;
      margin: 1rem 0;
    }
    
    .modules-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    
    .module-card {
      background: #f8f9fa;
      border-radius: 6px;
      padding: 1rem;
      border-left: 4px solid #3498db;
      transition: transform 0.2s;
    }
    
    .module-card:hover {
      transform: translateY(-3px);
    }
    
    .module-header h4 {
      margin: 0 0 0.3rem;
      color: #2c3e50;
    }
    
    .module-description {
      color: #666;
      font-size: 0.9rem;
      margin: 0.3rem 0 0.8rem;
    }
    
    .module-stats {
      display: flex;
      gap: 1rem;
      font-size: 0.8rem;
      color: #7f8c8d;
      margin: 0.8rem 0;
    }
    
    .module-stats i {
      margin-right: 0.3rem;
    }
    
    .module-actions {
      margin-top: 0.5rem;
    }
    
    .btn-start {
      background: #3498db;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9rem;
    }
    
    .exam-card {
      background: #f0f7ff;
      border-radius: 6px;
      padding: 1rem;
      margin-top: 1rem;
      border-left: 4px solid #e74c3c;
    }
    
    .exam-header h4 {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0 0 0.3rem;
      color: #2c3e50;
    }
    
    .exam-passing {
      font-size: 0.9rem;
      color: #e74c3c;
      font-weight: bold;
      margin: 0.5rem 0;
    }
    
    .btn-exam {
      background: #e74c3c;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9rem;
    }
    
    @media (max-width: 768px) {
      .modules-grid {
        grid-template-columns: 1fr;
      }
    }
  `;
  document.head.appendChild(style);
}

getTrackProgress(trackId) {
  // Implement your actual progress calculation
  const track = this.coursesData[trackId];
  if (!track) return 0;
  
  let totalModules = 0;
  let completedModules = 0;
  
  track.levels.forEach((level, levelIndex) => {
    level.modules.forEach((_, moduleIndex) => {
      totalModules++;
      if (this.isModuleCompleted(trackId, levelIndex, moduleIndex)) {
        completedModules++;
      }
    });
  });
  
  return totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
}

setupCourseEventListeners() {
  // Module start buttons
  document.querySelectorAll('.btn-start').forEach(btn => {
    btn.addEventListener('click', () => {
      const trackId = btn.closest('.module-card').dataset.track;
      const levelIndex = parseInt(btn.closest('.module-card').dataset.level);
      const moduleIndex = parseInt(btn.closest('.module-card').dataset.module);
      this.loadModule(trackId, levelIndex, moduleIndex);
    });
  });
  
  // Exam buttons
  document.querySelectorAll('.btn-exam').forEach(btn => {
    btn.addEventListener('click', () => {
      const trackId = btn.dataset.track;
      const levelIndex = parseInt(btn.dataset.level);
      this.loadExam(trackId, levelIndex);
    });
  });
}
      
  isQuizUnlocked(trackId, levelIndex, moduleIndex) {
    // 1. Verify we have valid course data
    if (!this.coursesData?.[trackId]?.levels?.[levelIndex]?.modules?.[moduleIndex]) {
      return false;
    }

    // 2. Check if quiz exists for this module
    const module = this.coursesData[trackId].levels[levelIndex].modules[moduleIndex];
    if (!module.quiz) return false;

    // 3. Check if all lessons are completed
    const allLessonsCompleted = module.lessons.every((_, lessonIndex) => 
      this.isLessonCompleted(trackId, levelIndex, moduleIndex, lessonIndex)
    );

    return allLessonsCompleted;
  }

  isLessonCompleted(trackId, levelIndex, moduleIndex, lessonIndex) {
    return !!this.userProgress?.[trackId]?.[levelIndex]?.[moduleIndex]?.lessons?.[lessonIndex];
  }
      

  selectRandomQuestions(questions, count) {
    // Make a copy of the array to avoid modifying the original
    const shuffled = [...questions];
    
    // Fisher-Yates shuffle algorithm
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }

  

  // Initialize UI components
  initUI() {
    // Create top navigation
    this.topNav.innerHTML = `
      <div class="logo">
        <img src="logo.svg" alt="Learning App Logo">
        <h1>Maichain Learning Hub</h1>
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
      <div style="padding: 0 15px;" class="nav-header">
        <button style="padding: 2px; margin: 5px;" id="home-btn" class="nav-item active">
          <i class="fa-solid fa-house"></i>
          <span>Home</span>
        </button>
      </div>
      <div style="padding: 0 15px;"  class="nav-tracks">
    `;
    
    // Add tracks to navigation
    Object.keys(this.coursesData).forEach(trackId => {
      const track = this.coursesData[trackId];
      const isUnlocked = this.isTrackUnlocked(trackId);
      navContent += `
        <button style="padding: 2px; margin: 5px;" class="nav-item track-item ${isUnlocked ? 'unlocked' : 'locked'}" 
                data-track="${trackId}" ${!isUnlocked ? 'disabled' : ''}>
          <i class="fa-solid ${this.getTrackIcon(trackId)}"></i>
          <span>${track.title}</span>
          ${!isUnlocked ? '<i class="fa-solid fa-lock lock-icon"></i>' : ''}
        </button>
      `;
    });
    
    navContent += `
      </div>
      <div style="padding: 0 15px;"  class="nav-footer">
        <button id="settings-btn" class="nav-item" style="padding: 2px; margin: 5px;">
          <i class="fa-solid fa-gear"></i>
          <span>Settings</span>
6        </button>
        <button style="padding: 2px; margin: 5px;" id="help-btn" class="nav-item">
          <i class="fa-solid fa-circle-question"></i>
          <span>Help</span>
        </button>
      </div>
    `;
        
        navContent += `
  <div style="padding: 0 15px;">
    <button style="padding: 2px; margin: 5px;" id="theme-toggle-btn" class="nav-item active">
      <i class="fas fa-moon"></i> <!-- Default: moon (light theme) -->
      <span>Theme</span>
    </button>
  </div>`;
    
    this.sideNav.innerHTML = navContent;
        
        /**
 * Theme Toggler - Plain Function Version
 * Handles dark/light mode toggling with animations and localStorage
 */

// Theme toggle function (works immediately on click)
function toggleTheme() {
  const body = document.body;
  const btn = document.getElementById('theme-toggle-btn');
  const icon = btn?.querySelector('i');
  
  // Check current theme
  const isDark = body.classList.contains('dark-theme');
  
  // Apply smooth transitions
  body.style.transition = 'background-color 0.5s ease, color 0.3s ease';
  if (btn) btn.style.transition = 'transform 0.2s ease';
  
  // Toggle theme classes
  body.classList.toggle('dark-theme', !isDark);
  body.classList.toggle('light-theme', isDark);
  
  // Update icon instantly (no delay needed)
  if (icon) {
    icon.className = isDark ? 'fas fa-moon' : 'fas fa-sun';
  }
  
  // Save to localStorage
  localStorage.setItem('theme', isDark ? 'light' : 'dark');
  
  // Button "press" animation
  if (btn) {
    btn.style.transform = 'scale(0.95)';
    setTimeout(() => { btn.style.transform = 'scale(1)'; }, 200);
  }
}

// Initialize theme on page load
document.addEventListener('DOMContentLoaded', function() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  const body = document.body;
  
  // Apply saved theme
  body.classList.add(savedTheme + '-theme');
  
  // Set correct icon if button exists
  const icon = document.getElementById('theme-toggle-btn')?.querySelector('i');
  if (icon) {
    icon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
  }
});

// Event listener (works for dynamically added buttons)
document.addEventListener('click', function(e) {
  if (e.target?.closest('#theme-toggle-btn')) {
    toggleTheme();
  }
});

    
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
          this.renderCourseData();
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
        this.renderCourseData();
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
this.renderCourseData();
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
this.renderCourseData();
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
        
        this.addEventListeners();
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
          this.renderCourseData();
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
    
    this.loadUserProgress();
    this.saveUserProgress();
    this.updateProgressUI();
    
    // Update progress in UI
    this.updateProgressUI();
  }

  // Reset quiz progress
  resetQuizProgress(trackId, levelIndex, moduleIndex) {
    if (this.userProgress[trackId]?.[levelIndex]?.[moduleIndex]?.quiz) {
      delete this.userProgress[trackId][levelIndex][moduleIndex].quiz;
      this.loadUserProgress();
      this.updateProgressUI();
      this.saveUserProgress();
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
    
    this.loadUserProgress();
    this.updateProgressUI();
    this.saveUserProgress();
  }
  

    
  

  // ======================
  // Core Exam Functions
  // ======================

  loadExam(trackId, levelIndex) {
    try {
      if (!this.validateTrackAndLevel(trackId, levelIndex)) {
        throw new Error(`Invalid track or level: ${trackId}-${levelIndex}`);
      }

      if (!this.isExamUnlocked(trackId, levelIndex)) {
        throw new Error('Exam is not unlocked yet');
      }

      if (this.isExamPassed(trackId, levelIndex)) {
        this.showMessage('You have already passed this exam');
        return;
      }

      const level = this.coursesData[trackId].levels[levelIndex];
      const examQuestions = this.prepareExamQuestions(level);
      
      if (examQuestions.length === 0) {
        throw new Error('No questions available for this exam');
      }

      this.currentExam = {
        trackId,
        levelIndex,
        questions: this.selectRandomQuestions(examQuestions, this.settings.examQuestionCount),
        passingScore: level.passingScore || this.settings.defaultPassingScore,
        timeStarted: Date.now()
      };
      
      this.renderExam();
      
    } catch (error) {
      console.error('Failed to load exam:', error);
      this.showMessage('Exam is not yet unlocked. Complete all modules in the track and try again.');
    }
  }

  submitExam() {
    try {
      if (!this.currentExam) {
        throw new Error('No active exam to submit');
      }

      const { score, moduleStats, incorrectAnswers } = this.calculateExamScore();
      
      this.currentExamResults = {
        trackId: this.currentExam.trackId,
        levelIndex: this.currentExam.levelIndex,
        score,
        moduleStats,
        incorrectAnswers,
        timestamp: Date.now()
      };

      this.displayExamResults();
      this.saveExamResults();
      this.unlockNextContent();
      
      this.currentExam = null;
      
    } catch (error) {
      console.error('Exam submission failed:', error);
      this.showError('Failed to submit exam. Please try again.');
    }
  }

  // ======================
  // Results Display
  // ======================

  displayExamResults() {
  if (!this.currentExamResults || !this.currentExam) return;

  const passed = this.currentExamResults.score >= this.currentExam.passingScore;

  if (passed) {
    this.launchConfetti();
    this.awardBadgeIfNotAlreadyGiven();
  }

  this.mainContent.innerHTML = `
    <div class="exam-results ${passed ? 'passed' : 'failed'}">
      <h2>Exam Results</h2>
      ${this.generateResultsSummary(passed)}
      ${this.generateModuleStats()}
      ${!passed ? this.generateIncorrectAnswers() : ''}
      <div class="exam-actions">
        <button id="exam-retry" class="${passed ? 'continue' : 'retry'}">
          ${passed ? 'Continue Learning' : 'Retry Exam'}
        </button>
        ${!passed ? '<button id="exam-review" class="review-btn">Review Answers</button>' : ''}
      </div>
    </div>
  `;
  this.setupResultsHandlers(passed);
}

  generateResultsSummary(passed) {
    return `
      <div class="summary">
        <p>Your score: <strong>${this.currentExamResults.score}%</strong></p>
        <p>Passing score: ${this.currentExam.passingScore}%</p>
        <p class="status">Status: ${passed ? '✅ PASSED' : '❌ FAILED'}</p>
      </div>
    `;
  }

  generateModuleStats() {
    if (!this.currentExamResults.moduleStats) return '';
    
    return `
      <div class="module-performance">
        <h3>Performance by Module</h3>
        <ul>
          ${Object.entries(this.currentExamResults.moduleStats).map(([module, stats]) => `
            <li>
              <span class="module-name">${module}</span>
              <span class="module-score">
                ${Math.round((stats.correct / stats.total) * 100)}%
                (${stats.correct}/${stats.total})
              </span>
              <progress value="${stats.correct}" max="${stats.total}"></progress>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  }

  generateIncorrectAnswers() {
    if (!this.currentExamResults.incorrectAnswers?.length) return '';
    
    return `
      <div class="incorrect-answers">
        <h3>Questions to Review</h3>
        ${this.currentExamResults.incorrectAnswers.map((item, i) => `
          <div class="incorrect-answer">
            <p><strong>Question:</strong> ${item.question}</p>
            <p><strong>Your answer:</strong> <span class="wrong">${item.selectedOption}</span></p>
            <p><strong>Correct answer:</strong> <span class="correct">${item.correctOption}</span></p>
            ${item.explanation ? `<p class="explanation">${item.explanation}</p>` : ''}
            ${item.sourceModule ? `<p class="source">From module: ${item.sourceModule}</p>` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }
  
  launchConfetti() {
  const duration = 2 * 1000;
  const end = Date.now() + duration;

  (function frame() {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 55,
      origin: { x: 0 }
    });
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 55,
      origin: { x: 1 }
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
}

awardBadgeIfNotAlreadyGiven() {
  const { trackId, levelIndex } = this.currentExamResults;
  const username = this.getCurrentUsername(); // Define this method to return logged-in user
  const badgeId = `${trackId}-level${levelIndex}`;
  const badges = this.userBadges || JSON.parse(localStorage.getItem("learnhub-user-badges") || "[]");

  const alreadyAwarded = badges.some(b => b.id === badgeId && b.issuedTo === username);
  if (!alreadyAwarded) {
    const badge = this.generateBadge(badgeId, trackId, username);
    badges.push(badge);
    this.userBadges = badges;
    localStorage.setItem("learnhub-user-badges", JSON.stringify(badges));
    this.showBadgeModal(badge);
  }
}

generateBadge(id, trackId, username) {
  const trackName = this.coursesData[trackId].title || trackId;
  return {
    id,
    issuedTo: username,
    title: `Level Completed - ${trackName}`,
    trackId,
    dateIssued: new Date().toLocaleDateString(),
    platform: "MAICHAIN",
    design: `badge-${trackId}` // Used for different styles
  };
}

showBadgeModal(badge) {
  const modal = document.getElementById("badgeModal");
  const content = document.getElementById("badgeContent");

  content.innerHTML = `
    <div class="badge-preview ${badge.design}">
      <h3>${badge.title}</h3>
      <p>Issued to: <strong>${badge.issuedTo}</strong></p>
      <p>Date: ${badge.dateIssued}</p>
      <p>Platform: ${badge.platform}</p>
    </div>
  `;

  modal.classList.remove("hidden");
  modal.style.display = "block";

  const closeBtn = document.querySelector(".close-badge-modal");
  closeBtn.onclick = () => {
    modal.classList.add("hidden");
    modal.style.display = "none";
  };

  window.onclick = (event) => {
    if (event.target === modal) {
      modal.classList.add("hidden");
      modal.style.display = "none";
    }
  };
}

getCurrentUsername() {
  // Replace with your actual logic
  return localStorage.getItem("learnhub-username") || "Anonymous";
}

  // ======================
  // Helper Methods
  // ======================

  validateTrackAndLevel(trackId, levelIndex) {
    return this.coursesData[trackId]?.levels?.[levelIndex] !== undefined;
  }

  prepareExamQuestions(level) {
    return level.modules.flatMap(module => {
      return module.quiz?.questions?.map(q => ({
        ...q,
        sourceModule: module.title,
        moduleId: module.id
      })) || [];
    });
  }

  selectRandomQuestions(questions, count) {
    const shuffled = [...questions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }

  calculateExamScore() {
    if (!this.currentExam) throw new Error('No active exam');

    const moduleStats = {};
    const incorrectAnswers = [];
    let correctCount = 0;

    this.currentExam.questions.forEach((q, i) => {
      const selected = document.querySelector(`input[name="q${i}"]:checked`);
      const isCorrect = selected && parseInt(selected.value) === q.answer;
      
      if (isCorrect) {
        correctCount++;
      } else {
        incorrectAnswers.push({
          question: q.text,
          selectedOption: selected?.value !== undefined ? q.options[selected.value] : "None",
          correctOption: q.options[q.answer],
          explanation: q.explanation || "No explanation provided",
          sourceModule: q.sourceModule,
          moduleId: q.moduleId
        });
      }

      if (q.sourceModule) {
        moduleStats[q.sourceModule] = moduleStats[q.sourceModule] || { correct: 0, total: 0 };
        moduleStats[q.sourceModule].total++;
        if (isCorrect) moduleStats[q.sourceModule].correct++;
      }
    });

    return {
      score: Math.round((correctCount / this.currentExam.questions.length) * 100),
      moduleStats,
      incorrectAnswers
    };
  }

  // ======================
  // Progress Management
  // ======================

  isExamUnlocked(trackId, levelIndex) {
    if (!this.validateTrackAndLevel(trackId, levelIndex)) return false;
    const level = this.coursesData[trackId].levels[levelIndex];
    if (!level.exam) return false;
    if (this.userProgress[trackId]?.[levelIndex]?.exam?.unlocked) return true;
    return level.modules.every((_, idx) => this.isModuleCompleted(trackId, levelIndex, idx));
  }

  isExamCompleted(trackId, levelIndex) {
    return !!this.userProgress[trackId]?.[levelIndex]?.exam?.completed;
  }

  isExamPassed(trackId, levelIndex) {
    const examProgress = this.userProgress[trackId]?.[levelIndex]?.exam;
    if (!examProgress) return false;
    const passingScore = this.coursesData[trackId]?.levels[levelIndex]?.passingScore || 
                       this.settings.defaultPassingScore;
    return examProgress.score >= passingScore;
  }
  
/**
 * Gets the exam score for a specific track and level
 * @param {string} trackId - The ID of the track
 * @param {number} levelIndex - The index of the level
 * @returns {number} The exam score (0-100) or 0 if no score exists
 */
getExamScore(trackId, levelIndex) {
  // Safely access the nested progress data with optional chaining
  return this.userProgress[trackId]?.[levelIndex]?.exam?.score || 0;
}

  saveExamResults() {
    if (!this.currentExamResults) return;

    const { trackId, levelIndex, score, moduleStats } = this.currentExamResults;
    
    if (!this.userProgress[trackId]) this.userProgress[trackId] = {};
    if (!this.userProgress[trackId][levelIndex]) this.userProgress[trackId][levelIndex] = {};
    
    this.userProgress[trackId][levelIndex].exam = {
      completed: true,
      passed: score >= this.currentExam.passingScore,
      score,
      moduleStats,
      timestamp: Date.now()
    };
    
    this.loadUserProgress();
    this.saveUserProgress();
    this.updateProgressUI();
  }

  unlockNextContent() {
    if (!this.currentExamResults) return;
    const { trackId, levelIndex, score } = this.currentExamResults;
    const passingScore = this.currentExam.passingScore;
    
    if (score < passingScore) return;

    const track = this.coursesData[trackId];
    if (levelIndex < track.levels.length - 1) {
      if (!this.userProgress[trackId][levelIndex + 1]) {
        this.userProgress[trackId][levelIndex + 1] = { unlocked: true };
        this.loadUserProgress();
        this.saveUserProgress();
        this.updateProgressUI();
      }
    }
  }

  // ======================
  // UI Methods
  // ======================

  renderExam() {
    if (!this.currentExam) return;

    this.mainContent.innerHTML = `
      <div class="exam-container">
        <div class="exam-header">
          <h2>Level Exam</h2>
          <div class="exam-progress">
            <span id="answered-count">0</span> / ${this.currentExam.questions.length} answered
          </div>
        </div>
        
        <form id="exam-form">
          ${this.currentExam.questions.map((q, i) => `
            <div class="exam-question">
              <div class="question-text">
                <span class="question-number">${i + 1}.</span>
                ${q.text}
              </div>
              <div class="question-options">
                ${q.options.map((opt, optIdx) => `
                  <div class="exam-option">
                    <input type="radio" id="q${i}-opt${optIdx}" name="q${i}" value="${optIdx}">
                    <label for="q${i}-opt${optIdx}">${opt}</label>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </form>
        
        <div class="exam-footer">
          <button id="submit-exam" class="primary-btn">Submit Exam</button>
        </div>
      </div>
    `;

    document.getElementById('submit-exam').addEventListener('click', () => {
      this.submitExam();
    });

    document.getElementById('exam-form').addEventListener('change', () => {
      const answered = document.querySelectorAll('#exam-form input[type="radio"]:checked').length;
      document.getElementById('answered-count').textContent = answered;
    });
  }

  setupResultsHandlers(passed) {
    document.getElementById('exam-retry')?.addEventListener('click', () => {
      if (passed) {
        this.loadTrack(this.currentExamResults.trackId);
      } else {
        this.loadExam(this.currentExamResults.trackId, this.currentExamResults.levelIndex);
      }
    });

    document.getElementById('exam-review')?.addEventListener('click', () => {
      this.showAnswerReview(this.currentExamResults.incorrectAnswers);
    });
  }

  showAnswerReview(incorrectAnswers) {
    const modal = document.createElement('div');
    modal.className = 'answer-review-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <h3>Answer Review</h3>
        ${incorrectAnswers.map(item => `
          <div class="review-item">
            <p><strong>Question:</strong> ${item.question}</p>
            <p class="wrong"><strong>Your answer:</strong> ${item.selectedOption}</p>
            <p class="correct"><strong>Correct answer:</strong> ${item.correctOption}</p>
            ${item.explanation ? `<p class="explanation">${item.explanation}</p>` : ''}
          </div>
        `).join('')}
        <button class="close-review">Close</button>
      </div>
    `;
    
    document.body.appendChild(modal);
    modal.querySelector('.close-review').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    this.loadUserProgress();
    this.updateProgressUI();
    this.saveUserProgress();
  }

  showMessage(message) {
  const alert = document.createElement('div');
  alert.className = 'alert-message';
  alert.innerHTML = `
    <div class="alert-content">${message}</div>
  `;
  document.body.appendChild(alert);
  
  // Trigger reflow to enable animation
  void alert.offsetWidth;
  
  alert.classList.add('show');
  
  setTimeout(() => {
    alert.classList.remove('show');
    setTimeout(() => {
      if (document.body.contains(alert)) {
        document.body.removeChild(alert);
      }
    }, 300); // Match this with the CSS transition time
  }, 3000);
}

  showError(message) {
    this.mainContent.innerHTML = `
      <div class="error-message">
        <p>${message}</p>
        <button onclick="location.reload()">Try Again</button>
      </div>
    `;
  }

  

  isModuleCompleted(trackId, levelIndex, moduleIndex) {
    // Implement module completion check
    return false;
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
    
    this.loadUserProgress();
    this.updateProgressUI();
    this.saveUserProgress();
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


async loadUserProgress() {
  try {
    // Try fetching from backend first
    const response = await fetch('https://mai-vmox.onrender.com/api/user/progress', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}` // if using auth
      }
    });

    if (response.ok) {
      const data = await response.json();
      this.userProgress = data;
      return data;
    } else {
      throw new Error('Backend load failed, falling back to localStorage');
    }
  } catch (e) {
    console.warn('Falling back to localStorage:', e);
    try {
      const progress = localStorage.getItem('learnhub-user-progress');
      this.userProgress = progress ? JSON.parse(progress) : {};
      return this.userProgress;
    } catch (err) {
      console.error('Failed to load user progress from localStorage:', err);
      return {};
    }
  }
}

async saveUserProgress() {
  try {
    // Save to backend first
    const response = await fetch('https://mai-vmox.onrender.com/api/user/progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}` // if using auth
      },
      body: JSON.stringify(this.userProgress)
    });

    if (!response.ok) {
      throw new Error('Backend save failed');
    }
  } catch (e) {
    console.warn('Saving to backend failed. Saving to localStorage instead.', e);
    try {
      localStorage.setItem('learnhub-user-progress', JSON.stringify(this.userProgress));
    } catch (err) {
      console.error('Failed to save user progress to localStorage:', err);
    }
  }
}

/**  loadUserProgress() {
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
  }**/

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
