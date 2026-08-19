import express from "express";
import { runBatchSimulation } from "../controllers/batchSimulation.controller.js";

const router = express.Router();

router.post("/run", runBatchSimulation);

export default router;