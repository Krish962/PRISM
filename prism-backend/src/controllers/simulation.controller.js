import { runSimulationService } from "../services/simulation.service.js";

export const simulate = async (req, res) => {

  try {

    const {
      latitude,
      longitude,
      varietyCode,
      management
    } = req.body;

    const result = await runSimulationService({
      latitude,
      longitude,
      varietyCode,
      management
    });

    res.json({
      success: true,
      result
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      error: err.message
    });

  }

};