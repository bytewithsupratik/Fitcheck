export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
export const API_KEY = import.meta.env.VITE_API_KEY || "";

export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem("fitcheck_auth_token");

  const headers = {
    "Content-Type": "application/json",
    ...(API_KEY ? { "X-Api-Key": API_KEY } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // Read the canonical error envelope we built on the backend
    const errorMessage = data?.message || data?.error?.message || "An unexpected error occurred";
    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

