const BASE_URL = "https://mai.fly.dev"; // Replace with your backend URL
const token = localStorage.getItem("token");

// Fetch and display all users
async function fetchUsers() {
  try {
    const response = await fetch(`${BASE_URL}/api/admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();

    if (data.success) {
      const tbody = document.querySelector("#user-table tbody");
      tbody.innerHTML = data.users
        .map(
          (user) => `
          <tr>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.balance} MAI</td>
            <td>${user.isSuspended ? "Suspended" : "Active"}</td>
            <td>
              <button onclick="sendMessage('${user._id}')">Send Message</button>
              <button onclick="resetPassword('${user._id}')">Reset Password</button>
              <button onclick="toggleSuspension('${user._id}', ${!user.isSuspended})">
                ${user.isSuspended ? "Unsuspend" : "Suspend"}
              </button>
              <button onclick="editUser('${user._id}')">Edit Details</button>
            </td>
          </tr>
        `
        )
        .join("");
    } else {
      console.error("Error loading users:", data.message);
    }
  } catch (error) {
    console.error("Error fetching users:", error.message);
  }
}

// Send a message to a user
async function sendMessage(userId) {
  const message = prompt("Enter your message:");
  if (!message) return;

  try {
    const response = await fetch(`${BASE_URL}/api/admin/message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userId, message }),
    });

    const data = await response.json();
    if (data.success) {
      alert("Message sent successfully!");
    } else {
      alert(`Error: ${data.message}`);
    }
  } catch (error) {
    console.error("Error sending message:", error.message);
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
        Authorization: `Bearer ${token}`,
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

// Suspend or Unsuspend a User
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
        Authorization: `Bearer ${token}`,
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

// Edit a User's Details
async function editUser(userId) {
  const name = prompt("Enter new name (leave blank to keep current):");
  const email = prompt("Enter new email (leave blank to keep current):");
  const balance = prompt("Enter new balance (leave blank to keep current):");

  try {
    const response = await fetch(`${BASE_URL}/api/admin/edit`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        userId,
        name,
        email,
        balance: balance ? parseFloat(balance) : undefined,
      }),
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

// Initial call to fetch users
fetchUsers();