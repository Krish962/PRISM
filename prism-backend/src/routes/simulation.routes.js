import express from "express";
import { runSimulationController } from "../controllers/simulation.controller.js";

const router = express.Router();

router.post("/run", runSimulationController);

export default router;