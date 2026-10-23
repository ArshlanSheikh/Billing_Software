import "dotenv/config";

import app from "./app.js";
import { connectDB } from "./config/db.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    const server = app.listen(PORT, () => {
      console.log(`[Server] Server running in ${process.env.NODE_ENV || "development"} mode on http://localhost:${PORT}`);
    });

    const handleExit = (signal) => {
      console.log(`\n[Server] Received ${signal}, closing server gracefully...`);
      server.close(() => {
        console.log("[Server] HTTP server closed.");
        process.exit(0);
      });
    };

    process.on("SIGINT", () => handleExit("SIGINT"));
    process.on("SIGTERM", () => handleExit("SIGTERM"));
  } catch (error) {
    console.error("[Server Error] Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
