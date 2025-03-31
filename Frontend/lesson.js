class LearningPlatform {
  constructor() {
    this.state = {
      currentTheme: localStorage.getItem('theme') || 'light',
      user: {
        name: "Guest User",
        progress: JSON.parse(localStorage.getItem('userProgress')) || {
          completedCourses: [],
          inProgressCourses: ['Introduction to AI'], // Start with first module in progress
          completedLessons: {},
          quizScores: {},
          examResults: {},
          badges: [],
          certificates: [],
          timeSpent: {}
        }
      },
      courses: null,
      currentSection: 'dashboard'
    };  
    
    this.init();  // Now properly after closing the state object
  }

  async init() {
    await this.loadCourseData();
    this.setupEventListeners();
    this.applyTheme();
    
    // Initialize current section from URL or default to dashboard
    const hash = window.location.hash.substring(1);
    this.currentSection = hash && [
      'dashboard', 
      'ai-courses', 
      'crypto-courses', 
      'achievements', 
      'resources'
    ].includes(hash) ? hash : 'dashboard';
    
    this.render();
}

  async loadCourseData() {
    try {
      const response = await fetch('data.json');
      this.courses = await response.json();
    } catch (error) {
      console.error("Failed to load course data:", error);
      this.courses = this.getFallbackCourseData();
    }
  }

  getFallbackCourseData() {
    return {
      ai: {
        title: "Artificial Intelligence",
        description: "Master AI concepts from fundamentals to advanced implementations",
        levels: [
          {
            name: "Beginner Level: AI Fundamentals",
            modules: [
              {
                title: "Introduction to AI",
                description: "Learn the basics of artificial intelligence",
                lessons: [
                  {
                    title: "What is AI?",
                    type: "video",
                    duration: "10 min",
                    content: [
                      "Artificial Intelligence (AI) refers to the simulation of human intelligence in machines.",
                      "Key concepts:",
                      "- Machine Learning",
                      "- Neural Networks",
                      "- Natural Language Processing"
                    ]
                  }
                ],
                quiz: {
                  questions: [
                    {
                      text: "Which is NOT an AI application?",
                      options: ["Chatbots", "Self-driving cars", "Spreadsheets"],
                      answer: 2
                    }
                  ],
                  passingScore: 70
                }
              }
            ],
            exam: {
              title: "AI Fundamentals Exam",
              description: "Final assessment for beginner AI track",
              passingScore: 75,
              certificate: {
                title: "AI Fundamentals Certificate",
                description: "Awarded for completing the Beginner AI track"
              }
            }
          }
        ]
      }
    };
  }

  setupEventListeners() {
    // Theme toggle
    document.getElementById('theme-toggle').addEventListener('click', () => {
      this.toggleTheme();
    });

    // Sidebar toggle
    document.getElementById('sidebar-toggle').addEventListener('click', () => {
      document.querySelector('.sidebar').classList.toggle('active');
    });

    // Navigation
    // In setupEventListeners()
document.querySelectorAll('.main-nav a').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const sectionId = e.target.getAttribute('href').substring(1);
    this.navigateTo(sectionId);
    this.updateActiveNav(); // Explicitly call this after navigation
  });
});
    
    // Event delegation for dynamic content
    document.querySelector('.main-content').addEventListener('click', (e) => {
      // Handle lesson toggles
      if (e.target.closest('.lesson-title')) {
        this.toggleLessonContent(e.target.closest('.lesson'));
      }
      
      // Handle mark complete buttons
      if (e.target.closest('.mark-complete')) {
        const button = e.target.closest('.mark-complete');
        this.markLessonComplete(
          button.dataset.course,
          button.dataset.module,
          button.dataset.lesson
        );
      }
    });
  }
  
 setupInteractiveElements() {
    // Handle lesson toggles
    document.querySelectorAll('.lesson-title').forEach(title => {
      title.addEventListener('click', (e) => {
        this.toggleLessonContent(e.target.closest('.lesson'));
      });
    });

    // Handle mark complete buttons
    document.querySelectorAll('.mark-complete').forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        this.markLessonComplete(
          button.dataset.course,
          button.dataset.module,
          button.dataset.lesson
        );
      });
    });

    // Handle quiz submission
    document.querySelectorAll('.submit-quiz').forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const moduleTitle = button.closest('.quiz-container').querySelector('h4').textContent.replace('Module Quiz', '').trim();
        this.submitQuiz(moduleTitle);
      });
    });

    // Handle exam start
    document.querySelectorAll('.start-exam').forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const levelName = button.closest('.exam-container').querySelector('h4').textContent.replace('Exam', '').trim();
        this.startExam(levelName);
      });
    });

    // Handle certificate download
    document.querySelectorAll('.download-certificate').forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const certTitle = button.closest('.exam-container').querySelector('h4').textContent.replace('Exam', '').trim() + ' Certificate';
        this.generateCertificate(certTitle);
      });
    });

    // Handle course continuation
    this.setupCourseButtons();
}

  navigateTo(sectionId) {
    this.currentSection = sectionId;
    this.render();
    window.scrollTo(0, 0);
  }

  render() {
    const mainContent = document.querySelector('.main-content');
    
    switch (this.currentSection) {
      case 'dashboard':
        mainContent.innerHTML = this.renderDashboard();
        break;
      case 'ai-courses':
        mainContent.innerHTML = this.renderCourseSection('ai');
        break;
      case 'crypto-courses':
        mainContent.innerHTML = this.renderCourseSection('crypto');
        break;
      case 'achievements':
        mainContent.innerHTML = this.renderAchievements();
        break;
      case 'resources':
        mainContent.innerHTML = this.renderResources();
        break;
      default:
        mainContent.innerHTML = this.renderDashboard();
    }

    this.updateActiveNav();
    this.setupCourseButtons();
    
    // Only setup interactive elements after DOM is updated
    setTimeout(() => {
      this.setupInteractiveElements();
    }, 50);
}
  

  renderContinueLearning() {
    const availableCourses = [
      'AI Fundamentals',
      'Crypto Fundamentals',
      ...this.state.user.progress.inProgressCourses
    ].filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates

    return `
      <div class="continue-learning">
        <h3>Continue Learning</h3>
        <div class="course-cards">
          ${availableCourses.length > 0 ? 
            availableCourses.map(course => this.renderCourseCard(course)).join('') :
            '<p>No courses available. Please check back later.</p>'}
        </div>
      </div>
    `;
}
    
