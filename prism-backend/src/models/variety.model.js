import mongoose from "mongoose";

const genotypeSchema = new mongoose.Schema({
  variety_code: {
    type: String,
    required: true,
    unique: true
  },

  variety_name: {
    type: String,
    required: true
  },

  eco_type: {
    type: String,
    required: true
  },

  parameters: {
    P1: { type: Number, required: true },
    P2R: { type: Number, required: true },
    P5: { type: Number, required: true },
    G1: { type: Number, required: true },
    G2: { type: Number, required: true },
    G3: { type: Number, required: true },
    G4: { type: Number, required: true }
  },

  crop: {
    type: String,
    default: "rice"
  },

  source: String,

  created_at: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("Genotype", genotypeSchema);
