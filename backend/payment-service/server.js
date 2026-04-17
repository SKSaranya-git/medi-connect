import express from "express";
import dotenv from "dotenv";
import { registerService } from "consul-service";
import { initDB } from "./src/config/db.js";
import paymentRoute from "./src/routes/paymentRoute.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const SERVICE_NAME = process.env.SERVICE_NAME || "payment-service";

app.use(express.json());

// ─── Health Check (used by Consul) ───────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "OK", service: SERVICE_NAME });
});

// ─── Routes ──────────────────────────────────────────────────────
app.use("/api/payments", paymentRoute);

// ─── Start Server ────────────────────────────────────────────────
const startServer = async () => {
  try {
    await initDB();
    console.log("Connected to MongoDB");

    app.listen(PORT, async () => {
      console.log(`Payment service running on port ${PORT}`);

      // Register with Consul
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
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();