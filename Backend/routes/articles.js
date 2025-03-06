const express = require("express");
const router = express.Router();
const Article = require("../models/Article");

// Add a new article
router.post("/add", async (req, res) => {
  try {
    const { title, content, image } = req.body;

    // Validation
    if (!title || !content) {
      return res.status(400).json({ success: false, message: "Title and content are required." });
    }

    // Create and save the article
    const article = new Article({ title, content, image });
    await article.save();

    res.status(201).json({ success: true, message: "Article created successfully", article });
  } catch (error) {
    console.error("Error creating article:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Fetch all articles (with short descriptions)
router.get("/", async (req, res) => {
  try {
    const articles = await Article.find({}, "title content image createdAt");
    const formattedArticles = articles.map((article) => ({
      id: article._id,
      title: article.title,
      content: article.content,
      shortDescription: article.content.substring(0, 200) + "...", // Generate short description
      image: article.image,
      date: article.createdAt,
    }));
    res.json({ success: true, data: formattedArticles });
  } catch (error) {
    console.error("Error fetching articles:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Fetch a single article by ID
router.get("/:id", async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ success: false, message: "Article not found" });
    }
    res.json({ success: true, data: article });
  } catch (error) {
    console.error("Error fetching article:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
