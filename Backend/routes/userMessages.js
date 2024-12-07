const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const Message = require("../models/Message");
const auth = require("../middleware/auth"); // Ensure this is correctly defined in your middleware

// Fetch user messages with pagination
router.get("/", auth, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  try {
    const messages = await Message.find({ userId: req.user.id })
      .sort({ timestamp: -1 }) // Most recent first
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
    console.error(`[GET /messages] Error fetching messages for user ${req.user.id}:`, error.message);
    res.status(500).json({ success: false, message: "Error fetching messages. Please try again later." });
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
    console.error(`[POST /messages] Error sending message for user ${req.user.id}:`, error.message);
    res.status(500).json({ success: false, message: "Error sending message. Please try again later." });
  }
});

module.exports = router;
