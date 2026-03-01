import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

import { getClimateByLocationAndDateRange } from "../data-access/climate.repository.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const generateClimateFile = ({
  locationId,
  latitude,
  longitude,
  elevation = 100,
  startDate,
  endDate,
  outputPath
}) => {

  // 1️⃣ Fetch climate data
  const climateData = getClimateByLocationAndDateRange(
    locationId,
    startDate,
    endDate
  );

  if (!climateData || climateData.length === 0) {
    throw new Error("No climate data available for date range");
  }

  const year = new Date(startDate).getFullYear();

  // 2️⃣ Calculate average temperature (TAV)
  const avgTemp =
    climateData.reduce((sum, d) => sum + ((d.tmax + d.tmin) / 2), 0) /
    climateData.length;

  const TAV = avgTemp.toFixed(1);
  const AMP = "10.0";

  // 3️⃣ Build file content
  let content = "";
  content += "*WEATHER DATA : PRISM SYNTHETIC\n";
  content += "@ INSI      LAT     LONG  ELEV   TAV   AMP REFHT WNDHT\n";
  content += `PRSM  ${latitude.toFixed(3)}  ${longitude.toFixed(3)}  ${elevation}  ${TAV}  ${AMP}  2.0  2.0\n`;
  content += "@DATE  SRAD  TMAX  TMIN  RAIN\n";

  climateData.forEach(day => {
    const dateCode = `${year}${String(day.doy).padStart(3, "0")}`;
    content += `${dateCode}  ${day.srad.toFixed(2)}  ${day.tmax.toFixed(2)}  ${day.tmin.toFixed(2)}  ${day.rain.toFixed(2)}\n`;
  });

  // 4️⃣ Write file
  const filePath = path.join(outputPath, "weather.WTH");
  fs.writeFileSync(filePath, content);

  return filePath;
};
