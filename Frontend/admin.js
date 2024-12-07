const adminToken = localStorage.getItem("token");
const userListContainer = document.getElementById("user-list");
const adminMessagesContainer = document.getElementById("admin-messages");
const filterBySelect = document.getElementById("filter-by");
const sortOrderSelect = document.getElementById("sort-order");
const applyFiltersButton = document.getElementById("apply-filters");
const usersButton = document.querySelector("#users-button");
const userList = document.querySelector("#user-list");
const messagesPagination = document.querySelector("#messages-pagination");

const BASE_URL = "https://mai.fly.dev";

if (!adminToken) {
  console.error("No token found in localStorage");
  alert("You need to log in as an admin to access this page.");
  window.location.href = "https://mai-psi.vercel.app"; // Redirect to login if no token is found
}

console.log("Admin Token:", adminToken);

// Fetch and display users
async function fetchUsers() {
  const sortBy = filterBySelect.value;
  const order = sortOrderSelect.value;
  const minBalance = document.getElementById("min-balance").value;
  const maxBalance = document.getElementById("max-balance").value;
  const minReferrals = document.getElementById("min-referrals").value;
  const maxReferrals = document.getElementById("max-referrals").value;

  try {
    const queryParams = new URLSearchParams({
      sortBy,
      order,
      minBalance,
      maxBalance,
      minReferrals,
      maxReferrals,
    });

    const response = await fetch(`${BASE_URL}/api/admin/users?${queryParams}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    const data = await response.json();

    if (data.success) {
      userListContainer.innerHTML = data.users
        .map(
          (user) => `
          <div class="user">
            <p><strong>${user.name}</strong></p>
            <p>Email: ${user.email}</p>
            <p>Balance: ${user.balance} | Referrals: ${user.referralCount}</p>
            <p>Status: ${user.isSuspended ? "Suspended" : "Active"}</p>
            <div class="user-actions">
              <button onclick="editUser('${user._id}')">Edit</button>
              <button onclick="toggleSuspension('${user._id}', ${!user.isSuspended})">
                ${user.isSuspended ? "Unsuspend" : "Suspend"}
              </button>
              <button onclick="resetPassword('${user._id}')">Reset Password</button>
            </div>
          </div>
        `
        )
        .join("");

      const totalUsersContainer = document.getElementById("total-users");
      totalUsersContainer.textContent = `Total Users: ${data.totalUsers}`;
    } else {
      alert(data.message || "Failed to fetch users.");
    }
  } catch (error) {
    console.error("Error fetching users:", error.message);
  }
}

// Reset a user's password
async function resetPassword(userId) {
  const newPassword = prompt("Enter the new password:");
  if (!newPassword) return;

  try {
    const response = await fetch(`${BASE_URL}/api/admin/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ userId, newPassword }),
    });

    const data = await response.json();
    if (data.success) {
      alert("Password reset successfully!");
    } else {
      alert(`Error: ${data.message}`);
    }
  } catch (error) {
    console.error("Error resetting password:", error.message);
  }
}

// Toggle a user's suspension status
async function toggleSuspension(userId, isSuspended) {
  const confirmation = confirm(
    `Are you sure you want to ${isSuspended ? "suspend" : "unsuspend"} this user?`
  );
  if (!confirmation) return;

  try {
    const response = await fetch(`${BASE_URL}/api/admin/suspend`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ userId, isSuspended }),
    });

    const data = await response.json();
    if (data.success) {
      alert(data.message);
      fetchUsers(); // Refresh the user list
    } else {
      alert(`Error: ${data.message}`);
    }
  } catch (error) {
    console.error("Error toggling suspension:", error.message);
  }
}

// Edit a user's details
async function editUser(userId) {
  const name = prompt("Enter new name (leave blank to keep current):");
  const email = prompt("Enter new email (leave blank to keep current):");
  const balance = prompt("Enter new balance (leave blank to keep current):");

  try {
    const response = await fetch(`${BASE_URL}/api/admin/edit`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ userId, name, email, balance: balance ? parseFloat(balance) : undefined }),
    });

    const data = await response.json();
    if (data.success) {
      alert(data.message);
      fetchUsers(); // Refresh the user list
    } else {
      alert(`Error: ${data.message}`);
    }
  } catch (error) {
    console.error("Error editing user:", error.message);
  }
}

// Fetch admin messages
async function fetchAdminMessages(page = 1) {
  console.log(`Fetching messages for page ${page}...`);

  try {
    const response = await fetch(
      `${BASE_URL}/api/messages/admin/messages?page=${page}`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    const data = await response.json();

    if (data.success) {
      adminMessagesContainer.innerHTML = data.messages
        .map(
          (msg) => `
          <div class="message ${msg.sender}">
            <p>${msg.message}</p>
            <small>${msg.sender === "user" ? "User" : "Admin"} | ${new Date(
              msg.timestamp
            ).toLocaleString()}</small>
          </div>
        `
        )
        .join("");

      updatePagination(data.pagination); // Update pagination UI
    } else {
      console.error("Error fetching admin messages:", data.message);
      alert(data.message || "Failed to fetch messages.");
    }
  } catch (error) {
    console.error("Error fetching admin messages:", error.message);
  }
}

// Update pagination UI
function updatePagination({ page, totalPages }) {
  messagesPagination.innerHTML = `
    <button ${page === 1 ? "disabled" : ""} onclick="fetchAdminMessages(${page - 1})">Previous</button>
    <span>Page ${page} of ${totalPages}</span>
    <button ${page === totalPages ? "disabled" : ""} onclick="fetchAdminMessages(${page + 1})">Next</button>
  `;
}

// Event listeners for toggling user list visibility and applying filters
usersButton.addEventListener("click", () => {
  userList.classList.toggle("hidden");
});
applyFiltersButton.addEventListener("click", fetchUsers);

// Initial fetches
fetchUsers();
fetchAdminMessages();