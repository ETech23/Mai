const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  const authHeader = req.header("Authorization");

  // Ensure the Authorization header exists
  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  // Check for the "Bearer" prefix and extract the token
  const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : authHeader;

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach the decoded token (user info) to the request object
    req.user = decoded;
    
    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    console.error("Error verifying token:", error.message);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

module.exports = auth;
