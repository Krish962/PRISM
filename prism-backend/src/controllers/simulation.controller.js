import { runSimulation } from "../services/simulation.service.js";

export async function runSimulationController(req, res) {

  try {

    const result = await runSimulation(req.body);

    res.json({
      status: "success",
      result
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Simulation failed"
    });

  }

}