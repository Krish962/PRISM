import dotenv from "dotenv";

dotenv.config();
//This reads the .env file from the project root and injects each key-value pair directly into Node.js’s global process.env object.

const nodeEnv = process.env.NODE_ENV;

export const env = {
  PORT: process.env.PORT,
  MONGO_URI: process.env.MONGO_URI,
  MONGO_DB_NAME: process.env.MONGO_DB_NAME,
  FRONTEND_URL: process.env.FRONTEND_URL,
  NODE_ENV: nodeEnv
};
