import fs from "fs";
import mongoose from "mongoose";

// --------------------
// Mongo connection (MODERN)
// --------------------
await mongoose.connect("mongodb://localhost:27017/prism");

// --------------------
// Schema
// --------------------
const soilSchema = new mongoose.Schema({
  location_id: { type: String, unique: true },

  location: {
    type: {
      type: String,
      enum: ["Point"],
      required: true
    },
    coordinates: {
      type: [Number], // [lon, lat]
      required: true
    }
  },

  source: String,
  resolution_deg: Number,

  layers: [
    {
      depth_cm: String,
      sand: Number,
      clay: Number,
      silt: Number,
      texture_class: String,
      bulk_density: Number,
      field_capacity: Number,
      wilting_point: Number
    }
  ],

  created_at: { type: Date, default: Date.now }
});

soilSchema.index({ location: "2dsphere" });

const Soil = mongoose.model("Soil", soilSchema);

// --------------------
// Ingest JSON
// --------------------
const raw = JSON.parse(
  fs.readFileSync("soil_profiles_0p25deg.json", "utf-8")
);

for (const soil of raw) {
  try {
    await Soil.updateOne(
      { location_id: soil.location_id },
      {
        location_id: soil.location_id,
        location: {
          type: "Point",
          coordinates: [soil.longitude, soil.latitude]
        },
        source: soil.source,
        resolution_deg: 0.25,
        layers: soil.layers
      },
      { upsert: true }
    );
  } catch (err) {
    console.error("Failed:", soil.location_id, err.message);
  }
}

console.log("✅ Soil ingestion completed");
process.exit();