// Update active nav item
updateActiveNav() {
  const navItems = document.querySelectorAll('.main-nav li');
  const currentNavLink = document.querySelector(`.main-nav a[href="#${this.currentSection}"]`);
  
  navItems.forEach(li => {
    li.classList.remove('active');
  });
  
  if (currentNavLink && currentNavLink.parentElement) {
    currentNavLink.parentElement.classList.add('active');
  } else {
    // Fallback to dashboard if no matching section found
    const dashboardLink = document.querySelector('.main-nav a[href="#dashboard"]');
    if (dashboardLink && dashboardLink.parentElement) {
      dashboardLink.parentElement.classList.add('active');
    }
  }
}

  renderDashboard() {
    const totalCourses = this.calculateTotalCourses();
    const completedCourses = this.state.user.progress.completedCourses.length;
    const progressPercentage = Math.round((completedCourses / totalCourses) * 100);
    const inProgressCourses = this.state.user.progress.inProgressCourses;
    const badgesEarned = this.state.user.progress.badges.length;

    return `
      <header class="content-header">
        <div class="search-container">
          <i class="fas fa-search"></i>
          <input type="text" placeholder="Search courses and lessons...">
        </div>
        
        <div class="header-actions">
          <button class="btn btn-outline">
            <i class="fas fa-bell"></i>
            <span class="notification-badge">3</span>
          </button>
          <button class="btn btn-outline">
            <i class="fas fa-cog"></i>
          </button>
        </div>
      </header>

      <section id="dashboard" class="dashboard-section active-section">
        <div class="section-header">
          <h2>Your Learning Dashboard</h2>
          <p>Track your progress and continue learning</p>
        </div>
        
        <div class="stats-overview">
          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-graduation-cap"></i>
            </div>
            <div class="stat-details">
              <h3>Course Progress</h3>
              <div class="progress-container">
                <div class="progress-bar" style="width: ${progressPercentage}%">${progressPercentage}%</div>
              </div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-tasks"></i>
            </div>
            <div class="stat-details">
              <h3>Completed</h3>
              <p>${completedCourses} out of ${totalCourses} courses</p>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-trophy"></i>
            </div>
            <div class="stat-details">
              <h3>Achievements</h3>
              <p>${badgesEarned} badges earned</p>
            </div>
          </div>
        </div>
        
        <div class="continue-learning">
          <h3>Continue Learning</h3>
          <div class="course-cards">
            ${inProgressCourses.length > 0 ? 
              inProgressCourses.map(course => this.renderCourseCard(course)).join('') :
              '<p>No courses in progress. Start a new course!</p>'}
          </div>
        </div>
        
        <div class="courses-overview">
          ${this.renderLearningTrack('ai')}
          ${this.renderLearningTrack('crypto')}
        </div>
      </section>
    `;
  }

  renderCourseSection(courseId) {
    const course = this.courses[courseId];
    if (!course) return '<div class="error">Course not available</div>';

    return `
      <header class="content-header">
        <div class="search-container">
          <i class="fas fa-search"></i>
          <input type="text" placeholder="Search ${course.title} courses...">
        </div>
        
        <div class="header-actions">
          <button class="btn btn-outline">
            <i class="fas fa-bell"></i>
            <span class="notification-badge">3</span>
          </button>
          <button class="btn btn-outline">
            <i class="fas fa-cog"></i>
          </button>
        </div>
      </header>

      <section id="${courseId}-courses" class="course-section active-section">
        <div class="section-header">
          <h2>${course.title} Courses</h2>
          <p>${course.description}</p>
        </div>
        
        <div class="course-levels">
          ${course.levels.map(level => this.renderLevel(level, courseId)).join('')}
        </div>
      </section>
    `;
  }

  renderLevel(level, courseId) {
    const levelStatus = this.getLevelStatus(level.name, courseId);
    
    return `
      <div class="level-container">
        <div class="level-header">
          <h3>${level.name}</h3>
          <span class="status ${levelStatus}">${this.formatStatus(levelStatus)}</span>
        </div>
        
        ${levelStatus === 'locked' ? this.renderLockedLevel() : `
          <div class="level-modules">
            ${level.modules.map(module => this.renderModule(module, courseId)).join('')}
            ${level.exam ? this.renderExam(level.exam, level.name) : ''}
          </div>
        `}
      </div>
    `;
  }

  renderModule(module, courseId) {
    const moduleStatus = this.getModuleStatus(module.title);
    const isLocked = moduleStatus === 'locked';
    
    return `
      <div class="module ${moduleStatus}">
        <div class="module-header" data-module="${this.slugify(module.title)}" 
             ${isLocked ? 'style="cursor: not-allowed; opacity: 0.7;"' : ''}>
          <h4>${module.title}</h4>
          <div class="module-status">
            <span><i class="fas ${this.getStatusIcon(moduleStatus)}"></i> ${this.formatStatus(moduleStatus)}</span>
            ${!isLocked ? '<i class="fas fa-chevron-down"></i>' : ''}
          </div>
        </div>
        ${!isLocked ? `
          <div class="module-content" id="module-${this.slugify(module.title)}">
            ${this.renderLessons(module.lessons, courseId, module.title)}
            ${module.quiz ? this.renderQuiz(module.quiz, module.title) : ''}
          </div>
        ` : ''}
      </div>
    `;
}

  renderLessons(lessons, courseId, moduleTitle) {
    return `
      <div class="lesson-list">
        ${lessons.map(lesson => this.renderLesson(lesson, courseId, moduleTitle)).join('')}
      </div>
    `;
  }

  renderLesson(lesson, courseId, moduleTitle) {
    const isCompleted = this.isLessonCompleted(moduleTitle, lesson.title);
    
    return `
      <div class="lesson ${isCompleted ? 'completed' : ''}">
        <div class="lesson-info">
          <span class="lesson-title">${lesson.title}</span>
          <span class="lesson-meta">
            <span class="lesson-type ${lesson.type}"><i class="fas ${this.getLessonTypeIcon(lesson.type)}"></i></span>
            ${lesson.duration ? `<span class="lesson-duration">${lesson.duration}</span>` : ''}
          </span>
        </div>
        
        ${isCompleted || this.state.currentSection === 'dashboard' ? '' : `
          <div class="lesson-content">
            ${this.formatLessonContent(lesson.content)}
            <button class="btn btn-primary mark-complete"
                    data-course="${courseId}"
                    data-module="${moduleTitle}"
                    data-lesson="${lesson.title}">
              Mark as Complete
            </button>
          </div>
        `}
      </div>
    `;
  }

  renderQuiz(quiz, moduleTitle) {
    const quizResult = this.state.user.progress.quizScores[moduleTitle];
    const quizStatus = quizResult ? 
      (quizResult.score >= quiz.passingScore ? 'passed' : 'failed') : 'unattempted';
    
    return `
      <div class="quiz-container ${quizStatus}">
        <h4>Module Quiz</h4>
        
        ${quizStatus !== 'unattempted' ? `
          <div class="quiz-result">
            <p>Your score: <strong>${quizResult.score}%</strong> (Required: ${quiz.passingScore}%)</p>
            <p>Status: <span class="${quizStatus}">${quizStatus.toUpperCase()}</span></p>
          </div>
        ` : ''}
        
        <div class="quiz-questions">
          ${quiz.questions.map((q, i) => `
            <div class="question">
              <p>${i+1}. ${q.text}</p>
              <div class="options">
                ${q.options.map((opt, j) => `
                  <label>
                    <input type="radio" name="quiz-${this.slugify(moduleTitle)}" value="${j}" 
                      ${quizResult?.answers?.[i] === j ? 'checked' : ''}>
                    ${opt}
                  </label>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
        
        <button class="btn ${quizStatus === 'passed' ? 'btn-secondary' : 'btn-primary'} submit-quiz">
          ${quizStatus === 'unattempted' ? 'Submit Quiz' : 'Update Answers'}
        </button>
      </div>
    `;
  }

 renderExam(exam, levelName) {
    const levelCompleted = this.isLevelCompleted(levelName);
    const examStatus = levelCompleted ? 'passed' : 'unattempted';
    
    return `
      <div class="exam-container ${examStatus}">
        <div class="exam-header">
          <h4>${exam.title}</h4>
          
          ${examStatus === 'passed' ? `
            <div class="exam-result">
              <span class="passed">✓ PASSED</span>
              <button class="btn btn-outline download-certificate">
                Download Certificate
              </button>
            </div>
          ` : ''}
        </div>
        
        ${examStatus === 'unattempted' ? `
          <div class="exam-instructions">
            <p>${exam.description}</p>
            <p>Complete all modules in this level to unlock the exam.</p>
            <button class="btn btn-primary start-exam" 
                    ${levelCompleted ? '' : 'disabled'}>
              ${levelCompleted ? 'Start Exam' : 'Complete Modules First'}
            </button>
          </div>
        ` : ''}
      </div>
    `;
}

isLevelCompleted(levelName) {
    // Find all modules in this level
    let levelModules = [];
    for (const course of Object.values(this.courses)) {
        for (const level of course.levels) {
            if (level.name === levelName) {
                levelModules = level.modules.map(m => m.title);
                break;
            }
        }
    }
    
    // Check if all modules are completed
    return levelModules.every(moduleTitle => 
        this.state.user.progress.completedCourses.includes(moduleTitle)
    );
}

  renderLearningTrack(trackId) {
    const track = this.courses[trackId];
    if (!track) return '';
    
    const levels = track.levels;
    const trackProgress = this.calculateTrackProgress(trackId);
    
    return `
      <div class="track-container">
        <div class="track-header">
          <h3><i class="fas ${trackId === 'ai' ? 'fa-robot' : 'fa-coins'}"></i> ${track.title} Learning Track</h3>
          <a href="#${trackId}-courses" class="view-all">View All</a>
        </div>
        <div class="track-progress">
          ${levels.map((level, i) => this.renderLevelProgress(level, trackId, i, levels.length)).join('')}
        </div>
      </div>
    `;
  }

  renderLevelProgress(level, trackId, index, totalLevels) {
    const levelStatus = this.getLevelStatus(level.name, trackId);
    const isLast = index === totalLevels - 1;
    const levelName = level.name.split(':')[0].trim();
    
    return `
      <div class="level ${levelStatus}">
        <div class="level-icon"><i class="fas ${this.getStatusIcon(levelStatus)}"></i></div>
        <div class="level-details">
          <h4>${levelName}</h4>
          <p>${level.name.split(':')[1].trim()}</p>
        </div>
        ${!isLast ? '<div class="track-connector"></div>' : ''}
        <button class="btn btn-small ${levelStatus === 'completed' ? '' : 
          levelStatus === 'in-progress' ? 'btn-primary' : ''}" 
          ${levelStatus === 'locked' ? 'disabled' : ''}
          data-course="${trackId}"
          data-level="${level.name}">
          ${levelStatus === 'completed' ? 'Review' : 
           levelStatus === 'in-progress' ? 'Continue' : 'Locked'}
        </button>
      </div>
    `;
}

  renderCourseCard(courseTitle) {
    const progress = this.calculateCourseProgress(courseTitle);
    const courseType = courseTitle.includes('AI') ? 'ai' : 'crypto';
    const courseId = courseType;
    
    return `
      <div class="course-card">
        <div class="course-image ${courseType}-bg">
          <span class="course-level">${this.getCourseLevel(courseTitle)}</span>
        </div>
        <div class="course-content">
          <h4>${courseTitle}</h4>
          <p>${this.getCourseDescription(courseTitle)}</p>
          <div class="progress-container">
            <div class="progress-bar" style="width: ${progress}%">${progress}%</div>
          </div>
          <button class="btn btn-primary continue-course" 
                  data-course="${courseId}"
                  data-module="${courseTitle}">
            ${progress > 0 ? 'Continue' : 'Start'}
          </button>
        </div>
      </div>
    `;
}
  
  setupCourseButtons() {
    document.querySelectorAll('.continue-course').forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const courseId = e.target.dataset.course;
        const moduleTitle = e.target.dataset.module;
        
        this.navigateTo(`${courseId}-courses`);
        
        // Scroll to module after render
        setTimeout(() => {
          if (moduleTitle) {
            const moduleElement = document.querySelector(`[data-module="${moduleTitle}"]`);
            if (moduleElement) {
              moduleElement.scrollIntoView({ behavior: 'smooth' });
              // Open the module if it exists
              const content = document.getElementById(`module-${this.slugify(moduleTitle)}`);
              if (content) {
                content.style.display = 'block';
              }
            }
          }
        }, 100);
      });
    });
}

  renderAchievements() {
    const badges = [
      {
        id: 'ai-fundamentals',
        title: 'AI Fundamentals',
        description: 'Completed Beginner AI Course',
        icon: 'fa-medal',
        earned: this.state.user.progress.badges.includes('AI Fundamentals')
      },
      {
        id: 'blockchain-explorer',
        title: 'Blockchain Explorer',
        description: 'Completed Beginner Crypto Course',
        icon: 'fa-award',
        earned: this.state.user.progress.badges.includes('Blockchain Explorer')
      }
    ];

    return `
      <header class="content-header">
        <div class="search-container">
          <i class="fas fa-search"></i>
          <input type="text" placeholder="Search achievements...">
        </div>
        
        <div class="header-actions">
          <button class="btn btn-outline">
            <i class="fas fa-bell"></i>
            <span class="notification-badge">3</span>
          </button>
          <button class="btn btn-outline">
            <i class="fas fa-cog"></i>
          </button>
        </div>
      </header>

      <section id="achievements" class="achievements-section active-section">
        <div class="section-header">
          <h2>Your Achievements</h2>
          <p>Badges and certificates you've earned</p>
        </div>
        
        <div class="badges-container">
          ${badges.map(badge => `
            <div class="badge-card ${badge.earned ? 'earned' : 'locked'}">
              <div class="badge-icon">
                <i class="fas ${badge.icon}"></i>
              </div>
              <div class="badge-details">
                <h4>${badge.title}</h4>
                <p>${badge.description}</p>
                ${badge.earned ? 
                  `<span class="badge-date">Earned: ${new Date().toLocaleDateString()}</span>` : 
                  `<span class="badge-status">Locked</span>`}
              </div>
            </div>
          `).join('')}
        </div>
        
        <div class="certificates-container">
          <h3>Your Certificates</h3>
          <div class="certificate-cards">
            ${this.state.user.progress.certificates.length > 0 ?
              this.state.user.progress.certificates.map(cert => `
                <div class="certificate-card">
                  <div class="certificate-icon">
                    <i class="fas fa-certificate"></i>
                  </div>
                  <div class="certificate-details">
                    <h4>${cert}</h4>
                    <p>Successfully completed the ${cert.replace(' Certificate', '')} course</p>
                    <span class="certificate-date">Issued: ${new Date().toLocaleDateString()}</span>
                  </div>
                  <div class="certificate-actions">
                    <button class="btn btn-outline">Download</button>
                    <button class="btn btn-outline">Share</button>
                  </div>
                </div>
              `).join('') :
              '<p>No certificates earned yet. Complete courses to earn certificates!</p>'}
          </div>
        </div>
      </section>
    `;
  }

  renderResources() {
    const resources = [
      {
        icon: 'fa-book',
        title: 'AI Reading List',
        description: 'Curated books and articles on artificial intelligence'
      },
      {
        icon: 'fa-video',
        title: 'Crypto Video Library',
        description: 'Expert interviews and tutorials on cryptocurrency'
      }
    ];

    return `
      <header class="content-header">
        <div class="search-container">
          <i class="fas fa-search"></i>
          <input type="text" placeholder="Search resources...">
        </div>
        
        <div class="header-actions">
          <button class="btn btn-outline">
            <i class="fas fa-bell"></i>
            <span class="notification-badge">3</span>
          </button>
          <button class="btn btn-outline">
            <i class="fas fa-cog"></i>
          </button>
        </div>
      </header>

      <section id="resources" class="resources-section active-section">
        <div class="section-header">
          <h2>Learning Resources</h2>
          <p>Additional materials to enhance your learning</p>
        </div>
        
        <div class="resources-grid">
          ${resources.map(resource => `
            <div class="resource-card">
              <div class="resource-icon">
                <i class="fas ${resource.icon}"></i>
              </div>
              <div class="resource-details">
                <h4>${resource.title}</h4>
                <p>${resource.description}</p>
                <button class="btn btn-outline">View Resources</button>
              </div>
            </div>
          `).join('')}
        </div>
      </section>
    `;
  }

  // Helper Methods
  toggleTheme() {
    this.state.currentTheme = this.state.currentTheme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', this.state.currentTheme);
    this.applyTheme();
  }

  applyTheme() {
    document.documentElement.setAttribute('data-theme', this.state.currentTheme);
    const icon = this.state.currentTheme === 'dark' ? 'fa-sun' : 'fa-moon';
    document.getElementById('theme-toggle').innerHTML = `<i class="fas ${icon}"></i>`;
  }

  toggleLessonContent(lessonElement) {
    const content = lessonElement.querySelector('.lesson-content');
    if (content) {
      content.style.display = content.style.display === 'none' ? 'block' : 'none';
    }
}

