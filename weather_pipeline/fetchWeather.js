const axios = require("axios");
const fs = require("fs");

// grid resolution
const lat_vals = [];
const lon_vals = [];

// generate grid (same as your soil script)
for (let lat = 6; lat <= 37; lat += 0.25) lat_vals.push(Number(lat.toFixed(2)));
for (let lon = 68; lon <= 97; lon += 0.25) lon_vals.push(Number(lon.toFixed(2)));

const grid = [];
for (let lat of lat_vals) {
  for (let lon of lon_vals) {
    grid.push([lat, lon]);
  }
}

// helper: delay (IMPORTANT for API)
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// convert YYYYMMDD → YYYY-MM-DD
function formatDate(dateStr) {
  return `${dateStr.slice(0,4)}-${dateStr.slice(4,6)}-${dateStr.slice(6,8)}`;
}

// main
async function run() {

  const results = [];

  for (let i = 0; i < grid.length; i++) {

    const [lat, lon] = grid[i];

    console.log(`Processing ${i+1}/${grid.length}: ${lat}_${lon}`);

    try {

      const url = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M_MAX,T2M_MIN,PRECTOTCORR,ALLSKY_SFC_SW_DWN,WS2M&community=AG&longitude=${lon}&latitude=${lat}&start=20240101&end=20251231&format=JSON`;

      const res = await axios.get(url);

      const data = res.data.properties.parameter;

      const profile = {
        grid_id: `WEATHER_${lat.toFixed(2)}_${lon.toFixed(2)}`,
        latitude: lat,
        longitude: lon,
        source: "NASA_POWER",
        yearly_data: {
          "2024": [],
          "2025": []
        }
      };

      const dates = Object.keys(data.T2M_MAX);

      for (let date of dates) {

        const record = {
          date: formatDate(date),
          tmax: data.T2M_MAX[date],
          tmin: data.T2M_MIN[date],
          rain: data.PRECTOTCORR[date],
          srad: data.ALLSKY_SFC_SW_DWN[date],
          wind: data.WS2M[date] || 2
        };

        const year = date.slice(0,4);
        profile.yearly_data[year].push(record);
      }

      // basic validation (skip bad grids)
      if (
        profile.yearly_data["2024"].length === 366 &&
        profile.yearly_data["2025"].length === 365
      ) {
        results.push(profile);
      } else {
        console.log(`Skipping incomplete grid ${lat}_${lon}`);
      }

      // delay to avoid rate limit
      await sleep(500);

    } catch (err) {
      console.log(`Error at ${lat}_${lon}, skipping`);
    }
  }

  fs.writeFileSync("weather_india.json", JSON.stringify(results, null, 2));

  console.log("Done");
  console.log("Grids:", results.length);
}

run();