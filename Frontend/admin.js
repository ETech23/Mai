// Base URL and Authentication
const BASE_URL = "https://maicoin-41vo.onrender.com";
const adminToken = localStorage.getItem("token");

// Redirect if not authenticated
if (!adminToken) {
  alert("Unauthorized access! Redirecting to login.");
  window.location.href = "./index.html";
}

// DOM Elements
const userListContainer = document.getElementById("user-list");
const messageListContainer = document.getElementById("message-list");
const totalUsersElement = document.getElementById("total-users");
const activeUsersElement = document.getElementById("active-users");
const suspendedUsersElement = document.getElementById("suspended-users");
const minBalanceInput = document.getElementById("min-balance");
const maxBalanceInput = document.getElementById("max-balance");
const minReferralsInput = document.getElementById("min-referrals");
const maxReferralsInput = document.getElementById("max-referrals");
const applyFiltersButton = document.getElementById("apply-filters");
const resetFiltersButton = document.getElementById("reset-filters");
const toggleFiltersButton = document.getElementById("toggle-filters");
const filterPanel = document.querySelector(".filter-panel");
const userPaginationContainer = document.getElementById("user-pagination");
const messagePaginationContainer = document.getElementById("message-pagination");
const messageFilterSelect = document.getElementById("message-filter");
const logoutButton = document.getElementById("logout-button");

// Navigation and Section Management
const navItems = document.querySelectorAll(".nav-item");
const sections = document.querySelectorAll(".dashboard-section");

// Modal Elements
const responseModal = document.getElementById("response-modal");
const closeModalButton = document.querySelector(".close-modal");
const cancelButton = document.querySelector(".cancel-button");
const sendResponseButton = document.getElementById("send-response-button");
const modalUserName = document.getElementById("modal-user-name");
const modalMessageText = document.getElementById("modal-message-text");
const responseText = document.getElementById("response-text");

// State Management
let userPage = 1;
let messagePage = 1;
let currentMessageId = null;
let currentUserId = null;
let totalUserCount = 0;
let activeUserCount = 0;
let suspendedUserCount = 0;
let allUsers = [];

// Utility function for making API requests
async function apiRequest(endpoint, method = "GET", body = null) {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Something went wrong");
    }
    
    return data;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

// ===== USER MANAGEMENT FUNCTIONS =====

// Fetch all users to calculate proper stats
async function fetchAllUsers() {
  try {
    // Reset user counts
    allUsers = [];
    totalUserCount = 0;
    activeUserCount = 0;
    suspendedUserCount = 0;
    
    // Fetch first page to get pagination info
    const firstPageData = await apiRequest(`/api/admin/users?page=1`);
    const totalPages = firstPageData.pagination.totalPages;
    
    // Add first page users to our array
    allUsers = [...allUsers, ...firstPageData.users];
    
    // Fetch remaining pages
    const remainingRequests = [];
    for (let page = 2; page <= totalPages; page++) {
      remainingRequests.push(apiRequest(`/api/admin/users?page=${page}`));
    }
    
    const remainingResults = await Promise.all(remainingRequests);
    
    // Combine all users
    remainingResults.forEach(result => {
      allUsers = [...allUsers, ...result.users];
    });
    
    // Calculate correct stats
    calculateAndUpdateUserStats();
    
  } catch (error) {
    console.error("Error fetching all users:", error.message);
  }
}