submitQuiz(moduleTitle) {
    // Implementation for quiz submission
    console.log(`Submitting quiz for ${moduleTitle}`);
    // Add your quiz submission logic here
}

startExam(levelName) {
    // Implementation for starting exam
    console.log(`Starting exam for ${levelName}`);
    // Add your exam start logic here
}

generateCertificate(certTitle) {
    // Implementation for certificate generation
    console.log(`Generating certificate: ${certTitle}`);
    // Add your certificate generation logic here
}

  markLessonComplete(courseId, moduleTitle, lessonTitle) {
    // Initialize module progress if not exists
    if (!this.state.user.progress.completedLessons[moduleTitle]) {
      this.state.user.progress.completedLessons[moduleTitle] = [];
    }

    // Mark lesson complete
    if (!this.state.user.progress.completedLessons[moduleTitle].includes(lessonTitle)) {
      this.state.user.progress.completedLessons[moduleTitle].push(lessonTitle);
      
      // Mark module as in progress if not already
      if (!this.state.user.progress.inProgressCourses.includes(moduleTitle) &&
          !this.state.user.progress.completedCourses.includes(moduleTitle)) {
        this.state.user.progress.inProgressCourses.push(moduleTitle);
      }

      // Check if all lessons are completed
      const module = this.findModule(courseId, moduleTitle);
      if (module && module.lessons.length === this.state.user.progress.completedLessons[moduleTitle].length) {
        this.state.user.progress.completedCourses.push(moduleTitle);
        this.state.user.progress.inProgressCourses = this.state.user.progress.inProgressCourses.filter(
          title => title !== moduleTitle
        );
        
        // Award badge if applicable
        this.awardBadge(moduleTitle);
      }

      this.saveProgress();
      this.render();
    }
  }

  awardBadge(moduleTitle) {
    const badgeMap = {
      'Introduction to AI': 'AI Fundamentals',
      'Crypto Basics': 'Blockchain Explorer'
    };

    if (badgeMap[moduleTitle] && !this.state.user.progress.badges.includes(badgeMap[moduleTitle])) {
      this.state.user.progress.badges.push(badgeMap[moduleTitle]);
      this.saveProgress();
    }
  }

  findModule(courseId, moduleTitle) {
    if (!this.courses[courseId]) return null;
    
    for (const level of this.courses[courseId].levels) {
      for (const module of level.modules) {
        if (module.title === moduleTitle) {
          return module;
        }
      }
    }
    return null;
  }

  saveProgress() {
    localStorage.setItem('userProgress', JSON.stringify(this.state.user.progress));
  }

  // Status check methods
  isLessonCompleted(moduleTitle, lessonTitle) {
    return this.state.user.progress.completedLessons[moduleTitle]?.includes(lessonTitle) || false;
  }

  getModuleStatus(moduleTitle) {
    // Check if module is completed
    if (this.state.user.progress.completedCourses.includes(moduleTitle)) {
        return 'completed';
    }
    
    // Check if any lessons in this module are completed
    const hasCompletedLessons = this.state.user.progress.completedLessons[moduleTitle]?.length > 0;
    
    // Check if this is the first module in its level
    const isFirstModule = this.isFirstModuleInLevel(moduleTitle);
    
    // Module should be available if:
    // 1. It's the first module in its level, OR
    // 2. Any lessons are completed, OR
    // 3. It's explicitly marked as in progress
    if (isFirstModule || 
        hasCompletedLessons || 
        this.state.user.progress.inProgressCourses.includes(moduleTitle)) {
        return 'in-progress';
    }
    
    return 'locked';
}

