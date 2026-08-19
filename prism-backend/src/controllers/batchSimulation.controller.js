import { runBatchSimulationService } from "../services/batchSimulation.service.js";
import { buildSimulationInput } from "../services/buildInput.service.js";

export async function runBatchSimulation(req, res) {
    try {
        const inputData = await buildSimulationInput(req.body);
        const result = await runBatchSimulationService(inputData);

        return res.status(200).json(result);
    } catch (err) {
        console.error(err);

        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
}