// Fetch users with filters for current page view
async function fetchUsers(page = 1) {
  const queryParams = new URLSearchParams({ page: page.toString() });

  // Add filters if they exist
  if (minBalanceInput.value) queryParams.append("minBalance", minBalanceInput.value);
  if (maxBalanceInput.value) queryParams.append("maxBalance", maxBalanceInput.value);
  if (minReferralsInput.value) queryParams.append("minReferrals", minReferralsInput.value);
  if (maxReferralsInput.value) queryParams.append("maxReferrals", maxReferralsInput.value);

  try {
    const data = await apiRequest(`/api/admin/users?${queryParams}`);
    renderUsers(data.users, data.pagination);
    userPage = page;
    
    // If no filters are applied, fetch all users for accurate stats
    if (!minBalanceInput.value && !maxBalanceInput.value && 
        !minReferralsInput.value && !maxReferralsInput.value) {
      fetchAllUsers();
    }
  } catch (error) {
    console.error("Error fetching users:", error.message);
    alert("Failed to fetch users.");
  }
}

// Calculate user stats based on all users
function calculateAndUpdateUserStats() {
  // Total users is simply the length of all users
  totalUserCount = allUsers.length;
  
  // Active users are those whose balance has increased in the last day
  // Note: For demonstration, we'll consider users with balance > 0 as active
  // In a real implementation, you would track balance changes day-over-day
  activeUserCount = allUsers.filter(user => user.balance > 0).length;
  
  // Suspended users
  suspendedUserCount = allUsers.filter(user => user.isSuspended).length;
  
  // Update UI
  totalUsersElement.textContent = totalUserCount;
  activeUsersElement.textContent = activeUserCount;
  suspendedUsersElement.textContent = suspendedUserCount;
}

// Render users table in the UI
function renderUsers(users, pagination) {
  userListContainer.innerHTML = users.map(user => {
    const statusClass = user.isSuspended ? 'suspended' : 'active';
    const statusLabel = user.isSuspended ? 'Suspended' : 'Active';
    
    return `
      <tr>
        <td>${user.name || "N/A"}</td>
        <td>${user.email || "N/A"}</td>
        <td>${user.balance || 0}</td>
        <td>${user.referralCount || 0}</td>
        <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
        <td class="actions-cell">
          <button class="icon-button" onclick="toggleSuspension('${user._id}', ${!user.isSuspended})">
            <i class="fas fa-${user.isSuspended ? 'unlock' : 'ban'}"></i>
          </button>
          <button class="icon-button" onclick="resetPassword('${user._id}')">
            <i class="fas fa-key"></i>
          </button>
          <button class="icon-button" onclick="editUser('${user._id}')">
            <i class="fas fa-edit"></i>
          </button>
        </td>
      </tr>
    `;
  }).join("");

  renderUserPagination(pagination);
}

// Render pagination for users table
function renderUserPagination(pagination) {
  if (!pagination) return;
  
  const { page, totalPages } = pagination;
  userPaginationContainer.innerHTML = "";

  // Previous button
  const prevButton = document.createElement("button");
  prevButton.className = "pagination-button";
  prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
  prevButton.disabled = page <= 1;
  prevButton.onclick = () => fetchUsers(page - 1);
  userPaginationContainer.appendChild(prevButton);

  // Page indicator
  const pageIndicator = document.createElement("span");
  pageIndicator.className = "page-indicator";
  pageIndicator.textContent = `Page ${page} of ${totalPages}`;
  userPaginationContainer.appendChild(pageIndicator);

  // Next button
  const nextButton = document.createElement("button");
  nextButton.className = "pagination-button";
  nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
  nextButton.disabled = page >= totalPages;
  nextButton.onclick = () => fetchUsers(page + 1);
  userPaginationContainer.appendChild(nextButton);
}

// Toggle user suspension status
async function toggleSuspension(userId, isSuspended) {
  if (!confirm(`Are you sure you want to ${isSuspended ? "suspend" : "unsuspend"} this user?`)) return;

  try {
    const data = await apiRequest("/api/admin/users/suspend", "POST", { userId, isSuspended });
    alert(data.message || "User status updated successfully");
    fetchUsers(userPage);
    // Update all users to reflect changes in stats
    fetchAllUsers();
  } catch (error) {
    alert(`Failed to update user status: ${error.message}`);
  }
}

