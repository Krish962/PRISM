import { findNearestSoil } from "../data-access/soil.repository.js";
import { findClimateByLocation } from "../data-access/climate.repository.js";
import { findGenotypeByCode } from "../data-access/variety.repository.js";
import { buildSimulationInput } from "../simulation/inputBuilder.js";
import { runSimulation } from "../simulation/runSimulation.js";

export const runSimulationService = async ({
  latitude,
  longitude,
  varietyCode,
  management
}) => {

  // 1. Get soil
  const soil = await findNearestSoil(latitude, longitude);

  // 2. Get climate
  const climate = await findClimateByLocation(latitude, longitude);

  // 3. Get genotype
  const genotype = await findGenotypeByCode(varietyCode);

  if (!soil) throw new Error("Soil data not found");
  if (!climate) throw new Error("Climate data not found");
  if (!genotype) throw new Error("Genotype not found");

  // 4. Build simulation input
  const simulationInput = buildSimulationInput({
        location: { latitude, longitude },
        climate,
        soil,
        genotype,
        management
   });

  // 5. Run simulation
  const result = await runSimulation(simulationInput);

  return result;
};