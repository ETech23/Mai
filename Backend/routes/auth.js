const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();
const auth = require("../middleware/auth"); // Import auth middleware

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

    // Update referrer if applicable
    if (referredBy) {
      const referrer = await User.findOne({ referralCode: referredBy });
      if (referrer) {
        referrer.referrals.push(newUser._id);
        referrer.miningRate = parseFloat((referrer.miningRate || 1) * 1.05).toFixed(2);
        await referrer.save();
      } else {
        return res.status(400).json({ message: "Invalid referral code" });
      }
    }

    // Save the new user
    await newUser.save();

    res.status(201).json({
      username: newUser.username,
      message: "Registration successful",
    });
  } catch (err) {
    console.error("Error during registration:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// Login a user
router.post("/login", async (req, res) => {
  const { identifier, password } = req.body;

  try {
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "576h" });

    res.json({
      token,
      balance: user.balance, // Include balance in the response
      username: user.username,
    });
  } catch (err) {
    console.error("Error during login:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// Get user details
router.get("/details", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password")
      .populate("referrals", "username email balance");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      name: user.name,
      username: user.username,
      email: user.email,
      balance: user.balance,
      miningRate: user.miningRate,
      referrals: user.referrals,
      referralCode: user.referralCode,
    });
  } catch (err) {
    console.error("Error fetching user details:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