// Reset user password
async function resetPassword(userId) {
  const newPassword = prompt("Enter the new password:");
  if (!newPassword) return;

  try {
    const data = await apiRequest("/api/admin/users/reset-password", "POST", { userId, newPassword });
    alert(data.message || "Password reset successful");
  } catch (error) {
    alert(`Failed to reset password: ${error.message}`);
  }
}

// Edit user details
async function editUser(userId) {
  const name = prompt("Enter new name (leave blank to keep current):");
  const email = prompt("Enter new email (leave blank to keep current):");
  const balance = prompt("Enter new balance (leave blank to keep current):");

  // Prepare update data, only including fields that were provided
  const updateData = { userId };
  if (name !== null && name !== "") updateData.name = name;
  if (email !== null && email !== "") updateData.email = email;
  if (balance !== null && balance !== "") updateData.balance = parseFloat(balance);

  try {
    const data = await apiRequest("/api/admin/users/edit", "PUT", updateData);
    alert(data.message || "User updated successfully");
    fetchUsers(userPage);
    // Update all users to reflect changes in stats
    fetchAllUsers();
  } catch (error) {
    alert(`Failed to update user: ${error.message}`);
  }
}

// Reset all user filters
function resetFilters() {
  minBalanceInput.value = "";
  maxBalanceInput.value = "";
  minReferralsInput.value = "";
  maxReferralsInput.value = "";
  
  // Fetch users with reset filters
  fetchUsers(1);
}

// ===== MESSAGE MANAGEMENT FUNCTIONS =====

// Fetch messages with filter options
async function fetchMessages(page = 1) {
  const filter = messageFilterSelect.value;
  const queryParams = new URLSearchParams({ 
    page: page.toString(),
    filter: filter !== "all" ? filter : ""
  });

  try {
    const data = await apiRequest(`/api/admin/messages?${queryParams}`);
    
    // Process messages to group by user and organize chronologically
    const processedMessages = processMessagesForDisplay(data.messages);
    
    renderMessages(processedMessages, data.pagination);
    messagePage = page;
  } catch (error) {
    console.error("Error fetching messages:", error.message);
    alert("Failed to fetch messages.");
  }
}

// Process messages to group by user and sort newest first
function processMessagesForDisplay(messages) {
  if (!messages || messages.length === 0) return [];
  
  // First, ensure we have user information
  messages = messages.map(message => {
    // If userId is an object (populated), we have the user info
    // If it's just an ID, try to find the user in our allUsers array
    if (typeof message.userId === 'string' || !message.userId?.name) {
      const userId = typeof message.userId === 'string' ? message.userId : message.userId?._id;
      const user = allUsers.find(u => u._id === userId);
      
      if (user) {
        message.userId = {
          _id: userId,
          name: user.name || "Unknown User"
        };
      } else {
        message.userId = {
          _id: userId || "unknown",
          name: "Unknown User"
        };
      }
    }
    return message;
  });
  
  // Group by userId
  const messagesByUser = {};
  messages.forEach(message => {
    const userId = message.userId._id;
    if (!messagesByUser[userId]) {
      messagesByUser[userId] = {
        userId: userId,
        userName: message.userId.name,
        messages: []
      };
    }
    messagesByUser[userId].messages.push(message);
  });
  
  // Sort messages within each group (newest first)
  Object.values(messagesByUser).forEach(group => {
    group.messages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  });
  
  // Convert to array and sort groups (user with most recent message first)
  const result = Object.values(messagesByUser);
  result.sort((a, b) => {
    const latestA = a.messages[0]?.timestamp || 0;
    const latestB = b.messages[0]?.timestamp || 0;
    return new Date(latestB) - new Date(latestA);
  });
  
  return result;
}

