const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const userMessages = require("./routes/userMessages");
const adminRoutes = require("./routes/admin");
const bodyParser = require('body-parser');
const userProgressRoutes = require("./routes/userProgress");

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS Middleware
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "https://mai-psi.vercel.app",
  "https://demo.maichain.site",
];


const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests from allowedOrigins or if the origin is undefined (e.g., same-origin requests)
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true); // Allow the request
    } else {
      callback(new Error("Not allowed by CORS")); // Block the request
    }
  },
  credentials: true, // Allow cookies and credentials
};

app.use(cors(corsOptions));

// Debugging Middleware
app.use((req, res, next) => {
  const now = new Date().toISOString();
  console.log(`[${now}] ${req.method} ${req.url}`);
  next();
});

// Referral Redirect Route
app.get("/register", (req, res) => {
  const { ref } = req.query;

  if (ref) {
    console.log(`[Referral Redirect] Referral Code Received: ${ref}`);
    return res.redirect(`${process.env.FRONTEND_URL || "https://mai-psi.vercel.app"}/register?ref=${ref}`);
  }

  console.log(`[Referral Redirect] No referral code provided.`);
  return res.redirect(`${process.env.FRONTEND_URL || "https://mai-psi.vercel.app"}/register`);
});

// API Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/mining", require("./routes/mining"));
app.use("/api/articles", require("./routes/articles")); // Includes reactions
app.use("/api/tasks", require("./routes/tasks"));
app.use("/api/messages", userMessages);
app.use("/api/admin", adminRoutes);
// Import points route
app.use('/api/points', require('./routes/points'));
app.use('/api/mining', require('./routes/api/mining'));

app.use("/api/user/progress", userProgressRoutes);

// Catch-all Route for Unmatched Endpoints
app.use((req, res) => {
  console.error(`[404] Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ message: "Route not found" });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(`[Error] ${err.message}`);
  res.status(500).json({ message: "Internal Server Error" });
});

// Start the Server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL || "https://mai-psi.vercel.app"}`);
});
