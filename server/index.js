const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const connectDB = require("./config/db");

// Load environment variables
dotenv.config();

const app = express();

// Allowed Origins (Supports Local + Production)
const allowedOrigins = [
  process.env.FRONTEND_URL,        // e.g., https://finance-manager.vercel.app
  process.env.PRODUCTION_URL,      // Optional second domain
  "http://localhost:5173",         // Vite default
  "http://localhost:3000",         // Create React App
  "http://127.0.0.1:5173",
].filter(Boolean); // Remove undefined/null values

// CORS Configuration - Secure & Flexible
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // Important: Allows cookies, auth headers
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// Optional: Extra safety net for preflight requests
app.options("*", cors()); // Enable pre-flight for all routes

// Logging
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Body Parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/deposits", require("./routes/deposits"));
app.use("/api/expenses", require("./routes/expenses"));
app.use("/api/balance", require("./routes/balance"));

// Health Check Route
app.get("/", (req, res) => {
  res.json({
    message: "Finance Manager API is running!",
    status: "success",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Handle 404
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global Error Handler (Optional - Recommended)
app.use((err, req, res, next) => {
  console.error("Server Error:", err.message);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === "production" ? "Internal Server Error" : err.message,
  });
});

// Start Server Only After DB Connection
const startServer = async () => {
  try {
    await connectDB();
    console.log("MongoDB Connected Successfully");

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Local: http://localhost:${PORT}`);
      if (process.env.FRONTEND_URL) {
        console.log(`Frontend URL: ${process.env.FRONTEND_URL}`);
      }
    });
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error.message);
    process.exit(1);
  }
};

startServer();