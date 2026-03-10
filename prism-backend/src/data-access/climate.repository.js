// src/data-access/climate.repository.js

/**
 * Temporary dummy climate repository
 * Generates synthetic weather data
 */

export const findClimateByLocation = async (latitude, longitude, year = 2024) => {

  const daily = [];

  for (let i = 1; i <= 365; i++) {
    daily.push({
      doy: i,
      srad: 18 + Math.random() * 5,     // MJ/m²/day
      tmax: 30 + Math.random() * 3,
      tmin: 22 + Math.random() * 3,
      rain: Math.random() < 0.3 ? Math.random() * 20 : 0
    });
  }

  return {
    grid_id: "DUMMY_GRID",
    latitude,
    longitude,
    elevation: 50,
    year,
    daily
  };
};