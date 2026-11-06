import fs from "fs";
import path from "path";
import os from "os";
import { spawn } from "child_process";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";

const serviceDir = path.dirname(fileURLToPath(import.meta.url));
//const serviceDir is the directory containing this file (simulation.service.js).

const backendRoot = path.resolve(serviceDir, "../..");
//backendRoot is the root directory of your backend application.

const runnerPath = path.resolve(serviceDir, "../simulation/r/run_dssat.R");
//runnerPath is the absolute path to your R script.

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
    //cwd: current working directory tells r script where to run.
    //Your R script or its dependencies might use relative paths. Setting cwd makes 
    //those paths resolve relative to the intended directory 
    //rather than whichever directory the Node.js process happened to start from.

    rProcess.stdout.on("data", data => {
      console.log(data.toString());
    });
    //Whenever R prints progress messages (e.g. "Weather pipeline finished", 
    //"Batch file written"), this converts the raw binary buffer to a string
    //(data.toString()) and logs it to the terminal in real-time

    rProcess.stderr.on("data", data => {
      console.error(data.toString());
    });
    //Standard output like errors
    //emit warnings or diagnostic messages from the R process.

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
        console.log("DEBUG: Leaving simulation folder for validation:", simDir);
        fs.rmSync(simDir, { recursive: true, force: true });
      }

    });

  });

}