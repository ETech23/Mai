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

    // Mining logic: Add 2 MAI every 10 minutes, adjusted by mining rate
    const miningInterval = setInterval(async () => {
      try {
        const userToUpdate = await User.findById(req.user.id);
        if (!userToUpdate || !userToUpdate.isMining) {
          clearInterval(miningInterval);
          return;
        }

        // Calculate the incremented balance based on the mining rate
        const miningIncrement = 2 * (userToUpdate.miningRate || 1);
        userToUpdate.balance += miningIncrement; // Increment balance
        await userToUpdate.save();
      } catch (err) {
        console.error("Error during mining update:", err.message);
      }
    }, 10 * 60 * 1000); // Every 10 minutes

    // Stop mining after 3 hours
    setTimeout(async () => {
      clearInterval(miningInterval);
      const userToStop = await User.findById(req.user.id);
      if (userToStop) {
        userToStop.isMining = false;
        await userToStop.save();
      }
    }, 3 * 60 * 60 * 1000); // 3 hours

    res.json({ message: "Mining activated successfully" });
  } catch (err) {
    console.error("Error activating mining:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
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
    console.error("Error stopping mining:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get user balance
router.get("/balance", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ balance: user.balance });
  } catch (err) {
    console.error("Error fetching balance:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Update user balance
router.post("/update", authenticate, async (req, res) => {
  try {
    const { balance } = req.body;

    if (typeof balance !== "number" || balance < 0) {
      return res.status(400).json({ message: "Invalid balance value" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.balance = balance; // Update balance
    await user.save();

    res.json({ message: "Balance updated successfully", balance: user.balance });
  } catch (err) {
    console.error("Error updating balance:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get mining status
router.get("/status", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ isMining: user.isMining, miningRate: user.miningRate });
  } catch (err) {
    console.error("Error fetching mining status:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
