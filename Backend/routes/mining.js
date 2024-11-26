const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const router = express.Router();

// Update Mining Balance
router.post("/update", async (req, res) => {
  const { balance } = req.body;
  const token = req.header("Authorization")?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.balance = parseFloat((user.balance || 0) + balance).toFixed(4);
    await user.save();

    res.json({ message: "Balance updated successfully", newBalance: user.balance });
  } catch (error) {
    console.error("Error updating balance:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
