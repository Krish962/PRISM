// src/data-access/climate.repository.js
import Climate from "../models/climate.model.js";

/**
 * Find weather records from MongoDB for a given location and year range.
 * Uses 2dsphere geospatial $near query to find the nearest 0.5 deg grid,
 * matching the exact flow and architecture of getNearestSoil.
 */
export async function getNearestClimate(latitude, longitude, startYear, endYear) {
  const lat = Number(latitude);
  const lon = Number(longitude);
  const sYear = Number(startYear) || new Date().getFullYear();
  const eYear = Number(endYear) || sYear;

  // 1. 2dsphere nearest-neighbor lookup matching soil flow
  let nearest = null;
  try {
    nearest = await Climate.findOne({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [lon, lat] // [longitude, latitude]
          }
        }
      }
    }).lean();
  } catch (err) {
    console.warn("[ClimateRepository] 2dsphere lookup warning:", err.message);
  }

  // Fallback to bounding-box if 2dsphere index not yet built
  if (!nearest) {
    const tolerance = 0.45;
    const candidates = await Climate.find({
      latitude: { $gte: lat - tolerance, $lte: lat + tolerance },
      longitude: { $gte: lon - tolerance, $lte: lon + tolerance }
    }).limit(10).lean();

    if (candidates && candidates.length > 0) {
      nearest = candidates.reduce((best, curr) => {
        const dBest = Math.hypot(best.latitude - lat, best.longitude - lon);
        const dCurr = Math.hypot(curr.latitude - lat, curr.longitude - lon);
        return dCurr < dBest ? curr : best;
      });
    }
  }

  if (!nearest) {
    console.log(`[ClimateRepository] No weather grid found near (${lat}, ${lon}) in database`);
    return null;
  }

  // 2. Fetch all yearly documents for this nearest grid_id in [sYear, eYear]
  const yearDocs = await Climate.find({
    grid_id: nearest.grid_id,
    year: { $gte: sYear, $lte: eYear }
  }).sort({ year: 1 }).lean();

  if (!yearDocs || yearDocs.length === 0) {
    console.log(`[ClimateRepository] Grid ${nearest.grid_id} found, but no records for years ${sYear}-${eYear}`);
    // If exact years are not available, return available years for climatology
    const anyDocs = await Climate.find({ grid_id: nearest.grid_id }).limit(10).sort({ year: -1 }).lean();
    if (!anyDocs || anyDocs.length === 0) return null;

    return {
      grid_id: nearest.grid_id,
      latitude: nearest.latitude,
      longitude: nearest.longitude,
      elevation: nearest.elevation || 50,
      source: nearest.source || "NASA POWER Bulk",
      is_climatology_fallback: true,
      records: anyDocs.map(d => ({
        year: d.year,
        daily: d.daily
      }))
    };
  }

  return {
    grid_id: nearest.grid_id,
    latitude: nearest.latitude,
    longitude: nearest.longitude,
    elevation: nearest.elevation || 50,
    source: nearest.source || "NASA POWER Bulk",
    records: yearDocs.map(d => ({
      year: d.year,
      daily: d.daily
    }))
  };
}

export const findClimateByLocation = getNearestClimate;

/**
 * Upsert a climate document (1 grid cell for 1 year)
 */
export const upsertClimateGridYear = async (climateData) => {
  return await Climate.findOneAndUpdate(
    { grid_id: climateData.grid_id, year: climateData.year },
    { $set: climateData },
    { upsert: true, new: true }
  );
};