const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
  const token = req.header("Authorization");

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Replace with your JWT secret
    req.user = decoded; // Attach user info to the request object
    next();
  } catch (error) {
    res.status(403).json({ message: "Invalid or expired token" });
  }
};

module.exports = authenticate;
