import jwt from "jsonwebtoken";

/**
 * Gateway-level JWT authentication middleware.
 *
 * This middleware is optional — it can be applied to specific routes
 * at the gateway level, or each service can handle its own auth.
 *
 * Usage in server.js:
 *   app.use("/api/patients/profile", gatewayAuth);
 *   app.use("/api/doctors/profile", gatewayAuth);
 */

const JWT_SECRET = process.env.JWT_SECRET || "mediconnect-jwt-secret-key-2026";

const gatewayAuth = (req, res, next) => {
  // Skip auth for public routes
  const publicPaths = [
    "/auth/register",
    "/auth/login",
    "/health",
    "/api/symptoms",
    "/api/doctors/specializations",
  ];

  const isPublic = publicPaths.some((path) => req.originalUrl.includes(path));
  if (isPublic) {
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(); // Let the downstream service handle auth
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    // Attach user info to headers for downstream services
    req.headers["x-user-id"] = decoded.id;
    req.headers["x-user-email"] = decoded.email;
    req.headers["x-user-role"] = decoded.role;
    next();
  } catch (error) {
    // Don't block — let downstream service handle invalid tokens
    next();
  }
};

export default gatewayAuth;
