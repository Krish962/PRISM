import { DEFAULT_MANAGEMENT } from "./defaults.js";

export const buildSimulationInput = ({
  location = {},
  climate = {},
  soil = {},
  genotype = {},
  management = {}
}) => {

  // ----------------------------
  // 1. Climate transformation
  // ----------------------------

  const climateData = {
    year: climate.year,
    daily: (climate.daily || []).map(day => ({
      doy: Number(day.doy),
      srad: Number(day.srad),
      tmax: Number(day.tmax),
      tmin: Number(day.tmin),
      rain: Number(day.rain)
    }))
  };

  // ----------------------------
  // 2. Soil transformation
  // ----------------------------

  const soilData = {
    layers: (soil.layers || []).map(layer => ({
      bottom_depth_cm: Number(layer.depth_cm),
      clay: Number(layer.clay),
      silt: Number(layer.silt),
      bulk_density: Number(layer.bulk_density),
      field_capacity: Number(layer.field_capacity),
      wilting_point: Number(layer.wilting_point)
    }))
  };

  // ----------------------------
  // 3. Genotype transformation
  // ----------------------------

  const genotypeParams = genotype.parameters || genotype;

  const genotypeData = {
    variety_code: genotype.variety_code || "IB0012",

    P1: Number(genotypeParams.P1 ?? 255),
    P2R: Number(genotypeParams.P2R ?? 96.4),
    P5: Number(genotypeParams.P5 ?? 378),
    G1: Number(genotypeParams.G1 ?? 77),
    G2: Number(genotypeParams.G2 ?? 0.02),
    G3: Number(genotypeParams.G3 ?? 1),
    G4: Number(genotypeParams.G4 ?? 1)
  };

  // ----------------------------
  // 4. Management (defaults + user input)
  // ----------------------------

  const managementData = {
    ...DEFAULT_MANAGEMENT,
    ...management
  };

  // ----------------------------
  // 5. Location
  // ----------------------------

  const locationData = {
    latitude: Number(location.latitude),
    longitude: Number(location.longitude)
  };

  // ----------------------------
  // 6. Final simulation input
  // ----------------------------

  return {
    location: locationData,
    climate: climateData,
    soil: soilData,
    genotype: genotypeData,
    management: managementData
  };
};