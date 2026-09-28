import { apiFetch } from "./apiConfig";

export const authService = {
  async register({ email, password, username }) {
    const data = await apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, username }),
    });

    // Automatically log in after registration if token returned, or return user
    if (data.token) {
      localStorage.setItem("fitcheck_auth_token", data.token);
    }
    return data;
  },

  async login({ email, password }) {
    const data = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (data.token) {
      localStorage.setItem("fitcheck_auth_token", data.token);
    }
    return data;
  },

  async logout() {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch (e) {
      // Ignore network errors during logout
    } finally {
      localStorage.removeItem("fitcheck_auth_token");
    }
  },

  async getProfile() {
    return apiFetch("/user/profile");
  },

  isAuthenticated() {
    return !!localStorage.getItem("fitcheck_auth_token");
  },
};