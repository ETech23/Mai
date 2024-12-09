const BASE_URL = "https://mai.fly.dev";
const adminToken = localStorage.getItem("token");

if (!adminToken) {
  alert("Unauthorized access! Redirecting to login.");
  window.location.href = "/login";
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

// Fetch users with filters and pagination
async function fetchUsers() {
  const queryParams = new URLSearchParams({
    page: userPage,
    minBalance: minBalanceInput.value,
    maxBalance: maxBalanceInput.value,
    minReferrals: minReferralsInput.value,
    maxReferrals: maxReferralsInput.value,
  });

  try {
    const data = await apiRequest(`/api/admin/users?${queryParams}`);
    renderUsers(data.users, data.totalUsers);
  } catch (error) {
    console.error("Error fetching users:", error.message);
    alert("Failed to fetch users.");
  }
}

// Render users in the UI
function renderUsers(users, totalUsers) {
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
  totalUsersElement.textContent = `Total Users: ${totalUsers}`;
}

// Suspend or unsuspend a user
async function toggleSuspension(userId, isSuspended) {
  if (!confirm(`Are you sure you want to ${isSuspended ? "suspend" : "unsuspend"} this user?`)) return;

  try {
    const data = await apiRequest("/api/admin/suspend", "POST", { userId, isSuspended });
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
    const data = await apiRequest("/api/admin/reset-password", "POST", { userId, newPassword });
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
    const data = await apiRequest("/api/admin/edit", "PUT", {
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

// Render messages in the UI
function renderMessages(messages) {
  messageListContainer.innerHTML = messages
    .map(
      (msg) => `
      <div class="item">
        <p>${msg.message}</p>
        <p><small>${msg.sender === "user" ? "User" : "Admin"} | ${new Date(msg.timestamp).toLocaleString()}</small></p>
        <button onclick="respondToMessage('${msg._id}', '${msg.userId}')">Respond</button>
      </div>
    `
    )
    .join("");
}

// Respond to a message
async function respondToMessage(messageId, userId) {
  const response = prompt("Enter your response:");
  if (!response) return;

  try {
    const data = await apiRequest("/api/admin/respond", "POST", { messageId, userId, response });
    alert(data.message);
    fetchMessages();
  } catch (error) {
    console.error("Error responding to message:", error.message);
    alert("Failed to send response.");
  }
}

// Event Listeners
applyFiltersButton.addEventListener("click", fetchUsers);
backButton.addEventListener("click", () => window.history.back());

// Initial Fetch
fetchUsers();
fetchMessages();