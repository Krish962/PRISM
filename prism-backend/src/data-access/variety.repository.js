import Genotype from "../models/variety.model.js";

/**
 * Fetch genotype by variety code
 */
export const findGenotypeByCode = async (varietyCode) => {
  return Genotype.findOne({
    variety_code: varietyCode,
    crop: "rice"
  }).lean();
};

/**
 * Fetch all available rice varieties
 * (useful later for dropdowns)
 */
export const findAllRiceVarieties = async () => {
  return Genotype.find({ crop: "rice" })
    .select("variety_code variety_name eco_type")
    .lean();
};
