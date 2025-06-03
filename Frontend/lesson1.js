let coursesData = [];
let userProgress = {};
let enrolledCourses = [];
let currentUser = null;
let userEnrollments = [];

// NEW: Authentication functions
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }
    
    // Validate token and get user info
    try {
        const userData = localStorage.getItem('Userdata');
        if (userData) {
            currentUser = JSON.parse(userData);
        }
        return true;
    } catch (error) {
        console.error('Invalid user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        window.location.href = 'login.html';
        return false;
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    localStorage.removeItem('maichain_progress');
    localStorage.removeItem('user_enrollments');
    window.location.href = 'login.html';
}


        // Initialize the application
        document.addEventListener('DOMContentLoaded', function() {
            if (checkAuth()) {
            initializeApp();
    }
});

function initializeApp() {
    /**showLoading();**/
    loadUserData();
    loadUserProgress();
    loadCoursesFromJSON();
    setupEventListeners();
}

// NEW: Load user data and enrollments
function loadUserData() {
    if (currentUser) {
        // Display user info
        updateUserProfile();
        
        // Load user enrollments from localStorage
        const savedEnrollments = localStorage.getItem('user_enrollments');
        if (savedEnrollments) {
            userEnrollments = JSON.parse(savedEnrollments);
        }
    }
}

function updateUserProfile() {
    const profileAvatar = document.getElementById('profileAvatar');
    if (currentUser && currentUser.name) {
        profileAvatar.innerHTML = `
            <span class="profile-initial">${currentUser.name.charAt(0).toUpperCase()}</span>
        `;
        profileAvatar.title = currentUser.name;
    }
}

async function loadCoursesFromJSON() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        coursesData = data.courses || [];
        
        // Mark enrolled courses based on user enrollments
        coursesData.forEach(course => {
            course.enrolled = userEnrollments.includes(course.id);
        });
        
        enrolledCourses = coursesData.filter(course => course.enrolled);
        
        renderEnrolledCourses();
        renderAvailableCourses();
        hideLoading();
        updateStats();
        
    } catch (error) {
        console.error('Error loading courses:', error);
        hideLoading();
        showNotification('Failed to load courses. Please refresh the page.', 'error');
        
        // Fallback to sample data for development
        loadFallbackData();
    }
}

function loadFallbackData() {
    const sampleCourses = [
        {
            id: 1,
            title: "AI Fundamentals",
            description: "Learn the basics of Artificial Intelligence, machine learning concepts, and neural networks.",
            track: "AI",
            level: "beginner",
            duration: "6 weeks",
            modules: 12,
            enrolled: false
        },
        {
            id: 2,
            title: "Deep Learning Mastery",
            description: "Advanced deep learning techniques, CNN, RNN, and transformer architectures.",
            track: "AI",
            level: "advanced",
            duration: "10 weeks",
            modules: 20,
            enrolled: false
        },
        {
            id: 3,
            title: "Blockchain Basics",
            description: "Understanding blockchain technology, cryptocurrency, and decentralized systems.",
            track: "Crypto",
            level: "beginner",
            duration: "4 weeks",
            modules: 8,
            enrolled: false
        }
    ];
    
    coursesData = sampleCourses;
    coursesData.forEach(course => {
        course.enrolled = userEnrollments.includes(course.id);
    });
    enrolledCourses = coursesData.filter(course => course.enrolled);
    
    renderEnrolledCourses();
    renderAvailableCourses();
    updateStats();
}

function loadUserProgress() {
    const userId = currentUser?.id || 'default';
    const savedProgress = localStorage.getItem(`maichain_progress_${userId}`);
    if (savedProgress) {
        userProgress = JSON.parse(savedProgress);
    }
}

function saveUserProgress() {
    const userId = currentUser?.id || 'default';
    localStorage.setItem(`maichain_progress_${userId}`, JSON.stringify(userProgress));
    localStorage.setItem('user_enrollments', JSON.stringify(userEnrollments));
}

