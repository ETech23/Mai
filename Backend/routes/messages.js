const jwt = require("jsonwebtoken");
const express = require("express");
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

// Fetch user messages
router.get("/", authenticate, async (req, res) => {
  try {
    const messages = await Message.find({ userId: req.user.id }).sort({ timestamp: 1 });
    res.json({ success: true, messages });
  } catch (error) {
    console.error("Error fetching messages:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Send a message
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

module.exports = router;
