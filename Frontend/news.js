const isDesktop = window.innerWidth > 768;
  const desktopHint = document.getElementById("desktop-hint");

  if (isDesktop && desktopHint) {
    // Show a hint message for desktop users
    desktopHint.classList.remove("hidden");
    desktopHint.innerHTML = `
      <p>
        For the best experience, please visit our site on a mobile device.
        <br><strong>Mobile users can access full services including Mining Mai token, and more!</strong>
      </p>
    `;
  }

// Authentication Token (Replace with actual user token retrieval logic)
let token = localStorage.getItem("token");

// User Activity Tracking
let isUserActive = false;
let lastActiveTime = Date.now();

// Track User Activity
document.addEventListener("scroll", () => {
  isUserActive = true;
  lastActiveTime = Date.now();
});

document.addEventListener("click", () => {
  isUserActive = true;
  lastActiveTime = Date.now();
});

// UI Elements for Displaying Points
//const dropdownPointsDisplay = document.getElementById("dropdown-points");
const dashboardPointsDisplay = document.getElementById("dashboard-points");

/**
 * Fetch Current Points from Backend
 */
async function fetchPoints() {
  if (!token) {
    console.error("Missing authorization token");
    return 0; // Return 0 points if no token
  }

  try {
    console.log("Fetching points from backend...");

    const response = await fetch("https://mai.fly.dev/api/points", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("Response status:", response.status);

    if (!response.ok) {
      throw new Error("Failed to fetch points");
    }

    const data = await response.json();
    console.log("Fetched points data object:", data);

    // Ensure correct access to points
    if (data && data.success && typeof data.points === "number") {
      console.log("Points fetched successfully:", data.points);
      return data.points;
    } else {
      throw new Error("Invalid response structure: 'points' not found");
    }
  } catch (error) {
    console.error("Error fetching points:", error.message);
    return 0;
  }
}

/**
 * Update Points on Backend
 */
async function updatePoints(increment) {
  if (!token) {
    console.error("Missing authorization token");
    return 0;
  }

  try {
    const response = await fetch("https://mai.fly.dev/api/points", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ increment }),
    });

    if (!response.ok) {
      throw new Error("Failed to update points");
    }

    const data = await response.json();
    if (data.success) {
      return data.points;
    } else {
      throw new Error(data.message || "Failed to update points");
    }
  } catch (error) {
    console.error("Error updating points:", error.message);
    return 0;
  }
}

  const footer = document.querySelector("footer"); // Select the footer element

  if (isDesktop && footer) {
    footer.style.display = "none"; // Hide the footer for desktop users
  }

// Toggle full article visibility and handle image resizing
function toggleFullArticle(article) {
  // Find the content area and expand it
  const content = article.querySelector(".content");
  if (content) {
    content.classList.toggle("expanded");
  }

  // Get the short and full descriptions, image, and title
  const shortDescription = article.querySelector("#short-description");
  const fullDescription = article.querySelector("#full-description");
  const image = article.querySelector("img");
  
  if (!shortDescription || !fullDescription || !image) {
    console.error("Required elements not found!");
    return;
  }

  // Toggle visibility and layout
  if (fullDescription.style.display === "none" || !fullDescription.style.display) {
    // Show full description
    shortDescription.style.display = "none";
    fullDescription.style.display = "block";

    // Update image layout for full description
    image.style.width = "100%";
    image.style.height = "150px";
    image.style.float = "none";
    image.style.marginRight = "0";
    image.style.marginTop = "10px";

    // Add full-view class
    article.classList.remove("short-view");
    article.classList.add("full-view");
  } else {
    // Show short description
    shortDescription.style.display = "block";
    fullDescription.style.display = "none";

    // Update image layout for short description
    image.style.width = "150px";
    image.style.height = "80px";
    image.style.float = "left";
    image.style.marginRight = "10px";
    image.style.marginTop = "0";

    // Add short-view class
    article.classList.remove("full-view");
    article.classList.add("short-view");
  }
}

