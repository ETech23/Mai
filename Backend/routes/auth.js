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

    // Update referrer's profile
    if (referredBy) {
      const referrer = await User.findOne({ referralCode: referredBy });
      if (referrer) {
        console.log("Referrer found:", referrer.username);

        // Add the new user to referrer's referrals list
        referrer.referrals.push(newUser._id);

        // Boost mining rate by 5%
        referrer.miningRate = parseFloat((referrer.miningRate || 1) * 1.05).toFixed(2);

        await referrer.save();
        console.log("Referrer updated successfully.");
      } else {
        console.log("Invalid referral code:", referredBy);
      }
    }

    // Save the new user
    await newUser.save();

    res.status(201).json({
      username: newUser.username,
      balance: newUser.balance,
      message: "Registration successful",
    });
  } catch (err) {
    console.error("Error during registration:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Login a user
router.post("/login", async (req, res) => {
  const { identifier, password } = req.body;

  try {
    // Find user by email or username
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({
      name: user.name,
      username: user.username,
      email: user.email,
      balance: user.balance,
      miningRate: user.miningRate,
      referralsCount: user.referrals.length,
      token,
    });
  } catch (err) {
    console.error("Error during login:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
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
    const user = await User.findById(decoded.id)
      .select("-password")
      .populate("referrals", "username email balance"); // Populate referral details

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      name: user.name,
      username: user.username,
      email: user.email,
      balance: user.balance,
      miningRate: user.miningRate,
      referrals: user.referrals, // Send detailed referral information
      user.referralCode, // Send referral code
    });
  } catch (err) {
    console.error("Error fetching user details:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
