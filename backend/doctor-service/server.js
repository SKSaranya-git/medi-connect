import express from "express";
import dotenv from "dotenv";
import { registerService } from "consul-service";
import connectDB from "./src/config/db.js";
import authRoutes from "./src/routes/authRoutes.js";
import doctorRoutes from "./src/routes/doctorRoutes.js";
import prescriptionRoutes from "./src/routes/prescriptionRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3004;
const SERVICE_NAME = process.env.SERVICE_NAME || "doctor-service";

app.use(express.json());

// ─── Health Check (used by Consul) ───────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "OK", service: SERVICE_NAME });
});

// ─── Routes ──────────────────────────────────────────────────────
app.use("/api/doctors/auth", authRoutes);
app.use("/api/doctors/prescriptions", prescriptionRoutes);
app.use("/api/doctors", doctorRoutes);

// ─── Start Server ────────────────────────────────────────────────
const startServer = async () => {
  await connectDB();

  app.listen(PORT, async () => {
    console.log(`\n🩺 ${SERVICE_NAME} running on port ${PORT}`);

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
