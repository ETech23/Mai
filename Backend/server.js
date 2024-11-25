const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const path = require("path"); // Required to serve static files
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

// Serve static files for the frontend
app.use(express.static(path.join(__dirname, "Frontend")));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/mining", require("./routes/mining"));

// Catch-all route for referral links and other unhandled paths
app.get("/register", (req, res) => {
  const { ref } = req.query;
  if (ref) {
    // Handle referral query string if provided
    res.sendFile(path.join(__dirname, "Frontend/index.html")); // Serve registration frontend
  } else {
    // If no referral code, redirect to the home page
    res.redirect("/");
  }
});

// Handle other routes
app.get("*", (req, res) => {
  res.status(404).send("Page not found");
});

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
