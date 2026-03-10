// src/data-access/variety.repository.js

import Genotype from "../models/variety.model.js";

/**
 * Fetch genotype by variety code
 * Used when building DSSAT cultivar file (.CUL)
 */
export const findGenotypeByCode = async (varietyCode) => {
  return Genotype.findOne({
    variety_code: varietyCode,
    crop: "rice"
  })
    .select(
      "variety_code variety_name eco_type P1 P2R P5 G1 G2 G3 G4"
    )
    .lean();
};

/**
 * Fetch all available rice varieties
 * Useful for frontend dropdowns
 */
export const findAllRiceVarieties = async () => {
  return Genotype.find({ crop: "rice" })
    .select("variety_code variety_name eco_type")
    .lean();
};