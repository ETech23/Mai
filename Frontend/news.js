// Toggle full article visibility
function toggleFullArticle(button) {
  const article = document.querySelector(".news-article");
  const shortDescription = article.querySelector("#short-description");
  const fullDescription = article.querySelector("#full-description");

  if (fullDescription.style.display === "none" || !fullDescription.style.display) {
    shortDescription.style.display = "none";
    fullDescription.style.display = "block";
    button.textContent = "Show Less";
  } else {
    shortDescription.style.display = "block";
    fullDescription.style.display = "none";
    button.textContent = "Read More";
  }
}

// Function to handle reactions (like/dislike)
async function handleReaction(event) {
  console.log("Reaction button clicked.");

  if (!localStorage.getItem("token")) {
    alert("Please log in to react to articles.");
    return;
  }

  const button = event.target;
  const articleElement = button.closest(".news-article");
  const articleTitle = articleElement.getAttribute("data-title");
  const isLike = button.classList.contains("like-btn");
  const reactionType = isLike ? "like" : "dislike";

  const reactionData = { title: articleTitle, reaction: reactionType };

  try {
    const response = await fetch("https://mai.fly.dev/api/articles/reactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(reactionData),
    });

    const data = await response.json();
    if (data.success) {
      console.log("Reaction saved successfully:", data);

      const likeCountElement = articleElement.querySelector(".like-count");
      const dislikeCountElement = articleElement.querySelector(".dislike-count");

      if (isLike) {
        likeCountElement.textContent = data.likeCount;
      } else {
        dislikeCountElement.textContent = data.dislikeCount;
      }
    } else {
      console.error("Failed to save reaction:", data.message);
    }
  } catch (error) {
    console.error("Error saving reaction:", error);
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

// Fetch reactions and update UI
async function updateReactionCounts() {
  console.log("Fetching reaction counts for all articles.");

  try {
    const response = await fetch("https://mai.fly.dev/api/articles");
    const data = await response.json();

    if (data.success) {
      const articlesData = data.data;
      articlesData.forEach((article) => {
        const articleElement = Array.from(document.querySelectorAll(".news-article")).find(
          (el) => el.getAttribute("data-title") === article.title
        );

        if (articleElement) {
          const likeCountElement = articleElement.querySelector(".like-count");
          const dislikeCountElement = articleElement.querySelector(".dislike-count");

          likeCountElement.textContent = article.likes || 0;
          dislikeCountElement.textContent = article.dislikes || 0;
        }
      });
    } else {
      console.error("Failed to fetch reaction counts:", data.message);
    }
  } catch (error) {
    console.error("Error fetching reaction counts:", error);
  }
}

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
      window.location.href = "";
    });
  }

  if (walletButton) {
    walletButton.addEventListener("click", () => {
      window.location.href = "";
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
  