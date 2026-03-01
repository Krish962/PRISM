import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

import { generateManagementFile } from "./src/simulation/management.generator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const jobFolder = path.join(__dirname, "temp/jobs/TEST_JOB");

if (!fs.existsSync(jobFolder)) {
  fs.mkdirSync(jobFolder, { recursive: true });
}

const managementData = {
  plantingDate: "2024-06-15",
  plantingMethod: "TRANSPLANT",
  plantPopulation: 300,
  rowSpacing: 20,
  plantingDepth: 3,

  irrigationSchedule: [
    { date: "2024-07-01", amount: 50 },
    { date: "2024-07-20", amount: 40 }
  ],

  fertilizerSchedule: [
    { date: "2024-06-25", type: "UREA", amount: 50 },
    { date: "2024-07-15", type: "UREA", amount: 40 }
  ],

  harvestDate: "2024-10-20"
};

try {
  const filePath = generateManagementFile({
    managementData,
    outputPath: jobFolder
  });

  console.log("✅ .RIX file generated successfully!");
  console.log("📂 File path:", filePath);

} catch (error) {
  console.error("❌ Management generation failed:", error.message);
}