// REPLACE: Enroll course function with limits and auth check
function enrollCourse(courseId) {
    // Check authentication
    if (!checkAuth()) {
        return;
    }

    // Check enrollment limit
    if (userEnrollments.length >= 2) {
        showNotification('You can only enroll in 2 courses at a time. Complete or unenroll from a course first.', 'warning');
        return;
    }

    const course = coursesData.find(c => c.id === courseId);
    if (!course) return;

    // Check if already enrolled
    if (userEnrollments.includes(courseId)) {
        showNotification('You are already enrolled in this course.', 'info');
        return;
    }

    showNotification(`Enrolling in ${course.title}...`, 'info');
    
    setTimeout(() => {
        course.enrolled = true;
        userEnrollments.push(courseId);
        enrolledCourses = coursesData.filter(c => c.enrolled);
        userProgress[courseId] = 0;
        
        renderEnrolledCourses();
        renderAvailableCourses();
        updateStats();
        saveUserProgress();
        
        showNotification(`Successfully enrolled in ${course.title}!`, 'success');
    }, 1000);
}

// NEW: Unenroll course function
function unenrollCourse(courseId) {
    if (!checkAuth()) return;

    const course = coursesData.find(c => c.id === courseId);
    if (!course) return;

    if (confirm(`Are you sure you want to unenroll from ${course.title}? Your progress will be saved.`)) {
        course.enrolled = false;
        userEnrollments = userEnrollments.filter(id => id !== courseId);
        enrolledCourses = coursesData.filter(c => c.enrolled);
        
        renderEnrolledCourses();
        renderAvailableCourses();
        updateStats();
        saveUserProgress();
        
        showNotification(`Unenrolled from ${course.title}`, 'info');
    }
}
        function renderEnrolledCourses() {
            const gridContainer = document.getElementById('enrolledCoursesGrid');
            const listContainer = document.getElementById('enrolledCoursesList');
            const section = document.getElementById('enrolledSection');

            if (enrolledCourses.length === 0) {
                section.style.display = 'none';
                return;
            }

            section.style.display = 'block';

            // Grid view
            gridContainer.innerHTML = enrolledCourses.map(course => createCourseCard(course, true)).join('');
            
            // List view
            listContainer.innerHTML = enrolledCourses.map(course => createCourseListItem(course, true)).join('');
        }

        function renderAvailableCourses() {
            const gridContainer = document.getElementById('availableCoursesGrid');
            const listContainer = document.getElementById('availableCoursesList');

            const availableCourses = coursesData.filter(course => !course.enrolled);

            // Grid view
            gridContainer.innerHTML = availableCourses.map(course => createCourseCard(course, false)).join('');
            
            // List view
            listContainer.innerHTML = availableCourses.map(course => createCourseListItem(course, false)).join('');
        }

        function createCourseCard(course, isEnrolled) {
    const progress = userProgress[course.id] || 0;
    const trackClass = course.track.toLowerCase();
    
    return `
        <div class="course-card" data-course-id="${course.id}">
            <div class="course-header">
                <span class="course-track track-${trackClass}">${course.track}</span>
                <h3 class="course-title">${course.title}</h3>
                <p class="course-description">${course.description}</p>
                <div class="course-level">
                    <span class="level-badge level-${course.level}">${course.level}</span>
                    <span class="course-duration">${course.duration} • ${course.modules} modules</span>
                </div>
                ${isEnrolled ? `
                    <div class="course-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                        <div class="progress-text">
                            <span>Progress</span>
                            <span>${progress}%</span>
                        </div>
                    </div>
                ` : ''}
            </div>
            <div class="course-actions">
                ${isEnrolled ? `
                    <button class="btn btn-primary" onclick="continueCourse(${course.id})">
                        <i class="fas fa-play"></i> Continue
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="unenrollCourse(${course.id})" title="Unenroll">
                        <i class="fas fa-times"></i>
                    </button>
                ` : `
                    <button class="btn btn-primary" onclick="enrollCourse(${course.id})" ${userEnrollments.length >= 2 ? 'disabled title="Maximum 2 courses allowed"' : ''}>
                        <i class="fas fa-plus"></i> Enroll
                    </button>
                `}
                <button class="btn btn-secondary" onclick="viewCourseDetails(${course.id})">
                    <i class="fas fa-info-circle"></i> Details
                </button>
            </div>
        </div>
    `;
}

