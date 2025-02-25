const mongoose = require('mongoose');

// Define Mining Schema
const MiningSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  balance: {
    type: Number,
    default: 0
  },
  sessionActive: {
    type: Boolean,
    default: false
  },
  sessionStartTime: {
    type: Date,
    default: null
  },
  timeLeft: {
    type: Number,
    default: 3600
  }
});

module.exports = mongoose.model('Mining', MiningSchema);
