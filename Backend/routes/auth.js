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

    // If referredBy exists, update the referrer's referrals count
    if (referredBy) {
  const referrer = await User.findOne({ referralCode: referredBy });
  if (referrer) {
    console.log("Referrer found:", referrer.username); // Log referrer's username
    referrer.referrals = referrer.referrals || [];
    referrer.referrals.push(newUser._id);
    console.log("Updated referrals array:", referrer.referrals); // Log the updated referrals array
    await referrer.save();
    console.log("Referrer saved successfully.");
  } else {
    console.log("No referrer found for referral code:", referredBy);
  }
}

    // Save new user to the database
    await newUser.save();

    // Send success response
    res.status(201).json({
      username: newUser.username,
      balance: newUser.balance || 0,
      message: "Registration successful",
    });
  } catch (err) {
    console.error("Error in registration:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// Login a user
router.post("/login", async (req, res) => {
  const { identifier, password } = req.body;

  try {
    // Determine if the identifier is an email or username
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });

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
      balance: user.balance || 0,
      referrals: user.referrals || 0,
      token,
    });
  } catch (err) {
    console.error("Error in login:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// Get user details
router.get("/details", async (req, res) => {
  const token = req.header("Authorization")?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user details
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      name: user.name,
      username: user.username,
      email: user.email,
      balance: user.balance || 0,
      referrals: user.referrals || 0,
    });
  } catch (err) {
    console.error("Error fetching user details:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
