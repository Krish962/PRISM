import express from "express";
import { simulate } from "../controllers/simulation.controller.js";

const router = express.Router();

router.post("/simulate", simulate);

export default router;