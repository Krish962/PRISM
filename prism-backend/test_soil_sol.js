import { connectDB } from "./src/config/db.config.js";
import { findNearestSoil } from "./src/data-access/soil.repository.js";
import { generateSoilSOL } from "./src/simulation/soil.generator.js";

await connectDB();

const soil = await findNearestSoil(23.91, 85.29);

const path = generateSoilSOL(soil, "TEST_JOB");

console.log("Soil SOL generated at:", path);

process.exit();
