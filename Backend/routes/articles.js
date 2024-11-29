const express = require("express");
const router = express.Router();
const Article = require("../models/Article"); // Create a model for articles

router.post("/reactions", async (req, res) => {
  const { title, reaction } = req.body;

  try {
    const article = await Article.findOne({ title });
    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }

    if (reaction === "like") {
      article.likes++;
    } else if (reaction === "dislike") {
      article.dislikes++;
    }

    await article.save();
    res.status(200).json({ message: "Reaction saved", article });
  } catch (error) {
    console.error("Error saving reaction:", error);
    res.status(500).json({ message: "Server error" });
  }
});


// Fetch articles and their views
router.get("/", async (req, res) => {
  try {
    const articles = await Article.find({}, "title views");
    res.json(articles);
  } catch (error) {
    console.error("Error fetching articles:", error);
    res.status(500).json({ message: "Server error" });
  }
});

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

module.exports = router;
