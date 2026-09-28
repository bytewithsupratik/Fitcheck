import crypto from "crypto";

export function requestIdMiddleware(req, res, next) {
  const incomingId = req.headers["x-request-id"];
  const requestId = incomingId && typeof incomingId === "string" ? incomingId : crypto.randomUUID();

  req.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);
  next();
}