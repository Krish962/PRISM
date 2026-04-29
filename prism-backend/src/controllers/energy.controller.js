// controllers/energy.controller.js

export const calculateEnergyController = (req, res) => {
  try {
    const { simulationInputs, energyInputs } = req.body;

    // -------------------------
    // 1. HUMAN LABOUR
    // -------------------------
    const men = Number(energyInputs?.human?.men || 0);
    const menHours = Number(energyInputs?.human?.menHours || 0);

    const women = Number(energyInputs?.human?.women || 0);
    const womenHours = Number(energyInputs?.human?.womenHours || 0);

    const humanEnergy =
      1.96 * (men * menHours) +
      1.57 * (women * womenHours);

    // -------------------------
    // 2. ANIMAL LABOUR
    // -------------------------
    const bullocks = Number(energyInputs?.animal?.bullocks || 0);
    const bullockHours = Number(energyInputs?.animal?.bullockHours || 0);

    const others = Number(energyInputs?.animal?.others || 0);
    const othersHours = Number(energyInputs?.animal?.othersHours || 0);

    const animalEnergy =
      10.71 * (bullocks * bullockHours) +
      4.04 * (others * othersHours);

    // -------------------------
    // 3. FUEL
    // -------------------------
    const diesel = Number(energyInputs?.fuel?.diesel || 0);
    const petrol = Number(energyInputs?.fuel?.petrol || 0);
    const electricity = Number(energyInputs?.fuel?.electricity || 0);

    const fuelEnergy =
      56.3 * diesel +
      48.23 * petrol +
      11.93 * electricity;

    // -------------------------
    // 4. FERTILIZER (from simulationInputs)
    // -------------------------
    const area = Number(req.body.energyInputs.area || 1);
    const fertSchedules =
      simulationInputs?.management?.fertilizerSchedules || [];

    let fertilizerEnergy = 0;

    fertSchedules.forEach((f) => {
      const amount = Number(f.amount || 0);

      if (f.type === "N") {
        fertilizerEnergy += 60.6 * amount;
      } else if (f.type === "P") {
        fertilizerEnergy += 11.1 * amount;
      } else if (f.type === "K") {
        fertilizerEnergy += 6.7 * amount;
      }
    });

    fertilizerEnergy = fertilizerEnergy * area;

    // -------------------------
    // 5. SEED ENERGY
    // -------------------------
    const seedAmountKgha = Number(
      energyInputs?.seed?.amount || 0
    );
    const seedAmount = seedAmountKgha * area;
    const seedEnergy = 17.7 * seedAmount;


    // -------------------------
    // 6. MACHINERY
    // -------------------------
    const electricMotors = Number(energyInputs?.machinery?.electricMotors || 0);
    const primeMovers = Number(energyInputs?.machinery?.primeMovers || 0);
    const farmMachinery = Number(energyInputs?.machinery?.farmMachinery || 0);
    const tractor = Number(energyInputs?.machinery?.tractor || 0);
    const harvester = Number(energyInputs?.machinery?.harvester || 0);

    const machineryEnergy =
      0.405 * electricMotors +
      1.14 * primeMovers +
      4.18 * farmMachinery +
      12.96 * tractor +
      51.84 * harvester;



    // -------------------------
    // TOTAL
    // -------------------------
    const totalEnergy =
      humanEnergy +
      animalEnergy +
      fuelEnergy +
      fertilizerEnergy +
      seedEnergy +
      machineryEnergy;

    // -------------------------
    // RESPONSE
    // -------------------------
    res.json({
      totalEnergy: Number(totalEnergy.toFixed(2)),
      breakdown: {
        human: Number(humanEnergy.toFixed(2)),
        animal: Number(animalEnergy.toFixed(2)),
        fuel: Number(fuelEnergy.toFixed(2)),
        fertilizer: Number(fertilizerEnergy.toFixed(2)),
        seed: Number(seedEnergy.toFixed(2)),              // ✅ NEW
        machinery: Number(machineryEnergy.toFixed(2))     // ✅ NEW
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Energy calculation failed" });
  }
};