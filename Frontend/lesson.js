
document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const appContainer = document.querySelector('.app-container');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const themeToggle = document.getElementById('theme-toggle');
  const sections = document.querySelectorAll('.course-section, .dashboard-section, .achievements-section, .resources-section');
  const navLinks = document.querySelectorAll('.main-nav a');
  
  // State Management
  let userProgress = JSON.parse(localStorage.getItem('userProgress')) || {
    completedCourses: [],
    currentModules: {},
    achievements: []
  };
  
  // Initialize App
  initApp();
  
  // Event Listeners
  sidebarToggle.addEventListener('click', toggleSidebar);
  themeToggle.addEventListener('click', toggleTheme);
  
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const sectionId = this.getAttribute('href').substring(1);
      showSection(sectionId);
      updateActiveNav(this);
    });
  });
  
  // Functions
  function initApp() {
    // Load user's preferred theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
    
    // Load course data and render
    fetch('data.json')
      .then(response => response.json())
      .then(data => {
        renderCourses(data.courses);
        updateUserProgress();
      })
      .catch(error => {
        console.error('Error loading course data:', error);
        // Fallback to empty state
        renderCourses({ ai: { title: 'AI' }, crypto: { title: 'Crypto' } });
      });
    
    // Show dashboard by default
    showSection('dashboard');
  }
  
  function renderCourses(coursesData) {
    // Render AI Courses
    if (coursesData.ai) {
      renderCourseSection('ai-courses', coursesData.ai);
    }
    
    // Render Crypto Courses
    if (coursesData.crypto) {
      renderCourseSection('crypto-courses', coursesData.crypto);
    }
    
    // Setup module toggles after rendering
    setupModuleToggles();
  }
  
  function renderCourseSection(sectionId, courseData) {
    const section = document.getElementById(sectionId);
    if (!section) return;
    
    let html = `
      <div class="section-header">
        <h2>${courseData.title} Courses</h2>
        <p>Learn the fundamentals and advanced concepts of ${courseData.title}</p>
      </div>
      <div class="course-levels">
    `;
    
    courseData.levels.forEach(level => {
      const levelStatus = getLevelStatus(level.name);
      
      html += `
        <div class="level-container">
          <div class="level-header">
            <h3>${level.name}</h3>
            <span class="status ${levelStatus}">${formatStatusText(levelStatus)}</span>
          </div>
      `;
      
      if (levelStatus === 'locked') {
        html += `
          <div class="locked-message">
            <i class="fas fa-lock"></i>
            <p>Complete the previous level to unlock this content</p>
          </div>
        `;
      } else {
        html += `<div class="level-modules">`;
        
        level.modules.forEach(module => {
          const moduleStatus = getModuleStatus(module.title);
          
          html += `
            <div class="module ${moduleStatus}">
              <div class="module-header" data-toggle="module-${slugify(module.title)}">
                <h4>${module.title}</h4>
                <div class="module-status">
                  <span><i class="fas ${getStatusIcon(moduleStatus)}"></i> ${formatStatusText(moduleStatus)}</span>
                  <i class="fas fa-chevron-down"></i>
                </div>
              </div>
              <div class="module-content" id="module-${slugify(module.title)}">
                ${renderLessons(module.lessons, module.title)}
              </div>
            </div>
          `;
        });
        
        html += `</div>`; // Close level-modules
      }
      
      html += `</div>`; // Close level-container
    });
    
    html += `</div>`; // Close course-levels
    section.innerHTML = html;
  }
  
  function renderLessons(lessons, moduleTitle) {
    let html = `<div class="lesson-list">`;
    
    lessons.forEach(lesson => {
      const lessonStatus = getLessonStatus(moduleTitle, lesson.title);
      
      html += `
        <div class="lesson ${lessonStatus}">
          <span class="lesson-title">${lesson.title}</span>
          <span class="lesson-type ${lesson.type}"><i class="fas ${getLessonTypeIcon(lesson.type)}"></i></span>
        </div>
        <div class="lesson-content ${lessonStatus === 'completed' ? 'completed' : ''}">
          ${formatLessonContent(lesson.content)}
          <div class="lesson-actions">
            <button class="btn btn-primary mark-complete" 
                    data-module="${moduleTitle}" 
                    data-lesson="${lesson.title}">
              ${lessonStatus === 'completed' ? 'Completed' : 'Mark as Complete'}
            </button>
          </div>
        </div>
      `;
    });
    
    html += `</div>`;
    return html;
  }
  
  function formatLessonContent(content) {
    return content.map(item => {
      if (item.startsWith('- ') || item.startsWith('• ')) {
        return `<p class="bullet-point">${item}</p>`;
      } else if (item.startsWith('Key aspects') || item.startsWith('Key characteristics')) {
        return `<h5>${item}</h5>`;
      } else {
        return `<p>${item}</p>`;
      }
    }).join('');
  }
  
  function setupModuleToggles() {
    document.querySelectorAll('.module-header').forEach(header => {
      header.addEventListener('click', function() {
        const moduleId = this.getAttribute('data-toggle');
        const module = this.closest('.module');
        const content = document.getElementById(moduleId);
        const chevron = this.querySelector('.fa-chevron-down');
        
        module.classList.toggle('active');
        content.style.maxHeight = module.classList.contains('active') ? `${content.scrollHeight}px` : '0';
        chevron.style.transform = module.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0)';
      });
    });
    
    // Setup mark complete buttons
    document.querySelectorAll('.mark-complete').forEach(button => {
      button.addEventListener('click', function() {
        const moduleTitle = this.getAttribute('data-module');
        const lessonTitle = this.getAttribute('data-lesson');
        toggleLessonCompletion(moduleTitle, lessonTitle);
      });
    });
  }
  
  function toggleLessonCompletion(moduleTitle, lessonTitle) {
    // Check if lesson is already completed
    const moduleProgress = userProgress.currentModules[moduleTitle] || {};
    const isCompleted = moduleProgress[lessonTitle];
    
    if (isCompleted) {
      // Mark as incomplete
      delete moduleProgress[lessonTitle];
    } else {
      // Mark as complete
      moduleProgress[lessonTitle] = true;
    }
    
    userProgress.currentModules[moduleTitle] = moduleProgress;
    
    // Check if all lessons in module are completed
    if (Object.keys(moduleProgress).length === getLessonCount(moduleTitle)) {
      // Mark module as completed
      if (!userProgress.completedCourses.includes(moduleTitle)) {
        userProgress.completedCourses.push(moduleTitle);
      }
    }
    
    // Save progress
    localStorage.setItem('userProgress', JSON.stringify(userProgress));
    
    // Update UI
    updateUserProgress();
  }
  
  function updateUserProgress() {
    // Update dashboard stats
    const totalCourses = 6; // This should be dynamic based on actual courses
    const completedCourses = userProgress.completedCourses.length;
    const progressPercentage = Math.round((completedCourses / totalCourses) * 100);
    
    document.querySelector('.progress-bar').style.width = `${progressPercentage}%`;
    document.querySelector('.progress-bar').textContent = `${progressPercentage}%`;
    document.querySelector('.stat-card:nth-child(2) p').textContent = 
      `${completedCourses} out of ${totalCourses} courses`;
    
    // Update achievements
    updateAchievements();
    
    // Re-render course sections to reflect progress
    fetch('data.json')
      .then(response => response.json())
      .then(data => renderCourses(data.courses))
      .catch(console.error);
  }
  
  function updateAchievements() {
    const achievementsSection = document.getElementById('achievements');
    if (!achievementsSection) return;
    
    // This would be more dynamic in a real app
    const badges = [
      {
        title: "AI Fundamentals",
        description: "Completed Beginner AI Course",
        icon: "fa-medal",
        earned: userProgress.completedCourses.some(c => c.includes("AI Fundamentals"))
      },
      {
        title: "Blockchain Explorer",
        description: "Completed Beginner Crypto Course",
        icon: "fa-award",
        earned: userProgress.completedCourses.some(c => c.includes("Crypto Fundamentals"))
      }
    ];
    
    let html = `
      <div class="section-header">
        <h2>Your Achievements</h2>
        <p>Badges and certificates you've earned</p>
      </div>
      <div class="badges-container">
    `;
    
    badges.forEach(badge => {
      html += `
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
      `;
    });
    
    html += `</div>`;
    achievementsSection.innerHTML = html;
  }
  
  // Helper Functions
  function getLevelStatus(levelName) {
    // Simplified logic - in a real app, this would check prerequisites
    if (levelName.includes('Beginner')) return 'in-progress';
    if (levelName.includes('Intermediate')) return userProgress.completedCourses.length > 0 ? 'in-progress' : 'locked';
    return 'locked';
  }
  
  function getModuleStatus(moduleTitle) {
    return userProgress.completedCourses.includes(moduleTitle) ? 'completed' : 
           userProgress.currentModules[moduleTitle] ? 'in-progress' : 'locked';
  }
  
  function getLessonStatus(moduleTitle, lessonTitle) {
    const moduleProgress = userProgress.currentModules[moduleTitle] || {};
    return moduleProgress[lessonTitle] ? 'completed' : '';
  }
  
  function getLessonCount(moduleTitle) {
    // In a real app, this would check the actual lesson count from data
    return 3; // Default lesson count per module
  }
  
  function getStatusIcon(status) {
    return {
      'completed': 'fa-check-circle',
      'in-progress': 'fa-spinner',
      'locked': 'fa-lock'
    }[status];
  }
  
  function getLessonTypeIcon(type) {
    return {
      'video': 'fa-video',
      'reading': 'fa-book-open',
      'quiz': 'fa-question-circle',
      'interactive': 'fa-laptop-code'
    }[type];
  }
  
  function formatStatusText(status) {
    return {
      'completed': 'Completed',
      'in-progress': 'In Progress',
      'locked': 'Locked'
    }[status];
  }
  
  function slugify(text) {
    return text.toString().toLowerCase()
      .replace(/\s+/g, '-')           // Replace spaces with -
      .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
      .replace(/\-\-+/g, '-')         // Replace multiple - with single -
      .replace(/^-+/, '')             // Trim - from start of text
      .replace(/-+$/, '');            // Trim - from end of text
  }
  
  function toggleSidebar() {
    document.querySelector('.sidebar').classList.toggle('active');
  }
  
  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
  }
  
  function updateThemeIcon(theme) {
    const icon = theme === 'dark' ? 'fa-sun' : 'fa-moon';
    themeToggle.innerHTML = `<i class="fas ${icon}"></i>`;
  }
  
  function showSection(sectionId) {
    sections.forEach(section => {
      section.classList.toggle('active-section', section.id === sectionId);
    });
  }
  
  function updateActiveNav(activeLink) {
    navLinks.forEach(link => {
      link.parentElement.classList.toggle('active', link === activeLink);
    });
  }
});
