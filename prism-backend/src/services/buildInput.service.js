import { getNearestSoil } from "../data-access/soil.repository.js";

export async function buildSimulationInput(requestBody) {

  const latitude = requestBody.location.latitude;
  const longitude = requestBody.location.longitude;

  const soil = await getNearestSoil(latitude, longitude);

  if (!soil) {
    throw new Error("No soil profile found for this location");
  }

  const inputData = {
    latitude,
    longitude,

    crop: requestBody.crop,

    soil: {
      soil_id: soil.soil_id,
      layers: soil.layers
    },

    management: requestBody.management
  };

  //console.log(inputData.soil);
  return inputData;
}