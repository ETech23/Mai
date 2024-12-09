const jwt = require("jsonwebtoken");
const User = require("../models/User");

const adminAuth = async (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    req.user = user; // Attach user info to request
    next();
  } catch (error) {
    console.error("Admin authentication failed:", error.message);
    res.status(403).json({ success: false, message: "Invalid or expired token" });
  }
};

module.exports = adminAuth;
