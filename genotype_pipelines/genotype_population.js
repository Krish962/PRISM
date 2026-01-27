import mongoose from "mongoose";

// --------------------
// MongoDB connection
// --------------------
await mongoose.connect("mongodb://localhost:27017/prism");

// --------------------
// Genotype schema
// --------------------
const genotypeSchema = new mongoose.Schema({
  variety_code: { type: String, unique: true },
  variety_name: String,
  eco_type: String,

  parameters: {
    P1: Number,
    P2R: Number,
    P5: Number,
    G1: Number,
    G2: Number,
    G3: Number,
    G4: Number
  },

  crop: String,
  source: String,
  created_at: { type: Date, default: Date.now }
});

const Genotype = mongoose.model("Genotype", genotypeSchema);

// --------------------
// Genotype data (CERES-compatible)
// --------------------
const genotypes = [
  {
    variety_code: "IR64",
    variety_name: "IR64",
    eco_type: "IR",
    parameters: { P1: 450, P2R: 90, P5: 520, G1: 55, G2: 0.028, G3: 1.0, G4: 1.0 }
  },
  {
    variety_code: "MTU7029",
    variety_name: "Swarna",
    eco_type: "IR",
    parameters: { P1: 480, P2R: 85, P5: 540, G1: 60, G2: 0.027, G3: 1.0, G4: 1.0 }
  },
  {
    variety_code: "MTU1010",
    variety_name: "MTU1010",
    eco_type: "IR",
    parameters: { P1: 470, P2R: 80, P5: 530, G1: 58, G2: 0.026, G3: 1.0, G4: 1.0 }
  },

  // Generic ecotypes
  {
    variety_code: "GEN_IRR",
    variety_name: "Generic Irrigated Rice",
    eco_type: "IR",
    parameters: { P1: 460, P2R: 90, P5: 525, G1: 55, G2: 0.027, G3: 1.0, G4: 1.0 }
  },
  {
    variety_code: "GEN_RAIN",
    variety_name: "Generic Rainfed Rice",
    eco_type: "RF",
    parameters: { P1: 500, P2R: 95, P5: 560, G1: 50, G2: 0.025, G3: 0.9, G4: 1.0 }
  }
];

// --------------------
// Insert / update
// --------------------
for (const g of genotypes) {
  await Genotype.updateOne(
    { variety_code: g.variety_code },
    {
      ...g,
      crop: "rice",
      source: "DSSAT / IRRI"
    },
    { upsert: true }
  );
}

console.log("✅ Genotype data population completed");
process.exit();
