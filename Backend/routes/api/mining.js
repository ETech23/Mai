const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const MiningModel = require('../../models/Mining');

// @route   GET /api/mining/status
// @desc    Get user's mining status
// @access  Private
router.get('/status', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userMining = await MiningModel.findOne({ userId });
    
    if (!userMining) {
      return res.json({ 
        balance: 0,
        sessionActive: false,
        sessionStartTime: null,
        timeLeft: 3600
      });
    }
    
    res.json({
      balance: userMining.balance,
      sessionActive: userMining.sessionActive,
      sessionStartTime: userMining.sessionStartTime,
      timeLeft: userMining.timeLeft
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/mining/update
// @desc    Update user's mining status
// @access  Private
router.post('/update', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { balance, sessionActive, sessionStartTime, timeLeft } = req.body;

    // Find user's mining record or create one
    let userMining = await MiningModel.findOne({ userId });

    if (!userMining) {
      userMining = new MiningModel({
        userId,
        balance: 0,
        sessionActive: false,
        sessionStartTime: null,
        timeLeft: 3600
      });
    }

    // Update with new values
    if (balance !== undefined) {
      userMining.balance = Math.max(userMining.balance, balance); // Always use the highest balance
    }

    if (sessionActive !== undefined) {
      userMining.sessionActive = sessionActive;
    }

    if (sessionStartTime !== undefined) {
      userMining.sessionStartTime = sessionStartTime;
    }

    if (timeLeft !== undefined) {
      userMining.timeLeft = timeLeft;
    }

    await userMining.save();

    res.json({
      success: true,
      data: {
        balance: userMining.balance,
        sessionActive: userMining.sessionActive,
        sessionStartTime: userMining.sessionStartTime,
        timeLeft: userMining.timeLeft
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/mining/start
// @desc    Start a mining session
// @access  Private
router.post('/start', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find user's mining record or create one
    let userMining = await MiningModel.findOne({ userId });
    
    if (!userMining) {
      userMining = new MiningModel({
        userId,
        balance: 0,
        sessionActive: false,
        sessionStartTime: null,
        timeLeft: 3600
      });
    }
    
    // Check if user already has an active session
    if (userMining.sessionActive) {
      return res.status(400).json({ 
        success: false, 
        message: 'Mining session already active' 
      });
    }
    
    // Start new session
    userMining.sessionActive = true;
    userMining.sessionStartTime = new Date();
    
    await userMining.save();
    
    res.json({ 
      success: true,
      data: {
        balance: userMining.balance,
        sessionActive: userMining.sessionActive,
        sessionStartTime: userMining.sessionStartTime,
        timeLeft: userMining.timeLeft
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/mining/stop
// @desc    Stop a mining session
// @access  Private
router.post('/stop', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { earnedAmount, timeSpent } = req.body;
    
    // Find user's mining record
    const userMining = await MiningModel.findOne({ userId });
    
    if (!userMining) {
      return res.status(404).json({ 
        success: false, 
        message: 'Mining record not found' 
      });
    }
    
    // Check if user has an active session
    if (!userMining.sessionActive) {
      return res.status(400).json({ 
        success: false, 
        message: 'No active mining session found' 
      });
    }
    
    // Update mining record
    userMining.sessionActive = false;
    userMining.sessionStartTime = null;
    
    // Add earned amount to balance
    if (earnedAmount && typeof earnedAmount === 'number' && earnedAmount > 0) {
      userMining.balance += earnedAmount;
    }
    
    // Update time left if provided
    if (timeSpent && typeof timeSpent === 'number' && timeSpent > 0) {
      // Ensure timeLeft doesn't go below 0
      userMining.timeLeft = Math.max(0, userMining.timeLeft - timeSpent);
    }
    
    await userMining.save();
    
    res.json({ 
      success: true,
      data: {
        balance: userMining.balance,
        sessionActive: userMining.sessionActive,
        sessionStartTime: userMining.sessionStartTime,
        timeLeft: userMining.timeLeft
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/mining/reset
// @desc    Reset mining timer (e.g., for daily reset)
// @access  Private
router.post('/reset', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find user's mining record
    let userMining = await MiningModel.findOne({ userId });
    
    if (!userMining) {
      userMining = new MiningModel({
        userId,
        balance: 0,
        sessionActive: false,
        sessionStartTime: null,
        timeLeft: 3600
      });
    } else {
      // Reset timer but keep balance
      userMining.timeLeft = 3600; // Reset to 1 hour (3600 seconds)
      userMining.sessionActive = false;
      userMining.sessionStartTime = null;
    }
    
    await userMining.save();
    
    res.json({ 
      success: true,
      data: {
        balance: userMining.balance,
        sessionActive: userMining.sessionActive,
        sessionStartTime: userMining.sessionStartTime,
        timeLeft: userMining.timeLeft
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
