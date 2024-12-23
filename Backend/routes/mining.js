const express = require("express");
const jwt = require("jsonwebtoken");
const MiningSession = require("../models/MiningSession");
const User = require("../models/User");
const { body, validationResult } = require("express-validator");

const router = express.Router();

// Middleware to verify JWT
const authenticate = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ message: "Invalid token" });
  }
};

/** ============================
 * START/STOP MINING SESSION
 ============================ */

// Start a mining session
router.post("/start", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    let session = await MiningSession.findOne({ userId, isActive: true });
    if (session) {
      return res.status(200).json({ success: true, session });
    }

    session = new MiningSession({
      userId,
      startTime: Date.now(),
      duration: 3600000, // 1 hour in milliseconds
      isActive: true,
    });

    await session.save();

    // Update user's isMining status
    await User.findByIdAndUpdate(userId, { isMining: true });

    res.status(201).json({ success: true, session });
  } catch (error) {
    console.error("Error starting mining session:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
// Stop mining session
router.post("/end", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const session = await MiningSession.findOne({ userId, isActive: true });
    if (!session) {
      return res.status(404).json({ success: false, message: "No active session found" });
    }

    session.isActive = false;
    await session.save();

    // Update user's isMining status
    await User.findByIdAndUpdate(userId, { isMining: false });

    res.status(200).json({ success: true, message: "Mining session ended" });
  } catch (error) {
    console.error("Error ending mining session:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get current mining session
// Get current mining session status
router.get("/status", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch mining session from the database
    let session = await MiningSession.findOne({ userId, isActive: true });

    if (!session) {
      // Ensure isMining in User is false if no active session
      await User.findByIdAndUpdate(userId, { isMining: false });
      return res.status(200).json({ success: false, message: "No active session found" });
    }

    // Check if the session has expired
    const elapsedTime = Date.now() - session.startTime;
    if (elapsedTime >= session.duration) {
      session.isActive = false;
      await session.save();

      await User.findByIdAndUpdate(userId, { isMining: false });
      return res.status(200).json({ success: false, message: "Mining session expired" });
    }

    // Ensure isMining is true if the session is active
    await User.findByIdAndUpdate(userId, { isMining: true });

    res.status(200).json({
      success: true,
      session: {
        progress: (elapsedTime / session.duration) * 100, // Calculate progress
        remainingTime: session.duration - elapsedTime,
        isActive: session.isActive,
      },
    });
  } catch (error) {
    console.error("Error fetching mining session:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/** ============================
 * USER BALANCE
 ============================ */

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

// Update user balance (Admin-only or secure route)
router.post(
  "/update",
  [
    authenticate,
    body("balance").isNumeric().withMessage("Balance must be a valid number"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { balance } = req.body;

      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ message: "User not found" });

      user.balance = balance;
      await user.save();

      res.json({ message: "Balance updated successfully", balance: user.balance });
    } catch (err) {
      console.error("Error updating balance:", err.message);
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
);

module.exports = router;