// Render messages in the UI
function renderMessages(messageGroups, pagination) {
  if (!messageGroups || messageGroups.length === 0) {
    messageListContainer.innerHTML = '<div class="empty-state">No messages found</div>';
    return;
  }

  messageListContainer.innerHTML = messageGroups.map(group => {
    // Get the newest message date for the header
    const latestMessage = group.messages[0];
    const latestDate = new Date(latestMessage.timestamp);
    const formattedLatestDate = latestDate.toLocaleDateString() + ' ' + latestDate.toLocaleTimeString();
    
    // Generate the collapsible message group
    return `
      <div class="message-group">
        <div class="message-group-header" onclick="toggleMessageGroup(this)">
          <div class="user-info">
            <i class="fas fa-user-circle"></i>
            <span class="user-name">${group.userName}</span>
            <span class="message-count">(${group.messages.length} messages)</span>
          </div>
          <div class="latest-message-date">Latest: ${formattedLatestDate}</div>
          <div class="expand-icon"><i class="fas fa-chevron-down"></i></div>
        </div>
        <div class="message-group-content">
          ${group.messages.map(message => {
            const date = new Date(message.timestamp);
            const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
            const messageClass = message.isRead ? 'read' : 'unread';
            
            return `
              <div class="message-item ${messageClass}">
                <div class="message-timestamp">${formattedDate}</div>
                <div class="message-body">
                  <p>${message.message}</p>
                </div>
                ${message.adminResponse ? `
                  <div class="admin-response">
                    <div class="response-header">Admin Response:</div>
                    <p>${message.adminResponse}</p>
                  </div>
                ` : ''}
                <div class="message-actions">
                  <button class="action-button" onclick="openResponseModal('${message._id}', '${message.userId._id}', '${group.userName}', '${message.message.replace(/'/g, "\\'")}')">
                    <i class="fas fa-reply"></i> ${message.adminResponse ? 'Respond Again' : 'Respond'}
                  </button>
                  <button class="action-button ${message.isRead ? 'active' : ''}" onclick="markAsRead('${message._id}', ${!message.isRead})">
                    <i class="fas fa-${message.isRead ? 'envelope' : 'envelope-open'}"></i> ${message.isRead ? 'Mark Unread' : 'Mark Read'}
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }).join("");

  renderMessagePagination(pagination);
}

// Toggle message group expansion
function toggleMessageGroup(header) {
  const content = header.nextElementSibling;
  const icon = header.querySelector('.expand-icon i');
  
  content.classList.toggle('expanded');
  
  if (content.classList.contains('expanded')) {
    icon.classList.remove('fa-chevron-down');
    icon.classList.add('fa-chevron-up');
  } else {
    icon.classList.remove('fa-chevron-up');
    icon.classList.add('fa-chevron-down');
  }
}

// Render pagination for messages
function renderMessagePagination(pagination) {
  if (!pagination) return;
  
  const { page, totalPages } = pagination;
  messagePaginationContainer.innerHTML = "";

  // Previous button
  const prevButton = document.createElement("button");
  prevButton.className = "pagination-button";
  prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
  prevButton.disabled = page <= 1;
  prevButton.onclick = () => fetchMessages(page - 1);
  messagePaginationContainer.appendChild(prevButton);

  // Page indicator
  const pageIndicator = document.createElement("span");
  pageIndicator.className = "page-indicator";
  pageIndicator.textContent = `Page ${page} of ${totalPages}`;
  messagePaginationContainer.appendChild(pageIndicator);

  // Next button
  const nextButton = document.createElement("button");
  nextButton.className = "pagination-button";
  nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
  nextButton.disabled = page >= totalPages;
  nextButton.onclick = () => fetchMessages(page + 1);
  messagePaginationContainer.appendChild(nextButton);
}

// Open response modal
function openResponseModal(messageId, userId, userName, messageText) {
  currentMessageId = messageId;
  currentUserId = userId;
  
  modalUserName.textContent = userName;
  modalMessageText.textContent = messageText;
  responseText.value = "";
  
  responseModal.classList.add("active");
}

