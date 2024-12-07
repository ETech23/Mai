const jwt = require("jsonwebtoken");
const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const User = require("../models/User");

// Inline Middleware for Authentication
const authenticate = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    console.log("Decoded token:", decoded); // Debugging: Log the token payload
    next();
  } catch (err) {
    console.error("Token verification failed:", err.message);
    res.status(403).json({ success: false, message: "Invalid or expired token" });
  }
};

/**
 * USER-SPECIFIC ROUTES
 */

// Fetch user messages with pagination
router.get("/", authenticate, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  try {
    const messages = await Message.find({ userId: req.user.id })
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const totalMessages = await Message.countDocuments({ userId: req.user.id });

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
    console.error("Error fetching messages:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Send a message (user to admin)
router.post("/", authenticate, async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ success: false, message: "Message content is required." });
  }

  try {
    const newMessage = new Message({
      sender: "user",
      userId: req.user.id,
      message,
    });
    await newMessage.save();
    res.json({ success: true, message: "Message sent successfully!" });
  } catch (error) {
    console.error("Error sending message:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * ADMIN-SPECIFIC ROUTES
 */

// Admin: Fetch all user messages with pagination
router.get("/admin/messages", authenticate, async (req, res) => {
  const { isAdmin } = req.user;
  if (!isAdmin) {
    return res.status(403).json({ success: false, message: "Admin access only" });
  }

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

// Admin: Fetch all users with referral count and filtering/sorting
router.get("/admin/users", authenticate, async (req, res) => {
  const { isAdmin } = req.user;
  if (!isAdmin) {
    return res.status(403).json({ success: false, message: "Admin access only" });
  }

  const { sortBy, order = "asc" } = req.query; // sortBy: "referrals" or "balance", order: "asc" or "desc"
  const sortOrder = order === "desc" ? -1 : 1;

  try {
    const users = await User.aggregate([
      {
        $addFields: {
          referralCount: { $size: "$referrals" }, // Add referral count (assuming referrals are stored as an array)
        },
      },
      {
        $sort:
          sortBy === "referrals"
            ? { referralCount: sortOrder }
            : sortBy === "balance"
            ? { balance: sortOrder }
            : {}, // Default: no sorting
      },
    ]);

    res.json({ success: true, users });
  } catch (error) {
    console.error("Error fetching users:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Admin: Respond to a message
router.post("/admin/respond", authenticate, async (req, res) => {
  const { isAdmin } = req.user;
  if (!isAdmin) {
    return res.status(403).json({ success: false, message: "Admin access only" });
  }

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
    user.notifications.push({ message: "You have a new message from admin." });
    await user.save();

    res.json({ success: true, message: "Response sent successfully!" });
  } catch (error) {
    console.error("Error responding to message:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
