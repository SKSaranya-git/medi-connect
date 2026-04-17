/**
 * Consul HTTP API Client
 *
 * Uses Node.js built-in fetch to interact with Consul's REST API.
 * No external dependencies required — the `consul` npm package is deprecated.
 *
 * Consul HTTP API docs: https://developer.hashicorp.com/consul/api-docs
 */

const getBaseUrl = () => {
  const host = process.env.CONSUL_HOST || "127.0.0.1";
  const port = process.env.CONSUL_PORT || "8500";
  return `http://${host}:${port}/v1`;
};

/**
 * Makes an HTTP request to the Consul API.
 */
const consulRequest = async (path, options = {}) => {
  const url = `${getBaseUrl()}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Consul API error (${response.status}): ${body}`);
  }

  // Some Consul endpoints return empty body on success (e.g., PUT register)
  const text = await response.text();
  return text ? JSON.parse(text) : null;
};

/**
 * Consul API client object with methods for common operations.
 */
const consulClient = {
  /**
   * Register a service with the local Consul agent.
   * PUT /v1/agent/service/register
   */
  registerService: async (serviceDefinition) => {
    await consulRequest("/agent/service/register", {
      method: "PUT",
      body: JSON.stringify(serviceDefinition),
    });
  },

  /**
   * Deregister a service from the local Consul agent.
   * PUT /v1/agent/service/deregister/:serviceId
   */
  deregisterService: async (serviceId) => {
    await consulRequest(`/agent/service/deregister/${serviceId}`, {
      method: "PUT",
    });
  },

  /**
   * List all services registered with the local agent.
   * GET /v1/agent/services
   */
  listServices: async () => {
    return await consulRequest("/agent/services");
  },

  /**
   * Get healthy instances of a service.
   * GET /v1/health/service/:serviceName?passing=true
   */
  getHealthyInstances: async (serviceName) => {
    return await consulRequest(`/health/service/${serviceName}?passing`);
  },

  /**
   * List all health checks for the local agent.
   * GET /v1/agent/checks
   */
  listChecks: async () => {
    return await consulRequest("/agent/checks");
  },
};

console.log(`[Consul] Client configured → ${getBaseUrl()}`);

export default consulClient;
