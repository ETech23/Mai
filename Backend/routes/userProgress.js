const express = require("express");
const router = express.Router();
const User = require("../models/User");
const auth = require("../middleware/auth");

// GET /api/user/progress - Load user progress
router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("userProgress");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user.userProgress || {});
  } catch (err) {
    console.error("Error loading progress:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/user/progress - Save user progress
router.post("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.userProgress = req.body;
    await user.save();

    res.json({ message: "Progress saved successfully" });
  } catch (err) {
    console.error("Error saving progress:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
