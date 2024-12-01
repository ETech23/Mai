const express = require("express");
const router = express.Router();
const Article = require("../models/Article");

// Increment view count
router.post("/view", async (req, res) => {
  const { title } = req.body;

  // Validate request body
  if (!title) {
    return res.status(400).json({ success: false, message: "Title is required" });
  }

  try {
    const article = await Article.findOne({ title });
    if (!article) {
      return res.status(404).json({ success: false, message: "Article not found" });
    }

    article.views = (article.views || 0) + 1;
    await article.save();

    res.json({ success: true, message: "View count updated", views: article.views });
  } catch (error) {
    console.error("Error updating view count:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Save reactions
router.post("/reactions", async (req, res) => {
  const { title, reaction } = req.body;

  // Validate request body
  if (!title || !reaction) {
    return res.status(400).json({ success: false, message: "Title and reaction are required" });
  }

  try {
    const article = await Article.findOne({ title });
    if (!article) {
      return res.status(404).json({ success: false, message: "Article not found" });
    }

    if (reaction === "like") {
      article.likes = (article.likes || 0) + 1;
    } else if (reaction === "dislike") {
      article.dislikes = (article.dislikes || 0) + 1;
    } else {
      return res.status(400).json({ success: false, message: "Invalid reaction type" });
    }

    await article.save();
    res.json({ success: true, message: "Reaction saved", likes: article.likes, dislikes: article.dislikes });
  } catch (error) {
    console.error("Error saving reaction:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Fetch all articles (titles, views, likes, dislikes)
router.get("/", async (req, res) => {
  try {
    const articles = await Article.find({}, "title views likes dislikes");
    res.json({ success: true, data: articles });
  } catch (error) {
    console.error("Error fetching articles:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
