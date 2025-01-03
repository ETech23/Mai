const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const User = require("../models/User");

// Inline Middleware for Authentication
const authenticate = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1]; // Extract token from Authorization header
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify token using JWT_SECRET
    req.user = decoded; // Attach decoded user to req.user
    next();
  } catch (err) {
    console.error("Invalid or expired token:", err.message);
    res.status(403).json({ message: "Invalid or expired token" });
  }
};

// **Get User Points**
router.get("/", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id); // Use req.user.id from the decoded token
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, points: user.points || 0 });
  } catch (error) {
    console.error("Error fetching user points:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// **Update User Points**
router.post("/", authenticate, async (req, res) => {
  try {
    const { increment } = req.body; // Points increment sent from the frontend

    if (typeof increment !== "number" || increment <= 0) {
      return res.status(400).json({ success: false, message: "Invalid increment value" });
    }

    const user = await User.findById(req.user.id); // Find user by decoded token ID
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.points = (user.points || 0) + increment; // Add increment to user's points
    await user.save();

    res.json({ success: true, message: "Points updated successfully", points: user.points });
  } catch (error) {
    console.error("Error updating user points:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
