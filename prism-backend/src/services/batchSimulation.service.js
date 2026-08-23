import fs from "fs";
import path from "path";
import os from "os";
import { spawn } from "child_process";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";

const serviceDir = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(serviceDir, "../..");
const runnerPath = path.resolve(serviceDir, "../simulation/r/run_batch_dssat.R");

export async function runBatchSimulationService(inputData) {

  const simId = uuidv4();

  const simDir = path.join(os.tmpdir(), "prism_" + simId);

  fs.mkdirSync(simDir);

  console.log("Simulation started:", simId);

  const inputPath = path.join(simDir, "input.json");
  const outputPath = path.join(simDir, "output.json");

  //console.log(JSON.stringify(inputData, null, 2));

  fs.writeFileSync(inputPath, JSON.stringify(inputData, null, 2));

  return new Promise((resolve, reject) => {
    let stderrOutput = "";
    let settled = false;

    const rProcess = spawn("Rscript", [
      runnerPath,
      inputPath,
      outputPath
    ], { cwd: backendRoot });

    rProcess.stdout.on("data", data => {
      console.log(data.toString());
    });

    rProcess.stderr.on("data", data => {
      stderrOutput += data.toString();
      console.error(data.toString());
    });

    rProcess.on("error", error => {
      settled = true;
      fs.rmSync(simDir, { recursive: true, force: true });
      reject(new Error(`Unable to start Rscript: ${error.message}`));
    });

    rProcess.on("close", (code, signal) => {
      if (settled) {
        return;
      }

      try {
        if (code !== 0) {
          const details = stderrOutput.trim();
          throw new Error(
            `Batch simulation process exited with code ${code || "unknown"}` +
            `${signal ? ` (signal ${signal})` : ""}` +
            `${details ? `: ${details}` : ""}`
          );
        }

        if (!fs.existsSync(outputPath)) {
          throw new Error("Simulation failed: output.json not produced");
        }

        const result = JSON.parse(fs.readFileSync(outputPath));
        settled = true;
        resolve(result);
      } catch (err) {
        settled = true;
        reject(err);
      } finally {
        console.log("Simulation finished:", simId);
        console.log("DEBUG: Leaving simulation folder for validation:", simDir);
        // fs.rmSync(simDir, { recursive: true, force: true });
      }

    });

  });

}