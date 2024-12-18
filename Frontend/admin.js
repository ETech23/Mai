const BASE_URL = "https://mai.fly.dev";
const adminToken = localStorage.getItem("token");

if (!adminToken) {
  alert("Unauthorized access! Redirecting to login.");
  window.location.href = "./index.html";
}

// Elements
const userListContainer = document.getElementById("user-list");
const messageListContainer = document.getElementById("message-list");
const totalUsersElement = document.getElementById("total-users");
const minBalanceInput = document.getElementById("min-balance");
const maxBalanceInput = document.getElementById("max-balance");
const minReferralsInput = document.getElementById("min-referrals");
const maxReferralsInput = document.getElementById("max-referrals");
const applyFiltersButton = document.getElementById("apply-filters");
const backButton = document.getElementById("back-button");

let userPage = 1;
let messagePage = 1;

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

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }
  return data;
}

// Fetch users
async function fetchUsers(page = 1) {
  const queryParams = new URLSearchParams({
    page: page.toString(), // Ensure page is passed as a string
    minBalance: minBalanceInput.value || "", // Use empty string if no value
    maxBalance: maxBalanceInput.value || "",
    minReferrals: minReferralsInput.value || "",
    maxReferrals: maxReferralsInput.value || "",
  });

  try {
    const data = await apiRequest(`/api/admin/users?${queryParams}`);
    renderUsers(data.users, data.pagination);
  } catch (error) {
    console.error("Error fetching users:", error.message);
    alert("Failed to fetch users.");
  }
}

// Render users and pagination controls in the UI
function renderUsers(users, pagination) {
  // Render user list
  userListContainer.innerHTML = users
    .map(
      (user) => `
      <div class="item">
        <p><strong>${user.name}</strong> (${user.email})</p>
        <p>Balance: ${user.balance} | Referrals: ${user.referralCount}</p>
        <p>Status: ${user.isSuspended ? "Suspended" : "Active"}</p>
        <button onclick="toggleSuspension('${user._id}', ${!user.isSuspended})">
          ${user.isSuspended ? "Unsuspend" : "Suspend"}
        </button>
        <button onclick="resetPassword('${user._id}')">Reset Password</button>
        <button onclick="editUser('${user._id}')">Edit Details</button>
      </div>
    `
    )
    .join("");

  // Update total users count
  totalUsersElement.textContent = `Total Users: ${pagination.total}`;

  // Render Next and Previous buttons
  renderPagination(pagination);
}

// Render pagination controls (Next/Previous)
const paginationContainer = document.getElementById("user-pagination")
function renderPagination({ page, totalPages }) {
  paginationContainer.innerHTML = ""; // Clear existing buttons

  // Set container class for styling
  paginationContainer.className = "pagination-container";

  // Previous button
  const prevButton = document.createElement("button");
  prevButton.textContent = "Previous";
  prevButton.disabled = page === 1;
  prevButton.onclick = () => fetchUsers(page - 1);
  prevButton.className = "pagination-button"; // Add a class for consistent styling
  paginationContainer.appendChild(prevButton);

  // Next button
  const nextButton = document.createElement("button");
  nextButton.textContent = "Next";
  nextButton.disabled = page === totalPages;
  nextButton.onclick = () => fetchUsers(page + 1);
  nextButton.className = "pagination-button"; // Add a class for consistent styling
  paginationContainer.appendChild(nextButton);
}

// Suspend or unsuspend a user
async function toggleSuspension(userId, isSuspended) {
  if (!confirm(`Are you sure you want to ${isSuspended ? "suspend" : "unsuspend"} this user?`)) return;

  try {
    const data = await apiRequest("/api/admin/users/suspend", "POST", { userId, isSuspended });
    alert(data.message);
    fetchUsers();
  } catch (error) {
    console.error("Error toggling suspension:", error.message);
    alert("Failed to toggle suspension.");
  }
}

// Reset user password
async function resetPassword(userId) {
  const newPassword = prompt("Enter the new password:");
  if (!newPassword) return;

  try {
    const data = await apiRequest("/api/admin/users/reset-password", "POST", { userId, newPassword });
    alert(data.message);
  } catch (error) {
    console.error("Error resetting password:", error.message);
    alert("Failed to reset password.");
  }
}

