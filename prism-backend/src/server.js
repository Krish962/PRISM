import app from "./app.js";
import { connectDB } from "./config/db.config.js";
import { env } from "./config/env.config.js";

const startServer = async () => {
  app.listen(env.PORT, "0.0.0.0", () => {
    console.log(`PRISM backend running on 0.0.0.0:${env.PORT}`);
  });

  try {
    await connectDB();
  } catch (error) {
    console.error("MongoDB is unavailable; API is running without database access:", error.message);
  }
};

startServer();
