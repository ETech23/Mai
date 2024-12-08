const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const Message = require("../models/Message");
const User = require("../models/User");
const auth = require("../middleware/auth");

// Inline Middleware for Admin Authentication
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
  } catch (err) {
    console.error("Admin token verification failed:", err.message);
    res.status(403).json({ success: false, message: "Invalid or expired token" });
  }
};

// Fetch all user messages with pagination
router.get("/messages", adminAuth, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  try {
    const messages = await Message.find()
      .sort({ timestamp: -1 })
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
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Fetch all users with referral count and total user count
// Fetch all users with referral count and filtering/sorting
router.get("/users", auth, async (req, res) => {
  const { isAdmin } = req.user;
  if (!isAdmin) {
    return res.status(403).json({ success: false, message: "Admin access only" });
  }

  const { sortBy, order = "asc", minBalance, maxBalance, minReferrals, maxReferrals } = req.query;
  const sortOrder = order === "desc" ? -1 : 1;

  try {
    const filter = {};

    // Add balance filtering if provided
    if (minBalance || maxBalance) {
      filter.balance = {};
      if (minBalance) filter.balance.$gte = parseFloat(minBalance);
      if (maxBalance) filter.balance.$lte = parseFloat(maxBalance);
    }

    // Add referral count filtering if provided
    if (minReferrals || maxReferrals) {
      filter.referrals = {};
      if (minReferrals) filter.referrals.$gte = parseInt(minReferrals);
      if (maxReferrals) filter.referrals.$lte = parseInt(maxReferrals);
    }

    const users = await User.aggregate([
      {
        $addFields: {
          referralCount: { $size: "$referrals" }, // Compute referral count dynamically
        },
      },
      { $match: filter }, // Apply the filtering
      {
        $sort:
          sortBy === "referrals"
            ? { referralCount: sortOrder }
            : sortBy === "balance"
            ? { balance: sortOrder }
            : {}, // Default: no sorting
      },
    ]);

    const totalUsers = await User.countDocuments(); // Count total users

    res.json({ success: true, users, totalUsers });
  } catch (error) {
    console.error("Error fetching users:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Suspend or unsuspend a user
router.post("/suspend", auth, async (req, res) => {
  const { isAdmin } = req.user;
  if (!isAdmin) {
    return res.status(403).json({ success: false, message: "Admin access only" });
  }

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

    res.json({
      success: true,
      message: `User has been ${isSuspended ? "suspended" : "unsuspended"}.`,
    });
  } catch (error) {
    console.error("Error suspending user:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Reset a user's password
router.post("/reset-password", auth, async (req, res) => {
  const { isAdmin } = req.user;
  if (!isAdmin) {
    return res.status(403).json({ success: false, message: "Admin access only" });
  }

  const { userId, newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters long.",
    });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.password = newPassword; // Replace with a hashed password in production
    await user.save();

    res.json({ success: true, message: "Password reset successfully!" });
  } catch (error) {
    console.error("Error resetting password:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Respond to a message
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

    // Notify the user
    user.notifications = user.notifications || [];
    user.notifications.push({ message: "You have a new message from admin." });
    await user.save();

    res.json({ success: true, message: "Response sent successfully!" });
  } catch (error) {
    console.error("Error responding to message:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
