import express from "express";
import cors from "cors";
import { env } from "./config/env.config.js";
import simulationRoutes from "./routes/simulation.routes.js";
import energyRoutes from "./routes/energy.routes.js";
import batchRoutes from "./routes/batch.routes.js";

const app = express();

if (!env.FRONTEND_URL) {
  throw new Error("FRONTEND_URL must be configured outside development");
}

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true
  })
);

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    status: "UP",
    message: "PRISM backend is running"
  });
});

app.use("/api/simulation", simulationRoutes);
app.use("/api/energy", energyRoutes);
app.use("/api/batch", batchRoutes);

export default app;