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

    // Check for an active session
    const existingSession = await MiningSession.findOne({ userId, isActive: true });
    if (existingSession) {
      return res.status(400).json({
        success: false,
        message: "A mining session is already active.",
        session: existingSession,
      });
    }

    // Create a new mining session
    const now = Date.now();
    const newSession = new MiningSession({
      userId,
      startTime: now,
      endTime: now + 3600000, // 1 hour from now
      duration: 3600000,
      isActive: true,
    });

    await newSession.save();

    res.status(201).json({
      success: true,
      message: "Mining session started successfully.",
      session: newSession,
    });
  } catch (error) {
    console.error("Error starting mining session:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Stop mining session
router.post("/complete", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    // Find the active mining session
    const session = await MiningSession.findOneAndUpdate(
      { userId, isActive: true },
      { isActive: false },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({ success: false, message: "No active session found." });
    }

    // Update the user's `isMining` field to false
    await User.findByIdAndUpdate(userId, { isMining: false });

    res.status(200).json({ success: true, message: "Mining session completed." });
  } catch (error) {
    console.error("Error completing mining session:", error);
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

/** ============================
 * MINING SESSION STATUS
 ============================ */

// Fetch mining session status
router.get("/status", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      console.error("Missing userId in request.");
      return res.status(400).json({ success: false, message: "Invalid user request." });
    }

    console.log(`Fetching mining session status for userId: ${userId}`);

    // Query the database for an active mining session
    const session = await MiningSession.findOne({ userId, isActive: true });

    if (!session) {
      console.warn(`No active mining session found for userId: ${userId}`);
      return res.status(404).json({
        success: false,
        message: "No active mining session found.",
      });
    }

    // Extract and validate session data
    const { startTime, duration, endTime } = session;

    if (!startTime || !duration || !endTime) {
      console.error(`Invalid session data for userId: ${userId}`);
      return res.status(500).json({
        success: false,
        message: "Corrupt session data. Please contact support.",
      });
    }

    const now = Date.now();
    const miningEndTime = new Date(endTime).getTime();
    const isMining = now < miningEndTime;

    // Calculate mining progress
    const progress =
      duration > 0
        ? Math.min(100, ((now - new Date(startTime).getTime()) / duration) * 100)
        : 0;

    console.log(`Mining session active: ${isMining}, Progress: ${progress}%`);

    // Respond with session status
    res.status(200).json({
      success: true,
      miningProgress: progress.toFixed(2), // Return progress with 2 decimal places
      miningEndTime: endTime,
      isMining,
    });
  } catch (error) {
    console.error("Error fetching mining session status:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
});

module.exports = router;