// Close response modal
function closeResponseModal() {
  responseModal.classList.remove("active");
  currentMessageId = null;
  currentUserId = null;
}

// Send response to user message
async function sendResponse() {
  if (!currentMessageId || !currentUserId || !responseText.value.trim()) {
    alert("Please enter a response message.");
    return;
  }

  try {
    const data = await apiRequest("/api/admin/messages/respond", "POST", {
      messageId: currentMessageId,
      userId: currentUserId,
      response: responseText.value.trim()
    });
    
    alert(data.message || "Response sent successfully");
    closeResponseModal();
    fetchMessages(messagePage);
  } catch (error) {
    alert(`Failed to send response: ${error.message}`);
  }
}

// Mark message as read/unread
async function markAsRead(messageId, isRead) {
  try {
    const data = await apiRequest("/api/admin/messages/mark-read", "POST", {
      messageId,
      isRead
    });
    
    alert(data.message || "Message status updated");
    fetchMessages(messagePage);
  } catch (error) {
    alert(`Failed to update message status: ${error.message}`);
  }
}

// Mark all messages as read
async function markAllAsRead() {
  if (!confirm("Are you sure you want to mark all messages as read?")) return;
  
  try {
    const data = await apiRequest("/api/admin/messages/mark-all-read", "POST");
    alert(data.message || "All messages marked as read");
    fetchMessages(messagePage);
  } catch (error) {
    alert(`Failed to update messages: ${error.message}`);
  }
}

// ===== UI INTERACTION FUNCTIONS =====

// Toggle navigation sections
function toggleSection(sectionId) {
  // Hide all sections
  sections.forEach(section => {
    section.classList.remove("active");
  });
  
  // Deactivate all nav items
  navItems.forEach(item => {
    item.classList.remove("active");
  });
  
  // Show selected section
  const selectedSection = document.getElementById(sectionId);
  if (selectedSection) {
    selectedSection.classList.add("active");
  }
  
  // Activate corresponding nav item
  const selectedNavItem = document.querySelector(`.nav-item[data-section="${sectionId}"]`);
  if (selectedNavItem) {
    selectedNavItem.classList.add("active");
  }
  
  // Load section data if needed
  if (sectionId === "user-section") {
    fetchUsers(1);
  } else if (sectionId === "message-section") {
    fetchMessages(1);
  }
}

// Toggle filter panel visibility
function toggleFilterPanel() {
  filterPanel.classList.toggle("active");
}

// Log out the admin user
function logout() {
  if (confirm("Are you sure you want to log out?")) {
    localStorage.removeItem("token");
    window.location.href = "./index.html";
  }
}

// ===== EVENT LISTENERS =====

// Navigation
navItems.forEach(item => {
  item.addEventListener("click", () => {
    const sectionId = item.getAttribute("data-section");
    if (sectionId) {
      toggleSection(sectionId);
    }
  });
});

// User filters
applyFiltersButton.addEventListener("click", () => fetchUsers(1));
resetFiltersButton.addEventListener("click", resetFilters);
toggleFiltersButton.addEventListener("click", toggleFilterPanel);

// Message filters
messageFilterSelect.addEventListener("change", () => fetchMessages(1));

// Modal controls
closeModalButton.addEventListener("click", closeResponseModal);
cancelButton.addEventListener("click", closeResponseModal);
sendResponseButton.addEventListener("click", sendResponse);

// Logout 
logoutButton.addEventListener("click", logout);

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  // Start with user section active
  toggleSection("user-section");
  
  // Fetch all users for accurate stats
  fetchAllUsers();
  
  // Expose functions to global scope for inline button handlers
  window.toggleSuspension = toggleSuspension;
  window.resetPassword = resetPassword;
  window.editUser = editUser;
  window.openResponseModal = openResponseModal;
  window.markAsRead = markAsRead;
  window.markAllAsRead = markAllAsRead;
  window.toggleMessageGroup = toggleMessageGroup;
});
