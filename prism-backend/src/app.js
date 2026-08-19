import express from "express";
import cors from "cors";
import simulationRoutes from "./routes/simulation.routes.js";
import energyRoutes from "./routes/energy.routes.js";
import batchRoutes from "./routes/batch.routes.js";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
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