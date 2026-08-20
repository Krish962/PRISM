import fs from "fs";
import path from "path";
import os from "os";
import { spawn } from "child_process";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";

const serviceDir = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(serviceDir, "../..");
const runnerPath = path.resolve(serviceDir, "../simulation/r/run_dssat.R");

export async function runSimulation(inputData) {

  const simId = uuidv4();

  const simDir = path.join(os.tmpdir(), "prism_" + simId);

  fs.mkdirSync(simDir);

  console.log("Simulation started:", simId);

  const inputPath = path.join(simDir, "input.json");
  const outputPath = path.join(simDir, "output.json");

  fs.writeFileSync(inputPath, JSON.stringify(inputData, null, 2));

  return new Promise((resolve, reject) => {

    const rProcess = spawn("Rscript", [
      runnerPath,
      inputPath,
      outputPath
    ], { cwd: backendRoot });

    rProcess.stdout.on("data", data => {
      console.log(data.toString());
    });

    rProcess.stderr.on("data", data => {
      console.error(data.toString());
    });

    rProcess.on("close", () => {

  try {

    if (!fs.existsSync(outputPath)) {
      throw new Error("Simulation failed: output.json not produced")
    }


      const result = JSON.parse(
        fs.readFileSync(outputPath)
      );
        resolve(result);
      } catch (err) {
        reject(err);
      } finally {
        console.log("Simulation finished:", simId);
        console.log("Cleaning simulation folder:", simDir);
        //fs.rmSync(simDir, { recursive: true, force: true });
      }

    });

  });

}