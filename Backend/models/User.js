const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  resetToken: String,
  resetTokenExpires: Date,
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String, default: null },
  verificationTokenExpires: { type: Date, default: null },
  balance: { type: Number, default: 0 }, // Mining balance
  isAdmin: { type: Boolean, default: false }, // Admin
  referralCode: { type: String, unique: true }, // Unique referral code
  referredBy: { type: String, default: null }, // Referral code of the referrer
  referrals: { type: [String], default: [] }, // Array of referred user IDs
  isMining: { type: Boolean, default: false }, // Whether mining is currently active
  miningRate: { type: Number, default: 1 }, // Mining rate multiplier, boosted by referrals
  referralBonusCount: { type: Number, default: 0 }, // Number of successful referrals
  points: { type: Number, default: 0 }, // User's accumulated points
  miningProgress: { type: Number, default: 0 }, // Mining progress in percentage
  miningEndTime: { type: Date, default: null }, // End time of the mining session
}, {
  timestamps: true // Automatically add `createdAt` and `updatedAt` fields
});

module.exports = mongoose.model("User", userSchema);
