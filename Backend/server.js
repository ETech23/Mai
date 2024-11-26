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

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/mining", require("./routes/mining"));

// Referral redirect to frontend
app.get("/register", (req, res) => {
  const { ref } = req.query;
  if (ref) {
    return res.redirect(`https://mai-psi.vercel.app/register?ref=${ref}`);
  }
  return res.redirect("https://mai-psi.vercel.app/register");
});

// Handle 404 errors
app.use((req, res) => {
  res.status(404).json({ message: "API route not found" });
});

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
