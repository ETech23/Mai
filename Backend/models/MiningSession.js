// models/MiningSession.js
const mongoose = require("mongoose");

const MiningSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  startTime: { type: Date, required: true },
  duration: { type: Number, required: true }, // in milliseconds
  isActive: { type: Boolean, default: true },
});

module.exports = mongoose.model("MiningSession", MiningSessionSchema);
