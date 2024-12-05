
console.log("Stored Token:", localStorage.getItem("token"));

function handleTokenExpiry(response) {
  if (response.status === 403) {
    alert("Your session has expired. Please log in again.");
    localStorage.removeItem("token");
    window.location.href = "https://mai.fly.dev/api/auth/login"; // Redirect to login
  }
}

/**if (isLoggedIn()) {
  taskButton.addEventListener("click", () => {
    window.location.href = "https://mai.fly.dev/task.html"; // Absolute URL
  });
}**/

// Base URL for API
const BASE_URL = "https://mai.fly.dev";

const token = localStorage.getItem("token");
fetch(`${BASE_URL}/api/tasks/daily`, {
  headers: { Authorization: `Bearer ${token}` },
});

// Task functionality
const taskButton = document.getElementById("task-button");
const tasksContainer = document.getElementById("tasks-container");
const spinButton = document.getElementById("spin-btn");
const rewardDisplay = document.getElementById("reward");
const spinSphere = document.querySelector(".spin-sphere");
const spinResult = document.getElementById("spin-result");

// Function to check if the user is logged in
function isLoggedIn() {
  const token = localStorage.getItem("token");
  return token ? true : false;
}

// Show the task button only if the user is logged in
if (taskButton) {
  if (isLoggedIn()) {
    taskButton.classList.remove("hidden");
  } else {
    taskButton.classList.add("hidden");
  }

  // Handle button click to navigate to the tasks page
  taskButton.addEventListener("click", () => {
    window.location.href = "task.html";
  });
}

// Fetch Tasks from the API
async function fetchTasks() {
  const token = localStorage.getItem("token");
  if (!token) {
    tasksContainer.innerHTML = `<p>Please log in to view your tasks.</p>`;
    console.error("No token found in localStorage.");
    return;
  }

  console.log("Fetching tasks with token:", token);

  try {
    const response = await fetch(`${BASE_URL}/api/tasks/daily`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 403) {
      tasksContainer.innerHTML = `<p>Invalid or expired token. Please log in again.</p>`;
      console.error("Invalid or expired token. Redirecting to login...");
      localStorage.removeItem("token"); // Clear invalid token
      setTimeout(() => (window.location.href = "https://mai.fly.dev/api/auth/login"), 2000);
      return;
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch tasks. Status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Task Data:", data);

    if (data.success) {
      tasksContainer.innerHTML = data.tasks
        .map(
          (task) => `
          <div class="task">
            <p>${task.description}</p>
            <button class="complete-task" data-id="${task.id}" ${
            task.completed ? "disabled" : ""
          }>
              ${task.completed ? "Completed" : "Complete Task"}
            </button>
          </div>
        `
        )
        .join("");
      attachTaskListeners();
    } else {
      tasksContainer.innerHTML = `<p>Error loading tasks: ${data.message}</p>`;
    }
  } catch (error) {
    tasksContainer.innerHTML = `<p>Error fetching tasks. Please try again later.</p>`;
    console.error("Error fetching tasks:", error.message);
  }
}

// Attach Listeners to Task Completion Buttons
function attachTaskListeners() {
  const completeButtons = document.querySelectorAll(".complete-task");
  completeButtons.forEach((button) =>
    button.addEventListener("click", async (event) => {
      const taskId = event.target.getAttribute("data-id");

      try {
        const response = await fetch(`${BASE_URL}/api/tasks/complete`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ taskId }),
        });

        if (!response.ok) {
          throw new Error("Failed to complete task. Please try again.");
        }

        const data = await response.json();

        if (data.success) {
          alert(data.message);
          fetchTasks(); // Refresh tasks after completion
        } else {
          console.error("Error completing task:", data.message);
        }
      } catch (error) {
        console.error("Error completing task:", error.message);
      }
    })
  );
}

// Spin the Reward Wheel
if (spinButton) {
  spinButton.addEventListener("click", async () => {
    if (!isLoggedIn()) {
      alert("Please log in to spin the wheel.");
      return;
    }

    spinSphere.classList.add("rotating");

    try {
      const response = await fetch(`${BASE_URL}/api/tasks/spin`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (!response.ok) {
        throw new Error("Failed to spin the wheel. Please try again.");
      }

      const data = await response.json();

      if (data.success) {
        setTimeout(() => {
          spinSphere.classList.remove("rotating");
          spinResult.classList.remove("hidden");
          rewardDisplay.textContent = `${data.reward} tokens!`;
        }, 2000);
      } else {
        console.error("Error spinning the wheel:", data.message);
      }
    } catch (error) {
      console.error("Error spinning the wheel:", error.message);
      spinSphere.classList.remove("rotating");
    }
  });
}

// Fetch Tasks on Page Load
if (isLoggedIn()) {
  fetchTasks();
} else {
  tasksContainer.innerHTML = `<p>Please log in to view your tasks.</p>`;
}