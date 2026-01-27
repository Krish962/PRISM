import Soil from "../models/soil.model.js";

/**
 * Find nearest soil profile for given latitude & longitude
 * Uses MongoDB 2dsphere index
 */
export const findNearestSoil = async (lat, lon) => {
  return Soil.findOne({
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [lon, lat]   // MongoDB expects [lon, lat]
        }
      }
    }
  }).lean();
};
