import { getNearestSoil } from "../data-access/soil.repository.js";
import { getNearestClimate } from "../data-access/climate.repository.js";

export async function buildSimulationInput(requestBody) {
  const latitude = requestBody.location.latitude;
  const longitude = requestBody.location.longitude;
  const trtno = requestBody.treatments ? requestBody.treatments.length : requestBody.trtno;

  const plantDateStr = requestBody.management?.planting?.date;
  const harvestDateStr = requestBody.management?.harvestDate;
  const startYear = plantDateStr ? new Date(plantDateStr).getFullYear() : new Date().getFullYear();
  const endYear = harvestDateStr ? new Date(harvestDateStr).getFullYear() : startYear;

  const [soil, climate] = await Promise.all([
    getNearestSoil(latitude, longitude),
    getNearestClimate(latitude, longitude, startYear, endYear).catch(err => {
      console.warn("[buildSimulationInput] Climate lookup warning:", err.message);
      return null;
    })
  ]);

  if (!soil) {
    throw new Error("No soil profile found for this location");
  }

  const inputData = {
    latitude,
    longitude,
    trtno,
    crop: requestBody.crop,

    soil: {
      soil_id: soil.soil_id,
      layers: soil.layers
    },

    climate: climate || null,

    management: requestBody.management,
    treatments: requestBody.treatments
  };

  return inputData;
}