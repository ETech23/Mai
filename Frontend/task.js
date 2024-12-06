document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");

  // Redirect to login if the token is missing
  if (!token) {
    alert("You must be logged in to access this page.");
    window.location.href = "https://mai-psi.vercel.app";
    return;
  }

  // Optionally verify the token with the backend
  validateToken(token);
});

// Function to validate the token (optional)
async function validateToken(token) {
  try {
    const response = await fetch("https://mai.fly.dev/api/auth/validate", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error("Invalid token");
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error("Token validation failed:", error.message);
    alert("Your session has expired. Please log in again.");
    localStorage.removeItem("token");
    window.location.href = "https://mai-psi.vercel.app";
  }
}

const contactForm = document.getElementById("contactForm");
const messagesList = document.getElementById("messagesList");
const token = localStorage.getItem("token");

// Fetch user's chat history
async function fetchMessages() {
  try {
    const response = await fetch("/api/messages", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();

    if (data.success) {
      messagesList.innerHTML = ""; // Clear current messages
      data.messages.forEach((msg) => {
        const li = document.createElement("li");
        li.textContent = `${msg.sender}: ${msg.message} (${new Date(msg.timestamp).toLocaleString()})`;
        messagesList.appendChild(li);
      });
    }
  } catch (error) {
    console.error("Error fetching messages:", error);
  }
}

// Submit a new message
contactForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const userMessage = document.getElementById("userMessage").value;

  try {
    const response = await fetch("/api/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message: userMessage }),
    });

    const data = await response.json();
    if (data.success) {
      document.getElementById("userMessage").value = ""; // Clear the textarea
      fetchMessages(); // Refresh messages
    } else {
      alert("Error sending message. Please try again.");
    }
  } catch (error) {
    console.error("Error sending message:", error);
  }
});

// Fetch messages on page load
fetchMessages();