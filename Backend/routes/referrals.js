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

// Add a referral
router.post("/add", auth, async (req, res) => {
  try {
    const { referredBy } = req.body; // The referral code of the referrer

    const referrer = await User.findOne({ referralCode: referredBy });
    if (!referrer) return res.status(404).json({ success: false, message: "Referrer not found" });

    // Update referrer's referral count and streak level
    referrer.referralBonusCount += 1;
    referrer.streakLevel = determineStreakLevel(referrer.referralBonusCount);
    await referrer.save();

    res.json({
      success: true,
      message: "Referral added successfully",
      streakLevel: referrer.streakLevel,
    });
  } catch (error) {
    console.error("Error adding referral:", error);
    res.status(500).json({ success: false, message: "Failed to add referral" });
  }
});

module.exports = router;
