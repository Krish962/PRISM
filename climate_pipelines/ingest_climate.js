  import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import Climate from "../../prism-backend/src/models/climate.model.js";

const DATA_DIR = "./output";

async function ingestClimate() {
  await mongoose.connect("mongodb://localhost:27017/prism");
  console.log("✅ MongoDB connected");

  const files = fs.readdirSync(DATA_DIR)
    .filter(f => f.endsWith(".json"));

  for (const file of files) {
    const filePath = path.join(DATA_DIR, file);
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    await Climate.updateOne(
      { grid_id: data.grid_id, year: data.year },
      data,
      { upsert: true }
    );

    console.log(`✔ Ingested ${data.grid_id} (${data.year})`);
  }

  console.log("🎉 Climate ingestion completed");
  process.exit();
}

ingestClimate();
