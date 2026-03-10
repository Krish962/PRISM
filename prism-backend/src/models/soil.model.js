import mongoose from "mongoose";

const soilLayerSchema = new mongoose.Schema({
  top_depth_cm: { type: Number, required: true },
  bottom_depth_cm: { type: Number, required: true },

  sand: { type: Number, required: true },
  clay: { type: Number, required: true },
  silt: { type: Number, required: true },

  texture_class: { type: String },

  bulk_density: { type: Number },

  field_capacity: { type: Number },

  wilting_point: { type: Number },

  organic_carbon: { type: Number }, // estimated if missing
  ph: { type: Number }              // optional
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

  layers: [soilLayerSchema],

  created_at: {
    type: Date,
    default: Date.now
  }
});

soilSchema.index({ location: "2dsphere" });

export default mongoose.model("Soil", soilSchema);