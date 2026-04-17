/**
 * Global error handler middleware for the API Gateway.
 */

const errorHandler = (err, req, res, next) => {
  console.error(`[Gateway Error] ${err.message}`);

  // Proxy errors (downstream service unreachable)
  if (err.code === "ECONNREFUSED" || err.code === "ECONNRESET") {
    return res.status(503).json({
      error: "Service Unavailable",
      message: "The requested service is currently unavailable. Please try again later.",
    });
  }

  // Timeout errors
  if (err.code === "ETIMEDOUT" || err.code === "ESOCKETTIMEDOUT") {
    return res.status(504).json({
      error: "Gateway Timeout",
      message: "The downstream service did not respond in time.",
    });
  }

  // Default server error
  res.status(err.status || 500).json({
    error: "Internal Server Error",
    message: err.message || "An unexpected error occurred.",
  });
};

export default errorHandler;
