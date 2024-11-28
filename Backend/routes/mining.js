const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// Middleware to verify JWT
const authenticate = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1]; // Ensure Bearer token format
  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach decoded user information
    next();
  } catch (err) {
    res.status(403).json({ message: "Invalid token" });
  }
};

// Activate mining
router.post("/activate", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check if mining is already active
    if (user.isMining) {
      return res.status(400).json({ message: "Mining is already active" });
    }

    // Set mining as active
    user.isMining = true;
    await user.save();

    // Mining logic: Add 2 MAI every 10 minutes
    const miningInterval = setInterval(async () => {
      try {
        const userToUpdate = await User.findById(req.user.id);
        if (!userToUpdate || !userToUpdate.isMining) {
          clearInterval(miningInterval);
          return;
        }

        userToUpdate.balance += 2; // Increment balance
        await userToUpdate.save();
      } catch (err) {
        console.error("Error during mining update:", err.message);
      }
    }, 10 * 60 * 1000);

    // Stop mining after 3 hours
    setTimeout(async () => {
      clearInterval(miningInterval);
      const userToStop = await User.findById(req.user.id);
      if (userToStop) {
        userToStop.isMining = false;
        await userToStop.save();
      }
    }, 3 * 60 * 60 * 1000);

    res.json({ message: "Mining activated" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// Stop mining
router.post("/stop", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.isMining) {
      return res.status(400).json({ message: "Mining is not currently active" });
    }

    user.isMining = false;
    await user.save();

    res.json({ message: "Mining stopped successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// Get user balance
router.get("/balance", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ balance: user.balance });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// Update user balance
router.post("/update", authenticate, async (req, res) => {
  try {
    const { balance } = req.body;

    if (typeof balance !== "number") {
      return res.status(400).json({ message: "Invalid balance value" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.balance = balance; // Update balance
    await user.save();

    res.json({ message: "Balance updated successfully", balance: user.balance });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
