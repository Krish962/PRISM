const getClimateByLocationAndDateRange = (
  locationId,
  startDate,
  endDate
) => {
  if (locationId !== "LOC_001") {
    throw new Error("Climate data not found for location");
  }

  // Minimal mock: 120 days
  const climate = [];
  for (let day = 1; day <= 120; day++) {
    climate.push({
      date: `2024-06-${String(day).padStart(2, "0")}`,
      tmax: 32 + Math.random() * 3,
      tmin: 24 + Math.random() * 2,
      rain: Math.random() > 0.7 ? 10 : 0,
      srad: 18 + Math.random() * 2
    });
  }

  return climate;
};

module.exports = {
  getClimateByLocationAndDateRange
};
