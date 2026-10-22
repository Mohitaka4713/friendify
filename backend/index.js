import { app } from "./src/server.js";
import { connectDB, getIsDbConnected } from "./src/lib/db.js";
import dotenv from "dotenv";
import http from "http";

dotenv.config({
  path: "./.env",
});

const PORT = parseInt(process.env.PORT || "8001", 10);

async function startServer(retries = 2) {
  await connectDB();

  const server = http.createServer(app);

  server.on("error", async (err) => {
    if (err.code === "EADDRINUSE" && retries > 0) {
      console.warn(`⚠️ Port ${PORT} is busy. Automatically freeing it and retrying...`);
      try {
        const { default: killPort } = await import("kill-port");
        await killPort(PORT);
        setTimeout(() => startServer(retries - 1), 1000);
      } catch (killErr) {
        console.error("Could not auto-kill port:", killErr.message);
      }
    } else {
      console.error("Server error:", err);
    }
  });

  server.listen(PORT, () => {
    const mode = getIsDbConnected()
      ? "MongoDB Connected"
      : "Temporary In-Memory DB Mode (Active)";
    console.log(`===============================================`);
    console.log(`🚀 Friendify Server is running on port ${PORT}`);
    console.log(`📦 Storage Engine: [${mode}]`);
    console.log(`===============================================`);
  });

  // Graceful shutdown so the port is freed immediately on restart
  const cleanup = () => {
    server.close(() => {
      process.exit(0);
    });
  };

  process.once("SIGUSR2", () => {
    server.close(() => {
      process.kill(process.pid, "SIGUSR2");
    });
  });

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
}

startServer().catch((error) => {
  console.error("Critical error during server startup:", error);
});
