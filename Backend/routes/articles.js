const express = require("express");
const router = express.Router();
const Article = require("../models/Article");

// Add a new article
router.post("/add", async (req, res) => {
  const { title, content, image } = req.body;

  if (!title || !content) {
    return res.status(400).json({ success: false, message: "Title and content are required" });
  }

  try {
    const existingArticle = await Article.findOne({ title });
    if (existingArticle) {
      return res.status(400).json({ success: false, message: "Article with this title already exists" });
    }

    const newArticle = new Article({ title, content, image });
    await newArticle.save();
    res.status(201).json({ success: true, message: "Article created successfully", article: newArticle });
  } catch (error) {
    console.error("Error creating article:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Update an article
router.put("/update/:id", async (req, res) => {
  const { title, content, image } = req.body;

  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ success: false, message: "Article not found" });
    }

    article.title = title || article.title;
    article.content = content || article.content;
    article.image = image || article.image;

    await article.save();
    res.json({ success: true, message: "Article updated successfully", article });
  } catch (error) {
    console.error("Error updating article:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Delete an article
router.delete("/delete/:id", async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ success: false, message: "Article not found" });
    }

    await article.remove();
    res.json({ success: true, message: "Article deleted successfully" });
  } catch (error) {
    console.error("Error deleting article:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Fetch all articles
router.get("/", async (req, res) => {
  try {
    const articles = await Article.find().sort({ createdAt: -1 });
    res.json(articles);
  } catch (error) {
    console.error("Error fetching articles:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
