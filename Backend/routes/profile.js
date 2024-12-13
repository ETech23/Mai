const express = require("express");
const router = express.Router();
const User = require("../models/User");
const auth = require("../middleware/auth");

// Helper Function to Determine Streak Level
function determineStreakLevel(referralCount) {
  if (referralCount < 5) return "Regular";
  if (referralCount < 10) return "Intermediate";
  if (referralCount < 15) return "Advanced";
  if (referralCount < 20) return "Expert";
  return "Master";
}

// Fetch User Profile
router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const referralCount = user.referrals.length;
    const streakLevel = determineStreakLevel(referralCount);

    res.json({
      success: true,
      name: user.name,
      email: user.email,
      username: user.username,
      balance: user.balance,
      referralCount,
      streakLevel,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch user profile." });
  }
});

module.exports = router;
