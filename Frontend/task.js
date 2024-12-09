const BASE_URL = "https://mai.fly.dev"; // Your backend URL
const token = localStorage.getItem("token");

// DOM Elements
const userMessageInput = document.getElementById("user-message");
const sendMessageButton = document.getElementById("send-message");
const userMessagesContainer = document.getElementById("user-messages");
const prevPageButton = document.getElementById("prev-page");
const nextPageButton = document.getElementById("next-page");

let currentPage = 1;

// Fetch user messages
async function fetchMessages(page = 1) {
  try {
    const response = await fetch(`${BASE_URL}/api/messages?page=${page}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();

    if (data.success) {
      userMessagesContainer.innerHTML = data.messages
        .map(
          (msg) => `
          <div class="message-container ${msg.sender}">
            <div class="message ${msg.sender}">
              <p class="message-text">${msg.message}</p>
              <small class="message-timestamp">${msg.sender === "user" ? "You" : "Admin"} | ${new Date(
                msg.timestamp
              ).toLocaleString()}</small>
            </div>
          </div>
        `
        )
        .join("");

      currentPage = page;
    } else {
      alert(data.message);
    }
  } catch (error) {
    console.error("Error fetching messages:", error.message);
  }
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
      alert("Message sent successfully!");
      userMessageInput.value = "";
      fetchMessages(currentPage);
    } else {
      alert(data.message);
    }
  } catch (error) {
    console.error("Error sending message:", error.message);
  }
});

// Pagination controls
prevPageButton.addEventListener("click", () => {
  if (currentPage > 1) fetchMessages(currentPage - 1);
});

nextPageButton.addEventListener("click", () => {
  fetchMessages(currentPage + 1);
});

// Initial Fetch
fetchMessages();

const backButton = document.getElementById("back-button");
if (backButton) {
  
  backButton.addEventListener("click", () => {
    window.location.href = "index.html";
  });
}