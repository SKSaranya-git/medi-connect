import consulClient from "./consulClient.js";
import os from "os";

/**
 * Registers a service with Consul.
 *
 * @param {Object} options
 * @param {string} options.name      - Service name (e.g., "appointment-service")
 * @param {number} options.port      - Port the service is running on
 * @param {string} [options.healthPath="/health"] - HTTP health check path
 * @param {string} [options.healthInterval="10s"] - Health check interval
 * @returns {Promise<string>} The generated service ID
 */
export const registerService = async ({
  name,
  port,
  healthPath = "/health",
  healthInterval = "10s",
}) => {
  const hostname = os.hostname();
  const serviceId = `${name}-${hostname}-${port}`;
  const address = process.env.SERVICE_HOST || "127.0.0.1";

  const serviceDefinition = {
    ID: serviceId,
    Name: name,
    Address: address,
    Port: port,
    Tags: ["mediconnect", name],
    Check: {
      HTTP: `http://${address}:${port}${healthPath}`,
      Interval: healthInterval,
      Timeout: "5s",
      DeregisterCriticalServiceAfter: "30s",
    },
  };

  try {
    await consulClient.registerService(serviceDefinition);
    console.log(`[Consul] ✅ Registered "${name}" (ID: ${serviceId}) at ${address}:${port}`);

    // Set up graceful deregistration on shutdown
    const shutdown = async () => {
      await deregisterService(serviceId);
      process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);

    return serviceId;
  } catch (error) {
    console.error(`[Consul] ❌ Failed to register "${name}":`, error.message);
    throw error;
  }
};

/**
 * Deregisters a service from Consul.
 *
 * @param {string} serviceId - The service ID to deregister
 */
export const deregisterService = async (serviceId) => {
  try {
    await consulClient.deregisterService(serviceId);
    console.log(`[Consul] 🛑 Deregistered service (ID: ${serviceId})`);
  } catch (error) {
    console.error(`[Consul] ❌ Failed to deregister "${serviceId}":`, error.message);
  }
};
