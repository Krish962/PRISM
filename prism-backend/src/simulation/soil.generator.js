import fs from "fs";
import path from "path";

/**
 * Generate DSSAT .SOL file from soil document
 * @param {Object} soil - MongoDB soil document
 * @param {string} jobId - Simulation job ID
 */
export const generateSoilSOL = (soil, jobId) => {
  const jobDir = path.join("temp", "jobs", jobId);

  // Ensure job directory exists
  fs.mkdirSync(jobDir, { recursive: true });

  const solFilePath = path.join(jobDir, "soil.SOL");

  let content = "";

  // ------------------------
  // Header
  // ------------------------
  content += "*SOILS: PRISM generated soil\n";
  content += "@SITE        COUNTRY          LAT     LONG\n";
  content += `${soil.location_id.padEnd(12)} INDIA        `;
  content += `${soil.location.coordinates[1].toFixed(3).padStart(7)} `;
  content += `${soil.location.coordinates[0].toFixed(3).padStart(7)}\n\n`;

  // ------------------------
  // Layer table header
  // ------------------------
  content += "@SLB  SBDM  SLLL  SDUL\n";

  // ------------------------
  // Layers
  // ------------------------
  for (const layer of soil.layers) {
    const depth = parseInt(layer.depth_cm.split("-")[1]); // e.g. "0-5cm" → 5

    const line =
      `${depth.toString().padStart(4)} ` +
      `${layer.bulk_density.toFixed(2).padStart(6)} ` +
      `${layer.wilting_point.toFixed(2).padStart(6)} ` +
      `${layer.field_capacity.toFixed(2).padStart(6)}\n`;

    content += line;
  }

  // ------------------------
  // Write file
  // ------------------------
  fs.writeFileSync(solFilePath, content);

  return solFilePath;
};
