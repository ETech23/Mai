const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const Message = require("../models/Message");

// Inline Middleware for Authentication
const authenticate = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("Token verification failed:", err.message);
    res.status(403).json({ success: false, message: "Invalid or expired token" });
  }
};

// Fetch user messages with pagination
router.get("/", auth, async (req, res) => {
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
router.post("/", auth, async (req, res) => {
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

module.exports = router;
