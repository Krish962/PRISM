import dotenv from "dotenv";

dotenv.config();

const nodeEnv = process.env.NODE_ENV || "development";

export const env = {
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI,
  FRONTEND_URL:
    process.env.FRONTEND_URL ||
    (nodeEnv === "development" ? "http://localhost:5173" : undefined),
  NODE_ENV: nodeEnv
};
