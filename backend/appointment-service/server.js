import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { registerService } from "consul-service";
import appointmentRoute from "./src/routes/appointmentRoute.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const SERVICE_NAME = process.env.SERVICE_NAME || "appointment-service";

app.use(express.json());

// ─── Health Check (used by Consul) ───────────────────────────────
app.get("/health", (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  if (isDbConnected) {
    res.json({ status: "OK", service: SERVICE_NAME, db: "connected" });
  } else {
    res.status(503).json({ status: "UNHEALTHY", service: SERVICE_NAME, db: "disconnected" });
  }
});

// ─── Routes ──────────────────────────────────────────────────────
app.use("/api/appointments", appointmentRoute);

// ─── Start Server ────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log("Connected to MongoDB");

  app.listen(PORT, async () => {
    console.log(`Appointment service running on port ${PORT}`);

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
}).catch((error) => {
  console.error("Error connecting to MongoDB:", error);
});