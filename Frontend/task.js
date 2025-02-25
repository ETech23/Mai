const BASE_URL = "https://mai.fly.dev"; // Backend URL
const token = localStorage.getItem("token");

// DOM Elements
const userMessageInput = document.getElementById("user-message");
const sendMessageButton = document.getElementById("send-message");
const userMessagesContainer = document.getElementById("user-messages");
const prevPageButton = document.getElementById("prev-page");
const nextPageButton = document.getElementById("next-page");

let currentPage = 1;

// Fetch user messages (sorted in descending order)
async function fetchMessages(page = 1) {
  console.log("Fetching messages on page load..."); // Debugging step

  try {
    const response = await fetch(`${BASE_URL}/api/messages?page=${page}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success) {
      const sortedMessages = data.messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      userMessagesContainer.innerHTML = data.messages
  .map(
    (msg) => `
      <div class="message-container ${msg.sender === "user" ? "sent-container" : "received-container"}">
        <div class="message ${msg.sender === "user" ? "sent" : "received"}">
          <p>${msg.message}</p>
          <span class="timestamp">${new Date(msg.timestamp).toLocaleTimeString()}</span>
        </div>
      </div>
    `
  )
  .join("");

      scrollToBottom();
      currentPage = page;
    } else {
      alert(data.message);
    }
  } catch (error) {
    console.error("Error fetching messages:", error);
  }
}

// Scroll to latest message
function scrollToBottom() {
  userMessagesContainer.scrollTop = userMessagesContainer.scrollHeight;
}

// Send a message
sendMessageButton.addEventListener("click", async () => {
  const message = userMessageInput.value.trim();
  if (!message) return alert("Please enter a message.");

  try {
    const response = await fetch(`${BASE_URL}/api/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message }),
    });

    const data = await response.json();

    if (data.success) {
      userMessageInput.value = "";
      fetchMessages(currentPage); // Fetch messages again after sending
    } else {
      alert(data.message);
    }
  } catch (error) {
    console.error("Error sending message:", error);
  }
});

// Pagination controls
prevPageButton?.addEventListener("click", () => {
  if (currentPage > 1) fetchMessages(currentPage - 1);
});

nextPageButton?.addEventListener("click", () => {
  fetchMessages(currentPage + 1);
});

// Ensure messages load on page load
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded, fetching messages...");
  fetchMessages();
});

// Back Button
document.getElementById("back-button")?.addEventListener("click", () => {
  window.location.href = "index.html";
});