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
router.post("/end", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const session = await MiningSession.findOne({ userId, isActive: true });
    if (!session) {
      return res.status(404).json({ success: false, message: "No active session found" });
    }

    session.isActive = false;
    await session.save();

    res.status(200).json({ success: true, message: "Mining session ended" });
  } catch (error) {
    console.error("Error ending mining session:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get current mining session
router.get("/status", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const session = await MiningSession.findOne({ userId, isActive: true });
    if (!session) {
      return res.status(404).json({ success: false, message: "No active session found" });
    }

    // Check if the session has expired
    const elapsedTime = Date.now() - session.startTime;
    if (elapsedTime >= session.duration) {
      session.isActive = false;
      await session.save();
      return res.status(200).json({ success: true, session: null });
    }

    res.status(200).json({ success: true, session });
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

// Update mining session
router.post("/update", authenticate, async (req, res) => {
  const { progress, endTime } = req.body;

  if (progress < 0 || progress > 100 || !endTime) {
    return res.status(400).json({ success: false, message: "Invalid data" });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.miningProgress = progress;
    user.miningEndTime = new Date(endTime);
    await user.save();

    res.json({ success: true, message: "Mining session updated" });
  } catch (error) {
    console.error("Error updating mining session:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Fetch mining session status
router.get("/status", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("miningProgress miningEndTime");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      miningProgress: user.miningProgress,
      miningEndTime: user.miningEndTime,
    });
  } catch (error) {
    console.error("Error fetching mining session status:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


module.exports = router;
