import "dotenv/config";
import express from "express";
import { registerService } from "consul-service";
import connectDB from "./src/config/db.js";
import authRoutes from "./src/routes/authRoutes.js";
import patientRoutes from "./src/routes/patientRoutes.js";

const app = express();
const PORT = process.env.PORT || 3003;
const SERVICE_NAME = process.env.SERVICE_NAME || "patient-service";

app.use(express.json());

// ─── Health Check (used by Consul) ───────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "OK", service: SERVICE_NAME });
});

// ─── Routes ──────────────────────────────────────────────────────
app.use("/api/patients/auth", authRoutes);
app.use("/api/patients", patientRoutes);

// ─── Start Server ────────────────────────────────────────────────
const startServer = async () => {
  await connectDB();

  app.listen(PORT, async () => {
    console.log(`\n🏥 ${SERVICE_NAME} running on port ${PORT}`);

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
};

startServer();
