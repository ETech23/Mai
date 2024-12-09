const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const router = express.Router();
const Message = require("../models/Message");
const User = require("../models/User");
const auth = require("../middleware/auth");

// Admin Authentication Middleware
const adminAuth = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.isAdmin) {
      return res.status(403).json({ success: false, message: "Admin access only" });
    }
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Admin token verification failed:", error.message);
    return res.status(403).json({ success: false, message: "Invalid or expired token" });
  }
};

// Helper Function to Validate Admin Role
const validateAdmin = (req, res) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ success: false, message: "Admin access only" });
  }
};

// Fetch All User Messages with Pagination
router.get("/messages", adminAuth, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  try {
    const messages = await Message.find()
      .sort({ timestamp: -1 }) // Sort by most recent
      .skip((page - 1) * limit)
      .limit(limit);

    const totalMessages = await Message.countDocuments();

    res.json({
      success: true,
      messages,
      pagination: {
        total: totalMessages,
        page,
        limit,
        totalPages: Math.ceil(totalMessages / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching admin messages:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// Fetch All Users with Filtering, Sorting, and Referral Count
router.get("/users", adminAuth, async (req, res) => {
  const { sortBy, order = "asc", minBalance, maxBalance, minReferrals, maxReferrals } = req.query;
  const sortOrder = order === "desc" ? -1 : 1;

  try {
    const filter = {};

    // Apply balance filtering
    if (minBalance || maxBalance) {
      filter.balance = {};
      if (minBalance) filter.balance.$gte = parseFloat(minBalance);
      if (maxBalance) filter.balance.$lte = parseFloat(maxBalance);
    }

    // Apply referral count filtering
    if (minReferrals || maxReferrals) {
      filter.referrals = {};
      if (minReferrals) filter.referrals.$gte = parseInt(minReferrals);
      if (maxReferrals) filter.referrals.$lte = parseInt(maxReferrals);
    }

    // Aggregate user data with referral count
    const users = await User.aggregate([
      { $addFields: { referralCount: { $size: "$referrals" } } }, // Compute referral count
      { $match: filter }, // Apply filters
      {
        $sort: sortBy === "referrals"
          ? { referralCount: sortOrder }
          : sortBy === "balance"
          ? { balance: sortOrder }
          : {}, // Default: no sorting
      },
    ]);

    const totalUsers = await User.countDocuments();

    res.json({ success: true, users, totalUsers });
  } catch (error) {
    console.error("Error fetching users:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// Suspend or Unsuspend a User
router.post("/suspend", adminAuth, async (req, res) => {
  const { userId, isSuspended } = req.body;

  if (typeof isSuspended !== "boolean") {
    return res.status(400).json({ success: false, message: "isSuspended must be a boolean" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.isSuspended = isSuspended; // Update suspension status
    await user.save();

    res.json({ success: true, message: `User has been ${isSuspended ? "suspended" : "unsuspended"}.` });
  } catch (error) {
    console.error("Error updating suspension status:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// Reset a User's Password
router.post("/reset-password", adminAuth, async (req, res) => {
  const { userId, newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ success: false, message: "Password must be at least 6 characters long." });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Hash the new password before saving
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    await user.save();

    res.json({ success: true, message: "Password reset successfully!" });
  } catch (error) {
    console.error("Error resetting password:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// Respond to a User Message
router.post("/respond", adminAuth, async (req, res) => {
  const { userId, messageId, response } = req.body;

  if (!response) {
    return res.status(400).json({ success: false, message: "Response content is required." });
  }

  try {
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const adminResponse = new Message({
      sender: "admin",
      userId,
      message: response,
    });

    await adminResponse.save();

    // Optionally notify the user
    res.json({ success: true, message: "Response sent successfully!" });
  } catch (error) {
    console.error("Error sending response:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
