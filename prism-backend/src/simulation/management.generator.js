import fs from "fs";
import path from "path";
import dayjs from "dayjs";
import dayOfYear from "dayjs/plugin/dayOfYear.js";

dayjs.extend(dayOfYear);

function toYYYYDDD(dateStr) {
  const d = dayjs(dateStr);
  const year = d.year();
  const doy = String(d.dayOfYear()).padStart(3, "0");
  return `${year}${doy}`;
}

export function generateManagementFile({
  managementData,
  outputPath
}) {
  const {
    plantingDate,
    plantingMethod,
    plantPopulation,
    rowSpacing,
    plantingDepth,
    irrigationSchedule = [],
    fertilizerSchedule = [],
    harvestDate
  } = managementData;

  if (!plantingDate || !harvestDate) {
    throw new Error("Planting and Harvest dates are mandatory");
  }

  let content = "";

  content += "*EXP.DETAILS: PRISM GENERATED\n";
  content += "@GENERAL\n";
  content += "PRISM_SIMULATION\n\n";

  // -----------------------
  // Planting Section
  // -----------------------
  content += "*PLANTING\n";
  content += "@PDATE  PMETH  POP  ROWSPC  DEPTH\n";

  const methodCode = plantingMethod === "TRANSPLANT" ? 1 : 0;

  content += `${toYYYYDDD(plantingDate)}  ${methodCode}  ${plantPopulation}  ${rowSpacing}  ${plantingDepth}\n\n`;

  // -----------------------
  // Fertilizer Section
  // -----------------------
  if (fertilizerSchedule.length > 0) {
    content += "*FERTILIZER\n";
    content += "@FDATE  TYPE  AMOUNT\n";

    fertilizerSchedule.forEach(f => {
      content += `${toYYYYDDD(f.date)}  ${f.type}  ${f.amount}\n`;
    });

    content += "\n";
  }

  // -----------------------
  // Irrigation Section
  // -----------------------
  if (irrigationSchedule.length > 0) {
    content += "*IRRIGATION\n";
    content += "@IDATE  AMOUNT\n";

    irrigationSchedule.forEach(i => {
      content += `${toYYYYDDD(i.date)}  ${i.amount}\n`;
    });

    content += "\n";
  }

  // -----------------------
  // Harvest Section
  // -----------------------
  content += "*HARVEST\n";
  content += "@HDATE\n";
  content += `${toYYYYDDD(harvestDate)}\n`;

  const filePath = path.join(outputPath, "experiment.RIX");
  fs.writeFileSync(filePath, content);

  return filePath;
}