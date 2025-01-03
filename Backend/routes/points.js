const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// User Schema (if not already defined)
const User = mongoose.model('User', new mongoose.Schema({
  username: String,
  email: String,
  points: { type: Number, default: 0 }
}));

// Middleware to mock authentication (Replace with your actual auth middleware)
const authenticateUser = (req, res, next) => {
  req.user = { id: '12345' }; // Replace with actual user ID from authentication
  next();
};

// Route to get user points
router.get('/points', authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ points: user.points });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route to update points based on time spent
router.post('/points', authenticateUser, async (req, res) => {
  try {
    const { increment } = req.body; // Points increment sent from frontend
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.points += increment;
    await user.save();

    res.json({ message: 'Points updated', points: user.points });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
