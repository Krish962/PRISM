import { connectDB } from "./src/config/db.config.js";
import { findGenotypeByCode } from "./src/data-access/variety.repository.js";
import { generateVarietyCUL } from "./src/simulation/variety.generator.js";

await connectDB();

const genotype = await findGenotypeByCode("IR64");

const path = generateVarietyCUL(genotype, "TEST_JOB");

console.log("Variety CUL generated at:", path);

process.exit();
