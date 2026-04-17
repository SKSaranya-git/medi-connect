import express from "express";
import dotenv from "dotenv";
import { registerService } from "consul-service";
import symptomRoutes from "./src/routes/symptomRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3007;
const SERVICE_NAME = process.env.SERVICE_NAME || "ai-symptom-service";

app.use(express.json());

// ─── Health Check (used by Consul) ───────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "OK", service: SERVICE_NAME });
});

// ─── Routes ──────────────────────────────────────────────────────
app.use("/api/symptoms", symptomRoutes);

// ─── Start Server ────────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`\n🤖 ${SERVICE_NAME} running on port ${PORT}`);

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
