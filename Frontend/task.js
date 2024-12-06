 // Selectors
const taskButton = document.getElementById("task-button");
const tasksSection = document.getElementById("tasks-section");
const closeTaskButton = document.getElementById("close-task-section");
const tasksContainer = document.getElementById("tasks-container");
const spinButton = document.getElementById("spin-btn");
const rewardDisplay = document.getElementById("reward");
const spinSphere = document.querySelector(".spin-sphere");
const spinResult = document.getElementById("spin-result");

// Base URL
const BASE_URL = "https://mai.fly.dev";

  console.log("Token in localStorage:", localStorage.getItem("token"));
  
// Check if the user is logged in
function isLoggedIn() {
  const token = localStorage.getItem("token");
  return token ? true : false;
}

// Show the Task button only if logged in
if (isLoggedIn() && taskButton) {
  taskButton.classList.remove("hidden");
}

// Show the Task section
if (taskButton) {
  taskButton.addEventListener("click", async () => {
    if (isLoggedIn()) {
      tasksSection.classList.remove("hidden");
      await fetchTasks();
    } else {
      alert("Please log in to access tasks.");
    }
  });
}

// Close the Task section
if (closeTaskButton) {
  closeTaskButton.addEventListener("click", () => {
    tasksSection.classList.add("hidden");
  });
}

// Fetch tasks from API
async function fetchTasks() {
  try {
    const response = await fetch(`${BASE_URL}/api/tasks/daily`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });

    const data = await response.json();

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

// Attach listeners to complete task buttons
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

        const data = await response.json();

        if (data.success) {
          alert(data.message);
          fetchTasks(); // Refresh tasks
        } else {
          console.error("Error completing task:", data.message);
        }
      } catch (error) {
        console.error("Error completing task:", error.message);
      }
    })
  );
}

// Spin the reward wheel
if (spinButton) {
  spinButton.addEventListener("click", async () => {
    spinSphere.classList.add("rotating");

    try {
      const response = await fetch(`${BASE_URL}/api/tasks/spin`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

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