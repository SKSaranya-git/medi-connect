import consulClient from "./consulClient.js";

// Simple cache to avoid hitting Consul on every request
const cache = new Map();
const CACHE_TTL = 5000; // 5 seconds

/**
 * Discovers a healthy instance of a service by name.
 * Returns the address and port of a healthy instance.
 * Results are cached for 5 seconds.
 *
 * @param {string} serviceName - Name of the service to discover
 * @returns {Promise<{ address: string, port: number } | null>}
 */
export const discoverService = async (serviceName) => {
  // Check cache first
  const cached = cache.get(serviceName);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const instances = await consulClient.getHealthyInstances(serviceName);

    if (!instances || instances.length === 0) {
      console.warn(`[Consul] ⚠️  No healthy instances found for "${serviceName}"`);
      return null;
    }

    // Pick the first healthy instance (for future: implement load balancing)
    const instance = instances[0];
    const result = {
      address: instance.Service.Address || "127.0.0.1",
      port: instance.Service.Port,
    };

    // Update cache
    cache.set(serviceName, { data: result, timestamp: Date.now() });

    return result;
  } catch (error) {
    console.error(`[Consul] ❌ Discovery failed for "${serviceName}":`, error.message);

    // Return stale cache if available
    if (cached) {
      console.warn(`[Consul] Using stale cache for "${serviceName}"`);
      return cached.data;
    }

    return null;
  }
};

/**
 * Discovers all registered services with their health status.
 *
 * @returns {Promise<Array<{ name: string, id: string, address: string, port: number, status: string }>>}
 */
export const discoverAllServices = async () => {
  try {
    const serviceMap = await consulClient.listServices();
    const checks = await consulClient.listChecks();
    const results = [];

    for (const [id, service] of Object.entries(serviceMap)) {
      // Skip Consul's own internal service
      if (service.Service === "consul") continue;

      // Find the health check for this service
      const serviceCheck = Object.values(checks).find(
        (check) => check.ServiceID === id
      );
      const status = serviceCheck ? serviceCheck.Status : "unknown";

      results.push({
        name: service.Service,
        id: id,
        address: service.Address || "127.0.0.1",
        port: service.Port,
        status: status,
        tags: service.Tags || [],
      });
    }

    return results;
  } catch (error) {
    console.error("[Consul] ❌ Failed to discover services:", error.message);
    return [];
  }
};

/**
 * Clears the discovery cache.
 */
export const clearCache = () => {
  cache.clear();
};
