const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const User = require("../models/User");
const Message = require("../models/Message"); // Assuming a Message model exists

// Inline Middleware for Authentication
const authenticate = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1]; // Extract token
  if (!token) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify token
    req.user = decoded; // Attach decoded user to req
    next();
  } catch (err) {
    console.error("Invalid or expired token:", err.message);
    res.status(403).json({ success: false, message: "Invalid or expired token" });
  }
};

// Route for submitting a message
router.post("/", authenticate, async (req, res) => {
  const { subject, message } = req.body;

  if (!subject || !message) {
    return res.status(400).json({ success: false, message: "Subject and message are required" });
  }

  try {
    const user = await User.findById(req.user.id); // Fetch the user based on token
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const newMessage = new Message({
      userId: user._id,
      subject,
      message,
      createdAt: new Date(),
    });

    await newMessage.save(); // Save message to the database

    res.json({ success: true, message: "Message sent successfully" });
  } catch (err) {
    console.error("Error saving message:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