// UPDATE: Course list item with unenroll option
function createCourseListItem(course, isEnrolled) {
    const progress = userProgress[course.id] || 0;
    const trackClass = course.track.toLowerCase();
    
    return `
        <div class="course-list-item" data-course-id="${course.id}">
            <div class="course-list-info">
                <div class="course-list-meta">
                    <span class="course-track track-${trackClass}">${course.track}</span>
                    <span class="level-badge level-${course.level}">${course.level}</span>
                    <span class="course-duration">${course.duration}</span>
                </div>
                <h3 class="course-title">${course.title}</h3>
                <p class="course-description">${course.description}</p>
                ${isEnrolled ? `
                    <div class="course-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                        <div class="progress-text">
                            <span>Progress: ${progress}%</span>
                        </div>
                    </div>
                ` : ''}
            </div>
            <div class="course-list-actions">
                ${isEnrolled ? `
                    <button class="btn btn-primary" onclick="continueCourse(${course.id})">
                        <i class="fas fa-play"></i> Continue
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="unenrollCourse(${course.id})" title="Unenroll">
                        <i class="fas fa-times"></i>
                    </button>
                ` : `
                    <button class="btn btn-primary" onclick="enrollCourse(${course.id})" ${userEnrollments.length >= 2 ? 'disabled title="Maximum 2 courses allowed"' : ''}>
                        <i class="fas fa-plus"></i> Enroll
                    </button>
                `}
                <button class="btn btn-secondary" onclick="viewCourseDetails(${course.id})">
                    <i class="fas fa-info-circle"></i> Details
                </button>
            </div>
        </div>
    `;
}

// NEW: User management functions
function toggleUserMenu() {
    const existingMenu = document.getElementById('userMenu');
    if (existingMenu) {
        existingMenu.remove();
        return;
    }

    const userMenu = document.createElement('div');
    userMenu.id = 'userMenu';
    userMenu.className = 'user-menu';
    userMenu.innerHTML = `
        <div class="user-menu-content">
            <div class="user-info">
                <div class="user-avatar">
                    ${currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div class="user-details">
                    <div class="user-name">${currentUser?.name || 'User'}</div>
                    <div class="user-email">${currentUser?.email || 'user@example.com'}</div>
                </div>
            </div>
            <div class="user-menu-divider"></div>
            <button class="user-menu-item" onclick="viewProfile()">
                <i class="fas fa-user"></i> Profile Settings
            </button>
            <button class="user-menu-item" onclick="viewEnrollmentHistory()">
                <i class="fas fa-history"></i> Enrollment History
            </button>
            <button class="user-menu-item" onclick="downloadProgress()">
                <i class="fas fa-download"></i> Download Progress
            </button>
            <div class="user-menu-divider"></div>
            <button class="user-menu-item logout" onclick="logout()">
                <i class="fas fa-sign-out-alt"></i> Logout
            </button>
        </div>
    `;

    document.body.appendChild(userMenu);

    // Close menu when clicking outside
    setTimeout(() => {
        document.addEventListener('click', function closeMenu(e) {
            if (!userMenu.contains(e.target) && !document.getElementById('profileAvatar').contains(e.target)) {
                userMenu.remove();
                document.removeEventListener('click', closeMenu);
            }
        });
    }, 0);
}

