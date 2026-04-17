import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import { registerService, discoverAllServices } from "consul-service";
import { setupProxies } from "./src/proxy/proxySetup.js";
import gatewayAuth from "./src/middleware/authMiddleware.js";
import errorHandler from "./src/middleware/errorHandler.js";
import routeMap from "./src/config/serviceRegistry.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// ─── Global Middleware ───────────────────────────────────────────
app.use(cors());
app.use(morgan("dev"));
app.use(gatewayAuth);

// ─── Health Check ────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    service: "MediConnect API Gateway",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ─── Notifications Test Pass-Through ────────────────────────────
app.get("/api/notifications/test", (req, res) => {
  res.json({
    success: true,
    message: "Gateway can route notification requests.",
    service: "notification-service",
    status: "ok",
  });
});

// ─── Service Discovery Endpoint (live from Consul) ──────────────
app.get("/api/services", async (req, res) => {
  try {
    const services = await discoverAllServices();
    res.json({ source: "consul", services });
  } catch (error) {
    // Fallback to static route map if Consul is unreachable
    const fallback = Object.entries(routeMap).map(([path, route]) => ({
      name: route.serviceName,
      path,
      status: "unknown (Consul unavailable)",
    }));
    res.json({ source: "static-fallback", services: fallback });
  }
});

// ─── Proxy Routes ────────────────────────────────────────────────
setupProxies(app);

// ─── 404 Handler ─────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.method} ${req.originalUrl} is not available on this gateway.`,
    availableRoutes: Object.keys(routeMap),
  });
});

// ─── Error Handler ───────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ────────────────────────────────────────────────
const startGateway = async () => {
  app.listen(PORT, async () => {
    console.log(`\n🚀 MediConnect API Gateway running on port ${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/health`);
    console.log(`   Services:     http://localhost:${PORT}/api/services\n`);

    // Register gateway itself with Consul
    try {
      await registerService({
        name: "gateway-service",
        port: Number(PORT),
        healthPath: "/health",
      });
    } catch (error) {
      console.warn("[Gateway] ⚠️  Could not register with Consul. Gateway will still work but won't appear in service registry.");
    }
  });
};

startGateway();
