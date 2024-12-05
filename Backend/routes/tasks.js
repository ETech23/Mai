const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const User = require("../models/User");

// Inline Middleware for Authentication
const authenticate = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1]; // Extract token from the Authorization header
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify token using JWT_SECRET
    req.user = decoded; // Attach decoded user to req.user
    next();
  } catch (err) {
    console.error("Invalid or expired token:", err.message);
    res.status(403).json({ message: "Invalid or expired token" });
  }
};

// Get Daily Tasks
router.get("/daily", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id); // Use req.user.id from the decoded token
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const dailyTasks = user.dailyTasks || []; // Retrieve daily tasks from the user object
    res.json({ success: true, tasks: dailyTasks });
  } catch (error) {
    console.error("Error fetching daily tasks:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Complete a Task
router.post("/complete", authenticate, async (req, res) => {
  const { taskId } = req.body; // Task ID from the request body

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const task = user.dailyTasks.find((t) => t.id === taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    if (task.completed) {
      return res.status(400).json({ success: false, message: "Task already completed" });
    }

    task.completed = true;
    user.rewards += task.reward || 0; // Add task reward to the user's rewards
    await user.save();

    res.json({ success: true, message: "Task completed!", rewards: user.rewards });
  } catch (error) {
    console.error("Error completing task:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Spin the Reward Wheel
router.post("/spin", authenticate, async (req, res) => {
  const rewards = [5, 10, 15, 0]; // Example rewards in tokens
  const reward = rewards[Math.floor(Math.random() * rewards.length)]; // Randomly pick a reward

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.rewards += reward; // Add the reward to the user's total rewards
    await user.save();

    res.json({ success: true, reward, totalRewards: user.rewards });
  } catch (error) {
    console.error("Error spinning wheel:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
