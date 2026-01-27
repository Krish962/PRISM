import mongoose from "mongoose";

const soilLayerSchema = new mongoose.Schema({
  depth_cm: String,
  sand: Number,
  clay: Number,
  silt: Number,
  texture_class: String,
  bulk_density: Number,
  field_capacity: Number,
  wilting_point: Number
}, { _id: false });

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
  layers: [soilLayerSchema]
});

soilSchema.index({ location: "2dsphere" });

export default mongoose.model("Soil", soilSchema);