// Attach click event listener to the entire article (except like/love buttons)
document.querySelectorAll(".news-article").forEach(article => {
  article.addEventListener("click", function(event) {
    // Prevent the like and love buttons from triggering the toggle
    if (event.target.closest(".like-btn, .dislike-btn, .view-count, .push")) {
      return;
    }

    toggleFullArticle(article);
  });
});

// Fold the content back to short description
function foldBackContent(event) {
  const article = event.target.closest(".news-article");
  
  if (!article) {
    console.error("Article element not found!");
    return;
  }
  
  const shortDescription = article.querySelector("#short-description");
  const fullDescription = article.querySelector("#full-description");
  const image = article.querySelector("img");
  const button = article.querySelector(".toggle-button");

  if (!shortDescription || !fullDescription || !image || !button) {
    console.error("Elements not found!");
    return;
  }

  // Reset to short description mode
  shortDescription.style.display = "block";
  fullDescription.style.display = "none";
  button.textContent = "Read More";

  // Update image layout for short description
  image.style.width = "100px";
  image.style.height = "80px";
  image.style.float = "left";
  image.style.marginRight = "10px";

  // Add short-view class
  article.classList.remove("full-view");
  article.classList.add("short-view");

  // Remove the event listener
  fullDescription.removeEventListener("click", foldBackContent);
}



// Function to handle reactions (like/dislike)
async function handleReaction(event) {
  console.log("Reaction button clicked.");

  // Check if the user is logged in
  if (!localStorage.getItem("token")) {
    alert("Please log in to react to articles.");
    return;
  }

  const button = event.target;
  const articleElement = button.closest(".news-article");
  const articleTitle = articleElement.getAttribute("data-title");

  if (!articleTitle) {
    console.error("Article title not found.");
    return;
  }

  const isLike = button.classList.contains("like-btn");
  const reactionType = isLike ? "like" : "dislike";

  console.log(`Article Title: ${articleTitle}, Reaction Type: ${reactionType}`);

  const reactionData = { title: articleTitle, reaction: reactionType };

  try {
    // Send the reaction data to the server
    const response = await fetch("https://mai.fly.dev/api/articles/reactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`, // Include token
      },
      body: JSON.stringify(reactionData),
    });

    const data = await response.json();

    if (data.success) {
      console.log("Reaction saved successfully:", data);

      // Update counts in the UI after success
      const likeCountElement = articleElement.querySelector(".like-count");
      const dislikeCountElement = articleElement.querySelector(".dislike-count");

      // Update UI directly after receiving the success response
      if (likeCountElement && dislikeCountElement) {
        // Fetch updated reaction counts from the response and update UI
        likeCountElement.textContent = formatNumber(data.likes || 0);
        dislikeCountElement.textContent = formatNumber(data.dislikes || 0);
      }
    } else {
      console.error("Failed to save reaction:", data.message);
    }
  } catch (error) {
    console.error("Error handling reaction:", error);
  }
}

// Increment view count for an article
async function incrementViewCount(articleElement) {
  console.log("Incrementing view count.");

  const articleTitle = articleElement.getAttribute("data-title");
  const viewData = { title: articleTitle };

  try {
    const response = await fetch("https://mai.fly.dev/api/articles/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(viewData),
    });

    const data = await response.json();
    if (data.success) {
      const viewCountElement = articleElement.querySelector(".views");
      viewCountElement.textContent = data.views;
    } else {
      console.error("Failed to update view count:", data.message);
    }
  } catch (error) {
    console.error("Error updating view count:", error);
  }
}



