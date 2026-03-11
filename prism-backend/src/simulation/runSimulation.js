import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export const runSimulation = async (simulationInput) => {
  return new Promise((resolve, reject) => {

    const jobId = uuidv4();

    const jobDir = path.join(process.cwd(), "simulation_jobs", jobId);

    fs.mkdirSync(jobDir, { recursive: true });

    const inputPath = path.join(jobDir, "input.json");
    const outputPath = path.join(jobDir, "result.json");

    fs.writeFileSync(inputPath, JSON.stringify(simulationInput, null, 2));

    const rScriptPath = path.join(
      process.cwd(),
      "src",
      "simulation",
      "r",
      "run_dssat.R"
    );

    const rProcess = spawn("Rscript", [
      rScriptPath,
      inputPath,
      outputPath
    ]);

    rProcess.stdout.on("data", (data) => {
      console.log(`R: ${data}`);
    });

    rProcess.stderr.on("data", (data) => {
      console.error(`R ERROR: ${data}`);
    });

    rProcess.on("close", (code) => {

      if (code !== 0) {
        return reject(new Error("Simulation failed"));
      }

      try {

        const result = JSON.parse(
          fs.readFileSync(outputPath)
        );

        resolve({
          jobId,
          result
        });

      } catch (err) {
        reject(err);
      }

    });

  });
};