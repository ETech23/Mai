const express = require("express");
const router = express.Router();
const User = require("../models/User");
const auth = require("../middleware/auth");

// Middleware for Authentication
const authenticate = require('../middleware/auth');

// Get Daily Tasks
router.get("/daily", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const dailyTasks = user.dailyTasks || [];

    res.json({ success: true, tasks: dailyTasks });
  } catch (error) {
    console.error("Error fetching daily tasks:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Complete a Task
router.post("/complete", auth, async (req, res) => {
  const { taskId } = req.body;

  try {
    const user = await User.findById(req.user.id);
    const task = user.dailyTasks.find((t) => t.id === taskId);

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    if (task.completed) {
      return res.status(400).json({ success: false, message: "Task already completed" });
    }

    task.completed = true;
    user.rewards += task.reward || 0;
    await user.save();

    res.json({ success: true, message: "Task completed!", rewards: user.rewards });
  } catch (error) {
    console.error("Error completing task:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Spin the Reward Wheel
router.post("/spin", auth, async (req, res) => {
  const rewards = [5, 10, 15, 0]; // Example rewards in tokens
  const reward = rewards[Math.floor(Math.random() * rewards.length)];

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.rewards += reward;
    await user.save();

    res.json({ success: true, reward, totalRewards: user.rewards });
  } catch (error) {
    console.error("Error spinning wheel:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
