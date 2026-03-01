import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

import { generateClimateFile } from "./src/simulation/climate.generator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Target folder inside temp/jobs
const jobFolder = path.join(__dirname, "temp/jobs/TEST_JOB");

// Ensure folder exists
if (!fs.existsSync(jobFolder)) {
  fs.mkdirSync(jobFolder, { recursive: true });
}

try {
  const filePath = generateClimateFile({
    locationId: "LOC_001",
    latitude: 23.875,
    longitude: 85.375,
    startDate: "2024-06-01",
    endDate: "2024-10-15",
    outputPath: jobFolder
  });

  console.log("✅ Climate .WTH file generated successfully!");
  console.log("📂 File path:", filePath);

} catch (error) {
  console.error("❌ Climate generation failed:", error.message);
}
