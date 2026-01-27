import express from "express";

const app = express();

// Middleware
app.use(express.json());

// Health check route
app.get("/health", (req, res) => {
  res.json({
    status: "UP",
    message: "PRISM backend is running"
  });
});

export default app;