function viewProfile() {
    // Remove existing user menu if present
    document.getElementById('userMenu')?.remove();
    
    // Create profile modal/overlay
    const profileOverlay = document.createElement('div');
    profileOverlay.id = 'profileOverlay';
    profileOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;
    
    // Create profile container
    const profileContainer = document.createElement('div');
    profileContainer.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 10px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        text-align: center;
        min-width: 300px;
        max-width: 400px;
    `;
    
    // Get username (you might want to retrieve this from localStorage, session, or API)
    const username = getCurrentUsername() || 'User'; // Replace with your actual username retrieval method
    
    profileContainer.innerHTML = `
        <div style="margin-bottom: 20px;">
            <div style="width: 80px; height: 80px; border-radius: 50%; background: #007bff; color: white; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: bold; margin: 0 auto 15px auto;">
                ${username.charAt(0).toUpperCase()}
            </div>
            <h2 style="margin: 0; color: #333; font-size: 24px;">${username}</h2>
            <p style="color: #666; margin: 5px 0 0 0;">Welcome back!</p>
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 10px;">
            <button id="editProfileBtn" style="
                padding: 12px 20px;
                background: #007bff;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
                transition: background 0.3s;
            ">Edit Profile</button>
            
            <button id="logoutBtn" style="
                padding: 12px 20px;
                background: #dc3545;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
                transition: background 0.3s;
            ">Logout</button>
            
            <button id="closeProfileBtn" style="
                padding: 10px 20px;
                background: #6c757d;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 14px;
                transition: background 0.3s;
            ">Close</button>
        </div>
    `;
    
    profileOverlay.appendChild(profileContainer);
    document.body.appendChild(profileOverlay);
    
    // Add event listeners
    document.getElementById('editProfileBtn').addEventListener('click', () => {
        showNotification('Profile editing feature coming soon!', 'info');
    });
    
    document.getElementById('logoutBtn').addEventListener('click', () => {
        if (confirm('Are you sure you want to logout?')) {
            performLogout();
        }
    });
    
    document.getElementById('closeProfileBtn').addEventListener('click', () => {
        document.getElementById('profileOverlay').remove();
    });
    
    // Close on overlay click
    profileOverlay.addEventListener('click', (e) => {
        if (e.target === profileOverlay) {
            profileOverlay.remove();
        }
    });
    
    // Add hover effects
    const buttons = profileContainer.querySelectorAll('button');
    buttons.forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            const currentBg = btn.style.background;
            if (currentBg.includes('#007bff')) btn.style.background = '#0056b3';
            else if (currentBg.includes('#dc3545')) btn.style.background = '#c82333';
            else if (currentBg.includes('#6c757d')) btn.style.background = '#545b62';
        });
        
        btn.addEventListener('mouseleave', () => {
            if (btn.id === 'editProfileBtn') btn.style.background = '#007bff';
            else if (btn.id === 'logoutBtn') btn.style.background = '#dc3545';
            else if (btn.id === 'closeProfileBtn') btn.style.background = '#6c757d';
        });
    });
}

// Helper function to get current username
function getCurrentUsername() {
    return localStorage.getItem('username');
    // return sessionStorage.getItem('currentUser');
    // return window.currentUser?.name;
    return 'JohnDoe'; // Placeholder - replace with actual implementation
}

// Helper function to handle logout
function performLogout() {
    // Add your logout logic here
    // Examples:
    // localStorage.removeItem('authToken');
    // sessionStorage.clear();
    // window.location.href = '/login';
    
    document.getElementById('profileOverlay')?.remove();
    showNotification('Logged out successfully!', 'success');
    
    // Redirect or refresh page as needed
    // window.location.reload();
}

/**function viewProfile() {
    document.getElementById('userMenu')?.remove();
    showNotification('Profile settings feature coming soon!', 'info');
}**/

function viewEnrollmentHistory() {
    document.getElementById('userMenu')?.remove();
    
    const historyModal = `
        <div class="modal-overlay" id="historyModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Enrollment History</h2>
                    <button class="modal-close" onclick="closeHistoryModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="enrollment-stats">
                        <div class="stat-item">
                            <span class="stat-label">Current Enrollments:</span>
                            <span class="stat-value">${userEnrollments.length}/2</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Completed Courses:</span>
                            <span class="stat-value">${enrolledCourses.filter(c => (userProgress[c.id] || 0) >= 100).length}</span>
                        </div>
                    </div>
                    <div class="enrollment-list">
                        ${enrolledCourses.length > 0 ? enrolledCourses.map(course => `
                            <div class="enrollment-item">
                                <div class="enrollment-info">
                                    <h4>${course.title}</h4>
                                    <span class="course-track track-${course.track.toLowerCase()}">${course.track}</span>
                                </div>
                                <div class="enrollment-progress">
                                    <div class="progress-bar small">
                                        <div class="progress-fill" style="width: ${userProgress[course.id] || 0}%"></div>
                                    </div>
                                    <span>${userProgress[course.id] || 0}%</span>
                                </div>
                            </div>
                        `).join('') : '<p>No enrolled courses yet.</p>'}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeHistoryModal()">Close</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', historyModal);
    document.body.style.overflow = 'hidden';
}

function closeHistoryModal() {
    const modal = document.getElementById('historyModal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = 'auto';
    }
}

