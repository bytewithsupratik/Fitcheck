import dotenv from "dotenv";

dotenv.config();

const requiredEnv = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const env = {
  PORT: process.env.PORT || 4000,
  NODE_ENV: process.env.NODE_ENV || "development",
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  INTELLIGENCE_SERVICE_URL: process.env.INTELLIGENCE_SERVICE_URL || "http://localhost:8000",
  INTELLIGENCE_TIMEOUT_MS: parseInt(process.env.INTELLIGENCE_TIMEOUT_MS || "15000", 10),
};