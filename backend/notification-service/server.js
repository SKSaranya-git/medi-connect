import express from "express";
import dotenv from "dotenv";
import { registerService } from "consul-service";
import connectDB from "./src/config/db.js";
import notificationRoutes from "./src/routes/notificationRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3006;
const SERVICE_NAME = process.env.SERVICE_NAME || "notification-service";

app.use(express.json());

// ─── Health Check (used by Consul) ───────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "OK", service: SERVICE_NAME });
});

// ─── Routes ──────────────────────────────────────────────────────
app.use("/api/notifications", notificationRoutes);

// ─── Start Server ────────────────────────────────────────────────
const startServer = async () => {
  await connectDB();

  app.listen(PORT, async () => {
    console.log(`\n🔔 ${SERVICE_NAME} running on port ${PORT}`);

    try {
      await registerService({
        name: SERVICE_NAME,
        port: Number(PORT),
        healthPath: "/health",
      });
    } catch (error) {
      console.warn("⚠️  Could not register with Consul. Service will still work independently.");
    }
  });
};

startServer();