function downloadProgress() {
    document.getElementById('userMenu')?.remove();
    
    const progressData = {
        user: currentUser,
        enrollments: userEnrollments,
        progress: userProgress,
        enrolledCourses: enrolledCourses.map(course => ({
            id: course.id,
            title: course.title,
            track: course.track,
            progress: userProgress[course.id] || 0
        })),
        downloadDate: new Date().toISOString()
    };

    const dataStr = JSON.stringify(progressData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `maichain-progress-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    showNotification('Progress data downloaded successfully!', 'success');
}


        function setupEventListeners() {
            // View toggle buttons
            document.querySelectorAll('.toggle-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const section = this.closest('.section');
                    const view = this.dataset.view;
                    
                    // Update button states
                    section.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    
                    // Toggle views
                    const grid = section.querySelector('.courses-grid');
                    const list = section.querySelector('.courses-list');
                    
                    if (view === 'grid') {
                        grid.classList.add('active');
                        list.classList.remove('active');
                    } else {
                        grid.classList.remove('active');
                        list.classList.add('active');
                    }
                });
            });

            // Floating Action Button - Sync Progress
            document.querySelector('.fab').addEventListener('click', syncProgress);

            // Profile avatar click handler
            document.getElementById('profileAvatar').addEventListener('click', toggleUserMenu);
        }

        function updateStats() {
            // Update enrolled courses count
            document.getElementById('enrolledCourses').textContent = enrolledCourses.length;
            
            // Calculate completion rate
            const totalProgress = enrolledCourses.reduce((sum, course) => sum + (userProgress[course.id] || 0), 0);
            const avgCompletion = enrolledCourses.length > 0 ? Math.round(totalProgress / enrolledCourses.length) : 0;
            document.getElementById('completionRate').textContent = `${avgCompletion}%`;

            // Calculate certificates earned (courses with 100% completion)
            const certificates = enrolledCourses.filter(course => (userProgress[course.id] || 0) >= 100).length;
            document.getElementById('certificatesEarned').textContent = certificates;

            // Calculate learning hours (estimated based on progress)
            const totalHours = enrolledCourses.reduce((sum, course) => {
                const progress = userProgress[course.id] || 0;
                const estimatedHours = course.modules * 2; // 2 hours per module estimate
                return sum + (estimatedHours * progress / 100);
            }, 0);
            document.getElementById('learningHours').textContent = `${Math.round(totalHours)}h`;
        }

        // Course action functions
        function enrollCourse(courseId) {
            const course = coursesData.find(c => c.id === courseId);
            if (!course) return;

            // Animate the enrollment
            showNotification(`Enrolling in ${course.title}...`, 'info');
            
            setTimeout(() => {
                course.enrolled = true;
                enrolledCourses = coursesData.filter(c => c.enrolled);
                userProgress[courseId] = 0; // Initialize progress
                
                renderEnrolledCourses();
                renderAvailableCourses();
                updateStats();
                saveUserProgress();
                
                showNotification(`Successfully enrolled in ${course.title}!`, 'success');
            }, 1000);
        }

        function continueCourse(courseId) {
    if (!checkAuth()) return;
    
    const course = coursesData.find(c => c.id === courseId);
    if (!course) return;

    showNotification(`Continuing ${course.title}...`, 'info');
    
    setTimeout(() => {
        const currentProgress = userProgress[courseId] || 0;
        const newProgress = Math.min(100, currentProgress + 10);
        userProgress[courseId] = newProgress;
        
        renderEnrolledCourses();
        updateStats();
        saveUserProgress();
        
        if (newProgress >= 100) {
            showNotification(`Congratulations! You've completed ${course.title}!`, 'success');
        } else {
            showNotification(`Progress updated: ${newProgress}%`, 'success');
        }
    }, 500);
}

        function viewCourseDetails(courseId) {
            const course = coursesData.find(c => c.id === courseId);
            if (!course) return;

            // Create and show course details modal
            showCourseModal(course);
        }

        function showCourseModal(course) {
            const progress = userProgress[course.id] || 0;
            const isEnrolled = course.enrolled;
            
            const modalHTML = `
                <div class="modal-overlay" id="courseModal">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h2>${course.title}</h2>
                            <button class="modal-close" onclick="closeCourseModal()">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="modal-body">
                            <div class="course-detail-track">
                                <span class="course-track track-${course.track.toLowerCase()}">${course.track}</span>
                                <span class="level-badge level-${course.level}">${course.level}</span>
                            </div>
                            <p class="course-detail-description">${course.description}</p>
                            <div class="course-detail-meta">
                                <div class="meta-item">
                                    <i class="fas fa-clock"></i>
                                    <span>Duration: ${course.duration}</span>
                                </div>
                                <div class="meta-item">
                                    <i class="fas fa-book"></i>
                                    <span>Modules: ${course.modules}</span>
                                </div>
                                <div class="meta-item">
                                    <i class="fas fa-users"></i>
                                    <span>Level: ${course.level}</span>
                                </div>
                            </div>
                            ${isEnrolled ? `
                                <div class="course-progress-detail">
                                    <h4>Your Progress</h4>
                                    <div class="progress-bar large">
                                        <div class="progress-fill" style="width: ${progress}%"></div>
                                    </div>
                                    <div class="progress-stats">
                                        <span>${progress}% Complete</span>
                                        <span>${Math.round(course.modules * progress / 100)} / ${course.modules} modules</span>
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                        <div class="modal-footer">
                            ${isEnrolled ? 
                                `<button class="btn btn-primary" onclick="continueCourse(${course.id}); closeCourseModal();">
                                    <i class="fas fa-play"></i> Continue Learning
                                </button>` :
                                `<button class="btn btn-primary" onclick="enrollCourse(${course.id}); closeCourseModal();">
                                    <i class="fas fa-plus"></i> Enroll Now
                                </button>`
                            }
                            <button class="btn btn-secondary" onclick="closeCourseModal()">Close</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHTML);
            document.body.style.overflow = 'hidden';
        }

        function closeCourseModal() {
            const modal = document.getElementById('courseModal');
            if (modal) {
                modal.remove();
                document.body.style.overflow = 'auto';
            }
        }

        function hideLoading() {
            const loadingScreen = document.getElementById('loadingScreen');
            loadingScreen.style.display = 'none';
        }
            
        function syncProgress() {
            showNotification('Syncing progress...', 'info');
            
            // Simulate sync with backend
            setTimeout(() => {
                // For demo, randomly update some progress
                enrolledCourses.forEach(course => {
                    if (Math.random() > 0.7) { // 30% chance to update
                        const currentProgress = userProgress[course.id] || 0;
                        const increment = Math.floor(Math.random() * 15) + 5; // 5-20% increment
                        userProgress[course.id] = Math.min(100, currentProgress + increment);
                    }
                });

                renderEnrolledCourses();
                updateStats();
                saveUserProgress();
                showNotification('Progress synced successfully!', 'success');
            }, 2000);
        }

       /** function toggleUserMenu() {
            // Simple user menu toggle (could be expanded)
            showNotification('User profile feature coming soon!', 'info');
        }**/

        function showNotification(message, type = 'info') {
            // Remove existing notifications
            const existingNotifications = document.querySelectorAll('.notification');
            existingNotifications.forEach(n => n.remove());

            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.innerHTML = `
                <div class="notification-content">
                    <i class="fas fa-${getNotificationIcon(type)}"></i>
                    <span>${message}</span>
                </div>
            `;

            document.body.appendChild(notification);

            // Show notification
            setTimeout(() => notification.classList.add('show'), 100);

            // Hide notification after 3 seconds
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }

        function getNotificationIcon(type) {
            switch (type) {
                case 'success': return 'check-circle';
                case 'error': return 'exclamation-circle';
                case 'warning': return 'exclamation-triangle';
                default: return 'info-circle';
            }
        }

        // Utility functions
        function debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }

        // Search functionality (can be added to header)
        function searchCourses(query) {
            if (!query) {
                renderAvailableCourses();
                renderEnrolledCourses();
                return;
            }

            const filteredCourses = coursesData.filter(course => 
                course.title.toLowerCase().includes(query.toLowerCase()) ||
                course.description.toLowerCase().includes(query.toLowerCase()) ||
                course.track.toLowerCase().includes(query.toLowerCase())
            );

            const filteredEnrolled = filteredCourses.filter(c => c.enrolled);
            const filteredAvailable = filteredCourses.filter(c => !c.enrolled);

            // Update display with filtered results
            const enrolledGrid = document.getElementById('enrolledCoursesGrid');
            const enrolledList = document.getElementById('enrolledCoursesList');
            const availableGrid = document.getElementById('availableCoursesGrid');
            const availableList = document.getElementById('availableCoursesList');

            enrolledGrid.innerHTML = filteredEnrolled.map(course => createCourseCard(course, true)).join('');
            enrolledList.innerHTML = filteredEnrolled.map(course => createCourseListItem(course, true)).join('');
            availableGrid.innerHTML = filteredAvailable.map(course => createCourseCard(course, false)).join('');
            availableList.innerHTML = filteredAvailable.map(course => createCourseListItem(course, false)).join('');
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            // Press 'S' to sync progress
            if (e.key.toLowerCase() === 's' && !e.ctrlKey && !e.metaKey) {
                const activeElement = document.activeElement;
                if (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    syncProgress();
                }
            }
            
            // Press Escape to close modals
            if (e.key === 'Escape') {
                closeCourseModal();
            }
        });

        // Responsive design handler
        window.addEventListener('resize', debounce(() => {
            // Handle responsive changes if needed
            updateLayout();
        }, 150));

        function updateLayout() {
    const isMobile = window.innerWidth <= 768;
    const isTablet = window.innerWidth <= 1024;
    
    if (isMobile) {
        // Force list view on mobile
        document.querySelectorAll('.courses-grid.active').forEach(grid => {
            grid.classList.remove('active');
            grid.parentElement.querySelector('.courses-list').classList.add('active');
            
            const section = grid.closest('.section');
            section.querySelectorAll('.toggle-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.view === 'list');
            });
        });
        
        // Hide view toggle on mobile
        document.querySelectorAll('.view-toggle').forEach(toggle => {
            toggle.style.display = 'none';
        });
    } else {
        // Show view toggle on desktop/tablet
        document.querySelectorAll('.view-toggle').forEach(toggle => {
            toggle.style.display = 'flex';
        });
    }
    
    // Adjust stats grid for mobile
    const statsGrid = document.querySelector('.stats-grid');
    if (statsGrid) {
        if (isMobile) {
            statsGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
        } else if (isTablet) {
            statsGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
        } else {
            statsGrid.style.gridTemplateColumns = 'repeat(4, 1fr)';
        }
    }
}

