import express from "express";
import cors from "cors";
import moduleRoutes from "./modules/index.js";

const app = express();

// Middlewares
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Billing Software API is active and healthy",
    data: {
      uptime: process.uptime(),
      timestamp: new Date(),
    },
    error: null,
  });
});

// Central API Router mounting
app.use("/api/v1", moduleRoutes);

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl} - Route not found`,
    data: null,
    error: "NOT_FOUND",
  });
});

// Central Error Handler
app.use((err, req, res, next) => {
  console.error("[Global Error Caught]:", err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal server error occurred",
    data: null,
    error: process.env.NODE_ENV === "development" ? err.stack : "INTERNAL_ERROR",
  });
});

export default app;
