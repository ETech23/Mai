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
app.use(cors());
app.use(bodyParser.json());

app.get("/register", (req, res) => {
  const { ref } = req.query;

  // Redirect to the frontend with the referral code (if provided)
  if (ref) {
    return res.redirect(`https://mai-psi.vercel.app/register?ref=${ref}`);
  }

  // If no referral code, redirect to the main registration page
  return res.redirect("https://mai-psi.vercel.app/register");
});

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/mining", require("./routes/mining"));

// Allow specific origins
app.use(cors({
  origin: "https://mai-psi.vercel.app/", // Replace with your frontend domain
  methods: "GET,POST",
  credentials: true,
}));

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