isFirstModuleInLevel(moduleTitle) {
    for (const course of Object.values(this.courses)) {
        for (const level of course.levels) {
            if (level.modules.length > 0 && level.modules[0].title === moduleTitle) {
                return true;
            }
        }
    }
    return false;
}

  getLevelStatus(levelName, courseId) {
    // Simplified logic - in a real app, check prerequisites
    if (levelName.includes('Beginner')) {
      return this.state.user.progress.completedCourses.some(c => c.includes('Fundamentals')) ? 
        'completed' : 'in-progress';
    }
    if (levelName.includes('Intermediate')) {
      return this.state.user.progress.completedCourses.some(c => c.includes('Fundamentals')) ? 
        'in-progress' : 'locked';
    }
    return 'locked';
  }

  calculateCourseProgress(courseTitle) {
    // Simplified progress calculation
    if (courseTitle.includes('Fundamentals')) {
      return this.state.user.progress.completedCourses.includes(courseTitle) ? 100 : 75;
    }
    if (courseTitle.includes('Neural Networks') || courseTitle.includes('Smart Contracts')) {
      return this.state.user.progress.inProgressCourses.includes(courseTitle) ? 45 : 0;
    }
    return 0;
  }

  calculateTrackProgress(trackId) {
    const levels = this.courses[trackId]?.levels || [];
    let completed = 0;
    
    levels.forEach(level => {
      if (this.getLevelStatus(level.name, trackId) === 'completed') {
        completed++;
      }
    });
    
    return {
      completed,
      total: levels.length,
      percentage: Math.round((completed / levels.length) * 100)
    };
  }

  calculateTotalCourses() {
    let count = 0;
    for (const course of Object.values(this.courses)) {
      count += course.levels?.length || 0;
    }
    return count;
  }

  getCourseLevel(courseTitle) {
    if (courseTitle.includes('Fundamentals')) return 'Beginner';
    if (courseTitle.includes('Neural Networks') || courseTitle.includes('Smart Contracts')) return 'Intermediate';
    return 'Advanced';
  }

  getCourseDescription(courseTitle) {
    if (courseTitle.includes('AI Fundamentals')) return 'Learn the basics of artificial intelligence';
    if (courseTitle.includes('Neural Networks')) return 'Understand how neural networks work';
    if (courseTitle.includes('Crypto Fundamentals')) return 'Learn blockchain technology basics';
    return 'Advanced course content';
  }

  getStatusIcon(status) {
    return {
      'completed': 'fa-check-circle',
      'in-progress': 'fa-spinner',
      'locked': 'fa-lock'
    }[status];
  }

  getLessonTypeIcon(type) {
    return {
      'video': 'fa-video',
      'reading': 'fa-book-open',
      'quiz': 'fa-question-circle',
      'interactive': 'fa-laptop-code'
    }[type] || 'fa-circle';
  }

  formatStatus(status) {
    return {
      'completed': 'Completed',
      'in-progress': 'In Progress',
      'locked': 'Locked'
    }[status];
  }

  formatLessonContent(content) {
    return content.map(item => {
      if (item.startsWith('- ') || item.startsWith('• ')) {
        return `<p class="bullet-point">${item}</p>`;
      } else if (item.includes(':')) {
        return `<h5>${item}</h5>`;
      } else {
        return `<p>${item}</p>`;
      }
    }).join('');
  }

  slugify(text) {
    return text.toString().toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }

  renderLockedLevel() {
    return `
      <div class="locked-message">
        <i class="fas fa-lock"></i>
        <p>Complete the previous level to unlock this content</p>
      </div>
    `;
  }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  const app = new LearningPlatform();
});