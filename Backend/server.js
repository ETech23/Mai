const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Allow specific origins
app.use(
  cors({
    origin: "https://mai-psi.vercel.app/", // Replace with your frontend domain
    methods: "GET,POST",
    credentials: true,
  })
);

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/mining", require("./routes/mining"));

// Catch-all route for referral links
app.get("/register", (req, res) => {
  const { ref } = req.query;
  if (ref) {
    // If the referral code is present, redirect to the frontend with the referral query
    res.redirect(`https://mai-psi.vercel.app/register?ref=${ref}`);
  } else {
    // Redirect to the main registration page if no referral code is provided
    res.redirect("https://mai-psi.vercel.app/register");
  }
});

// Handle other routes
app.use((req, res) => {
  res.status(404).json({ message: "API route not found" });
});

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
