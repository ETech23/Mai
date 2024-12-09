const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Message = require("../models/Message");
const adminAuth = require("../middleware/adminAuth");

// Fetch all users with filters and pagination
router.get("/users", adminAuth, async (req, res) => {
  const { page = 1, limit = 10, minBalance, maxBalance, minReferrals, maxReferrals } = req.query;
  const skip = (page - 1) * limit;

  try {
    const filter = {};

    // Add balance filters
    if (minBalance || maxBalance) {
      filter.balance = {};
      if (minBalance) filter.balance.$gte = parseFloat(minBalance);
      if (maxBalance) filter.balance.$lte = parseFloat(maxBalance);
    }

    // Add referral filters
    if (minReferrals || maxReferrals) {
      filter.referrals = {};
      if (minReferrals) filter.referrals.$gte = parseInt(minReferrals);
      if (maxReferrals) filter.referrals.$lte = parseInt(maxReferrals);
    }

    const users = await User.aggregate([
      { $addFields: { referralCount: { $size: "$referrals" } } },
      { $match: filter },
      { $skip: skip },
      { $limit: parseInt(limit) },
    ]);

    const totalUsers = await User.countDocuments(filter);

    res.json({
      success: true,
      users,
      totalUsers,
      pagination: {
        total: totalUsers,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalUsers / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch users." });
  }
});

// Suspend or unsuspend a user
router.post("/users/suspend", adminAuth, async (req, res) => {
  const { userId, isSuspended } = req.body;

  if (typeof isSuspended !== "boolean") {
    return res.status(400).json({ success: false, message: "Invalid suspension status" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.isSuspended = isSuspended;
    await user.save();

    res.json({ success: true, message: `User has been ${isSuspended ? "suspended" : "unsuspended"}.` });
  } catch (error) {
    console.error("Error updating suspension status:", error.message);
    res.status(500).json({ success: false, message: "Failed to update user status." });
  }
});

// Reset a user's password
router.post("/users/reset-password", adminAuth, async (req, res) => {
  const { userId, newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ success: false, message: "Password must be at least 6 characters long." });
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.password = hashedPassword;
    await user.save();

    res.json({ success: true, message: "Password reset successfully!" });
  } catch (error) {
    console.error("Error resetting password:", error.message);
    res.status(500).json({ success: false, message: "Failed to reset password." });
  }
});

// Edit a user's details
router.put("/users/edit", adminAuth, async (req, res) => {
  const { userId, name, email, balance } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (balance) user.balance = parseFloat(balance);

    await user.save();
    res.json({ success: true, message: "User updated successfully!" });
  } catch (error) {
    console.error("Error editing user:", error.message);
    res.status(500).json({ success: false, message: "Failed to edit user." });
  }
});

// Fetch all user messages with pagination
router.get("/messages", adminAuth, async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  try {
    const messages = await Message.find()
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalMessages = await Message.countDocuments();

    res.json({
      success: true,
      messages,
      pagination: {
        total: totalMessages,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalMessages / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching messages:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch messages." });
  }
});

// Respond to a message
router.post("/messages/respond", adminAuth, async (req, res) => {
  const { messageId, response } = req.body;

  if (!response) {
    return res.status(400).json({ success: false, message: "Response cannot be empty." });
  }

  try {
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    const adminResponse = new Message({
      sender: "admin",
      userId: message.userId,
      message: response,
    });

    await adminResponse.save();
    res.json({ success: true, message: "Response sent successfully!" });
  } catch (error) {
    console.error("Error sending response:", error.message);
    res.status(500).json({ success: false, message: "Failed to send response." });
  }
});

module.exports = router;
