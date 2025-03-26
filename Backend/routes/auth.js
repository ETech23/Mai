const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { OAuth2Client } = require("google-auth-library");

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;             const client = new OAuth2Client(CLIENT_ID);

const router = express.Router();
const auth = require("../middleware/auth"); // Import auth middleware

// Nodemailer setup with Zoho Mail
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.zoho.com",  // Zoho SMTP server
  port: 465,              // Secure SSL port
  secure: true,           // Use SSL
  auth: {
    user: process.env.ZOHO_EMAIL,       // Your Zoho email
    pass: process.env.ZOHO_PASSWORD,    // Your Zoho App Password
  },
});

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

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "90d" });

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

// **1. Request Password Reset**
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) return res.status(400).json({ message: "User not found" });

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

  user.resetToken = token;
  user.resetTokenExpires = Date.now() + 3600000; // Token expires in 1 hour
  await user.save();

  const resetLink = `${process.env.FRONTEND_URL}/reset-password.html?token=${token}`;

  await transporter.sendMail({
    from: process.env.ZOHO_EMAIL,
    to: email,
    subject: "Password Reset Request",
    html: `<p>Click the link below to reset your password:</p>
           <a href="${resetLink}">${resetLink}</a>
           <p>This link expires in 1 hour.</p>`,
  });

  res.json({ message: "Password reset email sent!" });
});

// **2. Reset Password**
router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ _id: decoded.userId, resetToken: token });

    if (!user || user.resetTokenExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = null;
    user.resetTokenExpires = null;
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (error) {
    res.status(400).json({ message: "Invalid token" });
  }
});

const { sendVerificationEmail } = require("../emailService");

// Request email verification
router.post("/request-email-verification", async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) return res.status(400).json({ message: "User not found" });

  if (user.isVerified) return res.status(400).json({ message: "Email already verified" });

  const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "24h" });

  user.verificationToken = token;
  user.verificationTokenExpires = Date.now() + 24 * 3600000; // 24 hours expiry
  await user.save();

  await sendVerificationEmail(email, token);

  res.json({ message: "Verification email sent! Check your inbox." });
});

// Verify email
router.get("/verify-email", async (req, res) => {
  const { token } = req.query;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ email: decoded.email });

    if (!user || user.isVerified || user.verificationToken !== token || Date.now() > user.verificationTokenExpires) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpires = null;
    await user.save();

    res.redirect(`${process.env.FRONTEND_URL}/email-verified.html`);
  } catch (error) {
    res.status(400).json({ message: "Invalid token" });
  }
});

// Get verification status
router.get("/verification-status", async (req, res) => {
  const { email } = req.query;
  const user = await User.findOne({ email });

  if (!user) return res.status(404).json({ message: "User not found" });

  res.json({ isVerified: user.isVerified });
});


// Google Sign-In Callback
router.post("/google/callback", async (req, res) => {
    const { token } = req.body;

    try {
        // Verify the Google ID token
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: CLIENT_ID,
        });

        const payload = ticket.getPayload();
        console.log("User verified:", payload);

        // Check if the user already exists in the database
        let user = await User.findOne({ email: payload.email });

        if (!user) {
            // User does not exist: Create a new account
            user = new User({
                name: payload.name,
                email: payload.email,
                username: payload.email.split("@")[0], // Use email prefix as username
                password: "google-sign-in", // Placeholder password
                picture: payload.picture,
            });

            await user.save();
        }

        // Generate a JWT token for your app
        const backendToken = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "90d" }
        );

        // Return the token and user data
        res.json({
            success: true,
            token: backendToken,
            user: {
                name: user.name,
                email: user.email,
                picture: user.picture,
                balance: user.balance,
                isAdmin: user.isAdmin,
            },
        });
    } catch (error) {
        console.error("Error verifying token:", error);
        res.status(400).json({ success: false, error: "Invalid token" });
    }
});


module.exports = router;
