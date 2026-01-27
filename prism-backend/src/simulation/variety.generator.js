import fs from "fs";
import path from "path";

/**
 * Generate DSSAT .CUL file from genotype data
 * @param {Object} genotype - Genotype document from DB
 * @param {string} jobId - Simulation job ID
 */
export const generateVarietyCUL = (genotype, jobId) => {
  const jobDir = path.join("temp", "jobs", jobId);
  fs.mkdirSync(jobDir, { recursive: true });

  const culFilePath = path.join(jobDir, "variety.CUL");

  let content = "";

  // ------------------------
  // Header
  // ------------------------
  content += "*RICE CULTIVARS: PRISM generated\n";
  content += "@VAR#  VAR-NAME       ECO#  P1  P2R  P5  G1  G2   G3   G4\n";

  // ------------------------
  // Cultivar line
  // ------------------------
  const p = genotype.parameters;

  const line =
    `${genotype.variety_code.padEnd(5)} ` +
    `${genotype.variety_name.padEnd(14)} ` +
    `${genotype.eco_type.padEnd(4)} ` +
    `${p.P1.toString().padStart(4)} ` +
    `${p.P2R.toString().padStart(4)} ` +
    `${p.P5.toString().padStart(4)} ` +
    `${p.G1.toString().padStart(4)} ` +
    `${p.G2.toFixed(3).padStart(5)} ` +
    `${p.G3.toFixed(2).padStart(5)} ` +
    `${p.G4.toFixed(2).padStart(5)}\n`;

  content += line;

  fs.writeFileSync(culFilePath, content);

  return culFilePath;
};
