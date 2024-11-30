const express = require("express");
const router = express.Router();
const Article = require("../models/Article");

// Increment view count
router.post("/view", async (req, res) => {
  const { title } = req.body;

  try {
    const article = await Article.findOne({ title });
    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }

    article.views = (article.views || 0) + 1;
    await article.save();

    res.json({ message: "View count updated", views: article.views });
  } catch (error) {
    console.error("Error updating view count:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Save reactions
router.post("/reactions", async (req, res) => {
  const { title, reaction } = req.body;

  try {
    const article = await Article.findOne({ title });
    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }

    if (reaction === "like") {
      article.likes = (article.likes || 0) + 1;
    } else if (reaction === "dislike") {
      article.dislikes = (article.dislikes || 0) + 1;
    } else {
      return res.status(400).json({ message: "Invalid reaction type" });
    }

    await article.save();
    res.json({ message: "Reaction saved", article });
  } catch (error) {
    console.error("Error saving reaction:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Fetch all articles (titles, views, likes, dislikes)
router.get("/", async (req, res) => {
  try {
    const articles = await Article.find({}, "title views likes dislikes");
    res.json(articles);
  } catch (error) {
    console.error("Error fetching articles:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
