// routes/energy.routes.js

import express from "express";
import { calculateEnergyController } from "../controllers/energy.controller.js";

const router = express.Router();

router.post("/calculate", calculateEnergyController);

export default router;