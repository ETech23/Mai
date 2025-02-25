const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const MiningModel = require('../../models/Mining');

// @route   GET /api/mining/status
// @desc    Get user's mining status
// @access  Private
// @route   GET /api/mining/status
// @desc    Get user's mining status (call this after login)
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

    // If a session is active, calculate elapsed time and update balance
    if (userMining.sessionActive && userMining.sessionStartTime) {
      const elapsedTime = Math.floor((Date.now() - userMining.sessionStartTime) / 1000);

      if (elapsedTime >= userMining.timeLeft) {
        // Session expired while user was logged out
        const earnedTokens = userMining.timeLeft * MINING_RATE; // Calculate earned tokens
        userMining.balance += earnedTokens; // Add earned tokens to balance
        userMining.sessionActive = false;
        userMining.sessionStartTime = null;
        userMining.timeLeft = 0;
      } else {
        // Session still active
        const earnedTokens = elapsedTime * MINING_RATE; // Calculate earned tokens
        userMining.balance += earnedTokens; // Add earned tokens to balance
        userMining.timeLeft -= elapsedTime; // Update time left
        userMining.sessionStartTime = new Date(); // Reset start time to now
      }

      await userMining.save();
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
// @route   POST /api/mining/update
// @desc    Update user's mining status
// @access  Private
const mongoose = require('mongoose');

// @route   POST /api/mining/update
// @desc    Update user's mining status
// @access  Private
router.post('/update', auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user.id;
    const { balance, sessionActive, sessionStartTime, timeLeft } = req.body;

    // Find user's mining record or create one
    let userMining = await MiningModel.findOne({ userId }).session(session);

    if (!userMining) {
      userMining = new MiningModel({
        userId,
        balance: 0,
        sessionActive: false,
        sessionStartTime: null,
        timeLeft: 3600
      });
    }

    // Additive balance update
    if (balance !== undefined && typeof balance === 'number' && balance > 0) {
      userMining.balance += balance; // Add the incoming balance to the existing balance
    }

    // Update session state
    if (sessionActive !== undefined) {
      userMining.sessionActive = sessionActive;
    }

    if (sessionStartTime !== undefined) {
      userMining.sessionStartTime = sessionStartTime;
    }

    if (timeLeft !== undefined) {
      userMining.timeLeft = timeLeft;
    }

    await userMining.save({ session });

    await session.commitTransaction();
    session.endSession();

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
    await session.abortTransaction();
    session.endSession();

    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/mining/start
// @desc    Start a mining session
// @access  Private
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
        balance: 0, // Initialize balance to 0 if no record exists
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

    // Start new session (only update session-related fields)
    userMining.sessionActive = true;
    userMining.sessionStartTime = new Date();
    userMining.timeLeft = 3600; // Reset timeLeft to 1 hour (3600 seconds)

    await userMining.save();

    res.json({
      success: true,
      data: {
        balance: userMining.balance, // Return the existing balance
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

    // Calculate elapsed time if not provided
    const sessionStartTime = userMining.sessionStartTime;
    const elapsedTime = timeSpent || Math.floor((Date.now() - sessionStartTime) / 1000);

    // Calculate earned amount if not provided
    const calculatedEarnedAmount = earnedAmount || (elapsedTime * MINING_RATE); // Replace MINING_RATE with your actual rate

    // Update mining record
    userMining.sessionActive = false;
    userMining.sessionStartTime = null;
    userMining.balance += calculatedEarnedAmount; // Add earned amount to balance
    userMining.timeLeft = Math.max(0, userMining.timeLeft - elapsedTime); // Update time left

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

// @route   POST /api/mining/logout
// @desc    Save mining state and log out
// @access  Private
router.post('/logout', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { balance, sessionActive, sessionStartTime, timeLeft } = req.body;

    // Find user's mining record
    const userMining = await MiningModel.findOne({ userId });

    if (!userMining) {
      return res.status(404).json({
        success: false,
        message: 'Mining record not found'
      });
    }

    // Update mining state
    if (balance !== undefined) {
      userMining.balance = balance;
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

    // Log out the user (clear token or session)
    // Example: Clear the user's token from the database or session store
    // await UserModel.updateOne({ _id: userId }, { token: null });

    res.json({
      success: true,
      message: 'Mining state saved and user logged out'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
