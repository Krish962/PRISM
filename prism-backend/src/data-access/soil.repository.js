// src/data-access/soil.repository.js

/**
 * Temporary dummy soil repository
 * Later this will fetch nearest soil profile from MongoDB
 */

export const findNearestSoil = async (latitude, longitude) => {
  return {
    location_id: "DUMMY_SOIL",
    location: {
      type: "Point",
      coordinates: [longitude, latitude]
    },

    layers: [
      {
        top_depth_cm: 0,
        bottom_depth_cm: 5,
        sand: 40,
        clay: 35,
        silt: 25,
        bulk_density: 1.25,
        field_capacity: 0.32,
        wilting_point: 0.15,
        organic_carbon: 1.2,
        ph: 6.5
      },
      {
        top_depth_cm: 5,
        bottom_depth_cm: 15,
        sand: 38,
        clay: 37,
        silt: 25,
        bulk_density: 1.3,
        field_capacity: 0.30,
        wilting_point: 0.14,
        organic_carbon: 0.9,
        ph: 6.4
      },
      {
        top_depth_cm: 15,
        bottom_depth_cm: 30,
        sand: 36,
        clay: 40,
        silt: 24,
        bulk_density: 1.35,
        field_capacity: 0.28,
        wilting_point: 0.13,
        organic_carbon: 0.6,
        ph: 6.3
      }
    ]
  };
};