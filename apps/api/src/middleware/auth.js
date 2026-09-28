import { supabase } from "../db/client.js";
import { userRepository } from "../repositories/userRepository.js";
import { UnauthorizedError } from "../utils/errors.js";

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader) {
      console.warn(`[Auth] [${req.requestId}] Missing Authorization header on ${req.method} ${req.originalUrl}`);
      throw new UnauthorizedError("Authentication token required");
    }

    if (!authHeader.startsWith("Bearer ")) {
      console.warn(`[Auth] [${req.requestId}] Header does not start with 'Bearer ' on ${req.method} ${req.originalUrl}`);
      throw new UnauthorizedError("Malformed authorization header. Expected 'Bearer <token>'");
    }

    const token = authHeader.slice(7).trim();

    if (!token || token === "null" || token === "undefined") {
      console.warn(`[Auth] [${req.requestId}] Token string is empty or invalid on ${req.method} ${req.originalUrl}`);
      throw new UnauthorizedError("Authentication token is empty or invalid");
    }

    // Validate token with Supabase Auth
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      console.warn(`[Auth] [${req.requestId}] Supabase token validation failed: ${error?.message}`);
      throw new UnauthorizedError("Invalid or expired session token");
    }

    // Resolve internal public.users record
    const internalUser = await userRepository.findByAuthUserId(data.user.id);
    if (!internalUser) {
      throw new UnauthorizedError("User profile does not exist in application database");
    }

    // Attach verified identity to request
    req.user = {
      id: internalUser.id,
      email: internalUser.email,
      username: internalUser.username,
      authUserId: internalUser.auth_user_id,
    };

    next();
  } catch (error) {
    next(error);
  }
}