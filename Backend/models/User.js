const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  balance: { type: Number, default: 0 }, // Mining balance
  referralCode: { type: String, unique: true }, // Unique referral code
  referredBy: { type: String, default: null }, // Referral code of the referrer
  referrals: { type: [String], default: [] }, // Array of referred user IDs
  isMining: { type: Boolean, default: false }, // Whether mining is currently active
});

module.exports = mongoose.model("User", userSchema);
