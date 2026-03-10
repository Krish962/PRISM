import mongoose from "mongoose";

const dailyClimateSchema = new mongoose.Schema(
  {
    doy: { type: Number, required: true },     // Day of year (1–365/366)
    srad: { type: Number, required: true },    // MJ/m²/day
    tmax: { type: Number, required: true },    // °C
    tmin: { type: Number, required: true },    // °C
    rain: { type: Number, required: true }     // mm/day
  },
  { _id: false }
);

const climateSchema = new mongoose.Schema({
  grid_id: { type: String, required: true },

  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },

  elevation: { type: Number, default: 0 }, // meters (needed for DSSAT)

  resolution_deg: { type: Number, default: 0.25 },

  year: { type: Number, required: true },

  source: { type: String, default: "NASA POWER" },

  daily: {
    type: [dailyClimateSchema],
    validate: [
      arr => arr.length === 365 || arr.length === 366,
      "Climate must contain 365 or 366 daily records"
    ]
  },

  created_at: {
    type: Date,
    default: Date.now
  }
});

// Grid lookup
climateSchema.index({ grid_id: 1, year: 1 }, { unique: true });

// Useful for nearest-grid queries
climateSchema.index({ latitude: 1, longitude: 1 });

export default mongoose.model("Climate", climateSchema);