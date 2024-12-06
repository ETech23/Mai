const express = require("express");
const User = require("../models/User");
const adminAuth = require("../middleware/adminAuth");

const router = express.Router();

// Get all users with balances
router.get("/users", adminAuth, async (req, res) => {
  try {
    const users = await User.find({}, "name email balance"); // Select only necessary fields
    res.json({ success: true, users });
  } catch (error) {
    console.error("Error fetching users:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Send a message to a user
router.post("/message", adminAuth, async (req, res) => {
  const { userId, message } = req.body;

  if (!userId || !message) {
    return res.status(400).json({ success: false, message: "User ID and message are required" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Add the message to the user's notifications (assumes a `notifications` field in the user model)
    user.notifications = user.notifications || [];
    user.notifications.push({ message, timestamp: new Date() });
    await user.save();

    res.json({ success: true, message: "Message sent successfully" });
  } catch (error) {
    console.error("Error sending message:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Reset a user's password
router.post("/reset-password", adminAuth, async (req, res) => {
  const { userId, newPassword } = req.body;

  if (!userId || !newPassword) {
    return res.status(400).json({ success: false, message: "User ID and new password are required" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    console.error("Error resetting password:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Suspend or Unsuspend a User
router.post("/suspend", adminAuth, async (req, res) => {
  const { userId, isSuspended } = req.body;

  if (typeof isSuspended !== "boolean" || !userId) {
    return res.status(400).json({ success: false, message: "User ID and suspension status are required" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.isSuspended = isSuspended; // Update the suspension status
    await user.save();

    res.json({ success: true, message: `User ${isSuspended ? "suspended" : "unsuspended"} successfully` });
  } catch (error) {
    console.error("Error updating suspension status:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Edit User Details
router.put("/edit", adminAuth, async (req, res) => {
  const { userId, name, email, balance } = req.body;

  if (!userId) {
    return res.status(400).json({ success: false, message: "User ID is required" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Update fields if provided
    if (name) user.name = name;
    if (email) user.email = email;
    if (balance !== undefined) user.balance = balance;

    await user.save();

    res.json({ success: true, message: "User details updated successfully" });
  } catch (error) {
    console.error("Error editing user details:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
module.exports = router;