// NEW: Enhanced search with filters
function searchCourses(query, filters = {}) {
    if (!query && Object.keys(filters).length === 0) {
        renderAvailableCourses();
        renderEnrolledCourses();
        return;
    }

    let filteredCourses = coursesData;

    // Text search
    if (query) {
        filteredCourses = filteredCourses.filter(course => 
            course.title.toLowerCase().includes(query.toLowerCase()) ||
            course.description.toLowerCase().includes(query.toLowerCase()) ||
            course.track.toLowerCase().includes(query.toLowerCase())
        );
    }

    // Apply filters
    if (filters.track) {
        filteredCourses = filteredCourses.filter(course => 
            course.track.toLowerCase() === filters.track.toLowerCase()
        );
    }

    if (filters.level) {
        filteredCourses = filteredCourses.filter(course => 
            course.level.toLowerCase() === filters.level.toLowerCase()
        );
    }

    const filteredEnrolled = filteredCourses.filter(c => c.enrolled);
    const filteredAvailable = filteredCourses.filter(c => !c.enrolled);

    // Update display
    const enrolledGrid = document.getElementById('enrolledCoursesGrid');
    const enrolledList = document.getElementById('enrolledCoursesList');
    const availableGrid = document.getElementById('availableCoursesGrid');
    const availableList = document.getElementById('availableCoursesList');

    enrolledGrid.innerHTML = filteredEnrolled.map(course => createCourseCard(course, true)).join('');
    enrolledList.innerHTML = filteredEnrolled.map(course => createCourseListItem(course, true)).join('');
    availableGrid.innerHTML = filteredAvailable.map(course => createCourseCard(course, false)).join('');
    availableList.innerHTML = filteredAvailable.map(course => createCourseListItem(course, false)).join('');
}

        // Initialize layout on load
        window.addEventListener('load', updateLayout);