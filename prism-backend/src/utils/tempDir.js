const fs = require("fs");
const path = require("path");
const os = require("os");
const { v4: uuidv4 } = require("uuid");

function createSimulationDir() {

    const id = uuidv4();

    const dir = path.join(
        os.tmpdir(),
        "prism_simulation_" + id
    );

    fs.mkdirSync(dir, { recursive: true });

    return {
        id,
        dir
    };
}

function deleteSimulationDir(dir) {
    fs.rmSync(dir, { recursive: true, force: true });
}

module.exports = {
    createSimulationDir,
    deleteSimulationDir
};