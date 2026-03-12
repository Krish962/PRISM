import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runSimulation(inputData) {

  const inputPath = path.join(__dirname, "simulation_input.json");
  const outputPath = path.join(__dirname, "simulation_output.json");

  // write JSON input file
  fs.writeFileSync(inputPath, JSON.stringify(inputData, null, 2));

  const rScript = path.join(__dirname, "r", "run_dssat.R");

  return new Promise((resolve, reject) => {

    const r = spawn("Rscript", [
      rScript,
      inputPath,
      outputPath
    ]);

    r.stdout.on("data", data => {
      console.log("R:", data.toString());
    });

    r.stderr.on("data", data => {
      console.error("R ERROR:", data.toString());
    });

    r.on("close", code => {

      if (code !== 0) {
        reject(new Error("Simulation failed"));
        return;
      }

      try {

        const result = JSON.parse(
          fs.readFileSync(outputPath)
        );

        resolve(result);

      } catch (err) {
        reject(err);
      }

    });

  });

}