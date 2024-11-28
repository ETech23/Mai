const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

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
app.use(cors({
  origin: "https://mai-psi.vercel.app", // Use your frontend URL
  methods: ["GET", "POST"],
  credentials: true,
}));

// Debugging: Log incoming requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Handle referral redirects
app.get("/register", (req, res) => {
  const { ref } = req.query;
  console.log("Referral Code Received:", ref); // Debugging

  if (ref) {
    return res.redirect(`https://mai-psi.vercel.app/register?ref=${ref}`);
  }
  return res.redirect("https://mai-psi.vercel.app/register");
});

// API Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/mining", require("./routes/mining"));

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
