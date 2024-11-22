const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// Register a user
router.post("/register", async (req, res) => {
  const { name, email, username, password, referredBy } = req.body;

  try {
    // Check if email or username already exists
    const emailExists = await User.findOne({ email });
    const usernameExists = await User.findOne({ username });
    if (emailExists || usernameExists) {
      return res.status(400).json({ message: "Email or username already exists." });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate a unique referral code
    const referralCode = `${username}-${Date.now()}`;

    // Create new user
    const newUser = new User({
      name,
      email,
      username,
      password: hashedPassword,
      referralCode,
      referredBy: referredBy || null,
    });

    // Save to database
    await newUser.save();

    // Send success response
    res.status(201).json({ username: newUser.username, balance: newUser.balance });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// Login a user
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    // Send success response
    res.json({
      name: user.name,
      username: user.username,
      email: user.email,
      balance: user.balance,
      referrals: user.referrals ? user.referrals.length : 0, // Safe check for referrals
      token,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// Export the router
module.exports = router; // Add this line
