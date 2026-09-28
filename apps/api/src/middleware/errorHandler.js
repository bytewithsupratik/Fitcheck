import { AppError } from "../utils/errors.js";

export function errorHandler(err, req, res, next) {
  const requestId = req.requestId || "unknown";

  // Catch body-parser JSON syntax errors (e.g., empty whitespace or invalid JSON)
  if (err.type === "entity.parse.failed" || (err instanceof SyntaxError && "body" in err)) {
    return res.status(400).json({
      error: {
        code: "BAD_REQUEST",
        message: "Invalid or empty JSON payload in request body. Provide '{}' or valid JSON.",
        details: {},
        requestId,
      },
      message: "Invalid or empty JSON payload in request body",
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        requestId,
      },
      message: err.message,
    });
  }

  // Unhandled / system errors
  console.error(`[Error] Request ID: ${requestId}`, err);

  return res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred",
      details: {},
      requestId,
    },
    message: "An unexpected error occurred",
  });
}