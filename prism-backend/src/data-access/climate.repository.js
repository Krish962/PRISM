import dayjs from "dayjs";
import dayOfYear from "dayjs/plugin/dayOfYear.js";

dayjs.extend(dayOfYear);

// Generate full synthetic year
function generateSyntheticYear(year) {
  const totalDays = dayjs(`${year}-12-31`).dayOfYear();
  const days = [];

  for (let doy = 1; doy <= totalDays; doy++) {

    // Seasonal curve (India-like climate)
    const seasonalFactor = Math.sin((2 * Math.PI * (doy - 80)) / 365);

    const tmax = 32 + 6 * seasonalFactor;   // 26–38°C
    const tmin = 20 + 5 * seasonalFactor;   // 15–25°C
    const srad = 18 + 4 * seasonalFactor;   // 14–22 MJ/m²

    let rain = 0;

    // Monsoon simulation (DOY 150–260)
    if (doy >= 150 && doy <= 260) {
      if (Math.random() < 0.4) {
        rain = +(Math.random() * 20).toFixed(2);
      }
    }

    days.push({
      doy,
      srad: +srad.toFixed(2),
      tmax: +tmax.toFixed(2),
      tmin: +tmin.toFixed(2),
      rain
    });
  }

  return days;
}

export function getClimateByLocationAndDateRange(
  locationId,
  startDate,
  endDate
) {
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  const year = start.year();

  const fullYear = generateSyntheticYear(year);

  const startDOY = start.dayOfYear();
  const endDOY = end.dayOfYear();

  return fullYear.filter(
    day => day.doy >= startDOY && day.doy <= endDOY
  );
}
