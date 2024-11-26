const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  balance: { type: Number, default: 0 },
  referralCode: { type: String, unique: true },
  referredBy: { type: String, default: null },
  referrals: { type: Number, default: 0 },
  miningBoost: { type: Number, default: 0 }, // Percentage boost for mining
});

module.exports = mongoose.model("User", userSchema);
