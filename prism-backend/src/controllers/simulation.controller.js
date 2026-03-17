import { buildSimulationInput } from "../services/buildInput.service.js";
import { runSimulation } from "../services/simulation.service.js";

export async function runSimulationController(req, res) {

  try {

    const inputData = await buildSimulationInput(req.body);

    const result = await runSimulation(inputData);

    res.json(result);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: err.message
    });

  }
}