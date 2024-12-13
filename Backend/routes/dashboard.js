const express = require("express");
const router = express.Router();
const User = require("../models/User");
const auth = require("../middleware/auth");

// Helper function to determine streak level
function determineStreakLevel(referralCount) {
  if (referralCount < 5) return "Regular";
  if (referralCount < 10) return "Intermediate";
  if (referralCount < 15) return "Advanced";
  if (referralCount < 20) return "Expert";
  return "Master";
}

// Update streak level based on referrals
router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("name email referrals referralBonusCount streakLevel");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Update streak level if necessary
    const newStreakLevel = determineStreakLevel(user.referralBonusCount);
    if (user.streakLevel !== newStreakLevel) {
      user.streakLevel = newStreakLevel;
      await user.save();
    }

    res.json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        referrals: user.referrals.length,
        referralBonusCount: user.referralBonusCount,
        streakLevel: user.streakLevel,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({ success: false, message: "Failed to fetch dashboard data" });
  }
});

module.exports = router;
