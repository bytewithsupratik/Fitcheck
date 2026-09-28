import { ForbiddenError } from "../utils/errors.js";

export function requireOwnership(paramName = "userId") {
  return (req, res, next) => {
    const targetUserId = req.params[paramName] || req.query[paramName] || req.body[paramName];

    // If a target userId was specified and doesn't match the authenticated user
    if (targetUserId && targetUserId !== req.user.id) {
      return next(new ForbiddenError("Access denied: You do not own this resource"));
    }

    next();
  };
}