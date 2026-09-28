import { supabase } from "../db/client.js";
import { userRepository } from "../repositories/userRepository.js";
import { learnerRepository } from "../repositories/learnerRepository.js";
import { BadRequestError, ConflictError, UnauthorizedError } from "../utils/errors.js";

export const authService = {
  async register({ email, password, username }) {
    if (!email || !password) {
      throw new BadRequestError("Email and password are required");
    }

    // Fallback username derived from email if not provided
    const cleanUsername = (username || email.split("@")[0]).replace(/[^A-Za-z0-9_.-]/g, "_");

    // Check if user already exists
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictError("An account with this email already exists");
    }

    // 1. Create auth user in Supabase
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      if (authError.message.includes("already registered")) {
        throw new ConflictError("An account with this email already exists");
      }
      throw new BadRequestError(authError.message);
    }

    // 2. Create canonical record in public.users
    const user = await userRepository.create({
      authUserId: authData.user.id,
      email,
      username: cleanUsername,
    });

    // 3. Idempotently provision the public.learners projection
    await learnerRepository.ensureForUser(user.id);

    return {
      id: user.id,
      email: user.email,
      username: user.username,
    };
  },

  async login({ email, password }) {
    if (!email || !password) {
      throw new BadRequestError("Email and password are required");
    }

    // 1. Verify credentials with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new UnauthorizedError("Invalid email or password");
    }

    // 2. Resolve internal application user
    const user = await userRepository.findByAuthUserId(data.user.id);
    if (!user) {
      throw new UnauthorizedError("User profile not found");
    }

    // 3. Ensure the learner projection exists
    await learnerRepository.ensureForUser(user.id);

    return {
      token: data.session.access_token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    };
  },
};