import { createProxyMiddleware } from "http-proxy-middleware";
import { discoverService } from "consul-service";
import routeMap from "../config/serviceRegistry.js";

/**
 * Creates proxy middleware for each registered route
 * and mounts them on the Express app.
 *
 * Service URLs are resolved dynamically from Consul
 * at request time via the `router` option.
 */
export const setupProxies = (app) => {
  for (const [path, route] of Object.entries(routeMap)) {
    const proxyMiddleware = createProxyMiddleware({
      // `router` is called on every request to resolve the target dynamically
      router: async (req) => {
        const instance = await discoverService(route.serviceName);
        if (instance) {
          return `http://${instance.address}:${instance.port}`;
        }

        if (route.fallbackTarget) {
          console.warn(
            `[Proxy] Consul discovery unavailable for "${route.serviceName}". Falling back to ${route.fallbackTarget}`
          );
          return route.fallbackTarget;
        }

        throw new Error(`No healthy instances of "${route.serviceName}" found in Consul`);
      },
      // Target is a required fallback (router overrides it)
      target: "http://127.0.0.1",
      changeOrigin: true,
      // Preserve the full original gateway path (e.g. /api/appointments)
      // because app.use(path, ...) strips the mount prefix from req.url.
      pathRewrite: (_path, req) => req.originalUrl,
      timeout: 30000,
      proxyTimeout: 30000,
      on: {
        proxyReq: (proxyReq, req, res) => {
          proxyReq.setHeader("X-Forwarded-By", "MediConnect-Gateway");
          proxyReq.setHeader("X-Request-Time", new Date().toISOString());
          console.log(
            `[Proxy] ${req.method} ${req.originalUrl} → ${route.displayName}`
          );
        },
        error: (err, req, res) => {
          console.error(`[Proxy Error] ${route.displayName}: ${err.message}`);
          if (!res.headersSent) {
            res.status(503).json({
              error: "Service Unavailable",
              message: `${route.displayName} is currently unavailable.`,
            });
          }
        },
      },
    });

    app.use(path, proxyMiddleware);
    console.log(`[Gateway] Route ${path} → ${route.displayName} (via Consul: "${route.serviceName}")`);
  }
};
