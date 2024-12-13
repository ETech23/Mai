const express = require("express");
const router = express.Router();
const User = require("../models/User");
const auth = require("../middleware/auth");

// Get streak level for a user
router.get("/streak-level/:userId", auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("referralCount streakLevel");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({
      success: true,
      referralCount: user.referralCount,
      streakLevel: user.streakLevel,
    });
  } catch (error) {
    console.error("Error fetching streak level:", error);
    res.status(500).json({ success: false, message: "Failed to fetch streak level" });
  }
});

module.exports = router;
