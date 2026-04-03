import express from "express";
import cors from "cors";
import simulationRoutes from "./routes/simulation.routes.js";

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

export default app;