// Edit user details
async function editUser(userId) {
  const name = prompt("Enter new name (leave blank to keep current):");
  const email = prompt("Enter new email (leave blank to keep current):");
  const balance = prompt("Enter new balance (leave blank to keep current):");

  try {
    const data = await apiRequest("/api/admin/users/edit", "PUT", {
      userId,
      name,
      email,
      balance: balance ? parseFloat(balance) : undefined,
    });
    alert(data.message);
    fetchUsers();
  } catch (error) {
    console.error("Error editing user:", error.message);
    alert("Failed to edit user details.");
  }
}

// Fetch messages with pagination
async function fetchMessages() {
  try {
    const data = await apiRequest(`/api/admin/messages?page=${messagePage}`);
    renderMessages(data.messages);
  } catch (error) {
    console.error("Error fetching messages:", error.message);
    alert("Failed to fetch messages.");
  }
}

// Fetch messages with pagination
async function fetchMessages(page = 1) {
  try {
    const data = await apiRequest(`/api/admin/messages?page=${page}`);
    renderMessages(data.messages, page, data.totalPages); // Pass pagination data
  } catch (error) {
    console.error("Error fetching messages:", error.message);
    alert("Failed to fetch messages.");
  }
}

// Render messages in the UI with pagination (Previous and Next buttons)
function renderMessages(messages, page, totalPages) {
  messageListContainer.innerHTML = messages
    .map(
      (msg) => `
      <div class="item">
        <p><strong>${msg.userId?.username || "Unknown User"}</strong>: ${msg.message}</p>
        <p><small>${msg.sender === "user" ? "User" : "Admin"} | ${new Date(msg.timestamp).toLocaleString()}</small></p>
        <button onclick="respondToMessage('${msg._id}', '${msg.userId?._id}')">Respond</button>
      </div>
    `
    )
    .join("");

  renderMessagePagination(page, totalPages); // Call renderPagination for messages
}

// Render message pagination buttons (Previous and Next)
function renderMessagePagination(page, totalPages) {
  const paginationContainer = document.getElementById('message-pagination');
  paginationContainer.innerHTML = ""; // Clear existing buttons

  // Previous button
  const prevButton = document.createElement("button");
  prevButton.textContent = "Previous";
  prevButton.disabled = page === 1;
  prevButton.onclick = () => fetchMessages(page - 1);
  prevButton.className = "pagination-button"; // Add a class for consistent styling
  paginationContainer.appendChild(prevButton);

  // Next button
  const nextButton = document.createElement("button");
  nextButton.textContent = "Next";
  nextButton.disabled = page === totalPages;
  nextButton.onclick = () => fetchMessages(page + 1);
  nextButton.className = "pagination-button"; // Add a class for consistent styling
  paginationContainer.appendChild(nextButton);
}

// Respond to a message
async function respondToMessage(messageId, userId) {
  const response = prompt("Enter your response:");
  if (!response) return;

  try {
    const data = await apiRequest("/api/admin/messages/respond", "POST", { messageId, userId, response });
    alert(data.message);
    fetchMessages();
  } catch (error) {
    console.error("Error responding to message:", error.message);
    alert("Failed to send response.");
  }
}

// toggle visibilty
document.getElementById("message-section-title").addEventListener("click", function() {
  const messageSection = document.getElementById("message-section");

  // Toggle the display of the message section
  if (messageSection.style.display === "none" || messageSection.style.display === "") {
    messageSection.style.display = "block";
  } else {
    messageSection.style.display = "none";
  }
});

document.getElementById("user-section-title").addEventListener("click", function() {
  const userSection = document.getElementById("user-section");

  // Toggle the display of the user section
  if (userSection.style.display === "none" || userSection.style.display === "") {
    userSection.style.display = "block";
  } else {
    userSection.style.display = "none";
  }
});

// Event Listeners
applyFiltersButton.addEventListener("click", fetchUsers);
backButton.addEventListener("click", () => window.history.back());

// Initial Fetch
fetchUsers();
fetchMessages();