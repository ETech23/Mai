const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const messagesRoutes = require("./routes/messages");
const adminRoutes = require("./routes/admin");

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Allow specific origins with proper CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "https://mai-psi.vercel.app", // Ensure FRONTEND_URL is set in your environment variables
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// Debugging: Log incoming requests with method, URL, and time
app.use((req, res, next) => {
  const now = new Date().toISOString();
  console.log(`[${now}] ${req.method} ${req.url}`);
  next();
});

// Handle referral redirects
app.get("/register", (req, res) => {
  const { ref } = req.query;

  // Log the referral code for debugging purposes
  if (ref) {
    console.log(`[Referral Redirect] Referral Code Received: ${ref}`);
    return res.redirect(`${process.env.FRONTEND_URL || "https://mai-psi.vercel.app"}/register?ref=${ref}`);
  }

  // Redirect to the generic registration page if no referral code is provided
  console.log(`[Referral Redirect] No referral code provided.`);
  return res.redirect(`${process.env.FRONTEND_URL || "https://mai-psi.vercel.app"}/register`);
});

// API Routes
// Import and use the tasks route
app.use("/api/admin", adminRoutes);

app.use("/api/messages", messagesRoutes);
app.use("/api/tasks", require("./routes/tasks"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/mining", require("./routes/mining"));
app.use("/api/articles", require("./routes/articles")); // Includes reactions

// Catch-all route for unmatched endpoints
app.use((req, res) => {
  console.error(`[404] Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ message: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(`[Error] ${err.message}`);
  res.status(500).json({ message: "Internal Server Error" });
});

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL || "https://mai-psi.vercel.app"}`);
});