// Helper function to format numbers
function formatNumber(number) {
  if (number >= 1_000_000_000) {
    return (number / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "b";
  } else if (number >= 1_000_000) {
    return (number / 1_000_000).toFixed(1).replace(/\.0$/, "") + "m";
  } else if (number >= 1_000) {
    return (number / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
  } else {
    return number;
  }
}

// Fetch reactions and update UI
async function updateReactionCounts() {
  console.log("Fetching reaction counts for all articles...");

  try {
    const response = await fetch("https://mai.fly.dev/api/articles");
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch articles.");
    }

    if (data.success) {
      const articlesData = data.data;

      // Select all news article elements on the page
      const articleElements = document.querySelectorAll(".news-article");

      // Iterate through each article in the fetched data
      articlesData.forEach((article) => {
        const articleElement = Array.from(articleElements).find(
          (el) => el.getAttribute("data-title") === article.title
        );

        if (articleElement) {
          const likeCountElement = articleElement.querySelector(".like-count");
          const dislikeCountElement = articleElement.querySelector(".dislike-count");
          const viewCountElement = articleElement.querySelector(".views");

          // Safely update the counts using the helper function
          if (likeCountElement) {
            likeCountElement.textContent = formatNumber(article.likes || 0);
          }
          if (dislikeCountElement) {
            dislikeCountElement.textContent = formatNumber(article.dislikes || 0);
          }
          if (viewCountElement) {
            viewCountElement.textContent = formatNumber(article.views || 0);
          }
        } else {
          console.warn(`No article element found for title: ${article.title}`);
        }
      });
    } else {
      console.error("Failed to fetch reaction counts:", data.message);
    }
  } catch (error) {
    console.error("Error fetching reaction counts:", error);
  }
}

// Retry mechanism for updateReactionCounts
function retryUpdateReactionCounts(maxRetries = 3, delay = 2000) {
  let attempts = 0;

  const retry = async () => {
    attempts++;
    try {
      await updateReactionCounts();
      console.log("Reaction counts updated successfully.");
    } catch (error) {
      if (attempts < maxRetries) {
        console.warn(`Retrying... Attempt ${attempts}`);
        setTimeout(retry, delay);
      } else {
        console.error("Failed to update reaction counts after multiple attempts:", error);
      }
    }
  };

  retry();
}

// Run the function with retries to ensure robustness
retryUpdateReactionCounts();

// Push article to backend
async function handlePushArticle() {
  const pushArticleButton = document.getElementById("push-article");
  const articleElement = pushArticleButton.closest(".news-article");

  const title = articleElement.getAttribute("data-title");
  const content = articleElement.querySelector("p").textContent;
  const image = articleElement.querySelector("img")?.getAttribute("src") || null;

  const articleData = { title, content, image };

  try {
    const response = await fetch("https://mai.fly.dev/api/articles/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(articleData),
    });

    const data = await response.json();
    if (data.success) {
      alert("Article pushed successfully.");
    } else {
      console.error("Failed to push article:", data.message);
    }
  } catch (error) {
    console.error("Error pushing article:", error);
  }
}

// Attach reaction handlers
document.querySelectorAll(".news-article").forEach((article) => {
  const likeButton = article.querySelector(".like-btn");
  const dislikeButton = article.querySelector(".dislike-btn");

  likeButton.addEventListener("click", handleReaction);
  dislikeButton.addEventListener("click", handleReaction);
});

// Attach push article handler
const pushArticleButton = document.getElementById("push-article");
if (pushArticleButton) {
  pushArticleButton.addEventListener("click", handlePushArticle);
}

// Increment view count for all articles
document.querySelectorAll(".news-article").forEach((article) => incrementViewCount(article));

// Update reaction counts on page load
updateReactionCounts();

// Footer button navigation
document.addEventListener("DOMContentLoaded", () => {
  // Footer button navigation
  const homeButton = document.getElementById("home-btn");
  const newsButton = document.getElementById("news-btn");
  const aiButton = document.getElementById("ai-btn");
  const walletButton = document.getElementById("wallet-btn");
  const menuButton =
  document.getElementById("menu-btn");

  if (homeButton) {
    homeButton.addEventListener("click", () => {
      window.location.href = "./index.html";
    });
  }

  if (newsButton) {
    newsButton.addEventListener("click", () => {
      window.location.href = "./news.html";
    });
  }

  if (aiButton) {
    aiButton.addEventListener("click", () => {
      window.location.href = "ai.html";
    });
  }

  if (walletButton) {
    walletButton.addEventListener("click", () => {
      window.location.href = "";
    });
  }
  
    if (menuButton) {
    menuButton.addEventListener("click", () => {
      window.location.href = "more.html";
    });
  }
});

// Contact us button
const taskButton = document.getElementById("task-button");
if (taskButton) {
  taskButton.addEventListener("click", () => {
    window.location.href = "task.html";
  });
}
  