const fetchWeather = require("./fetchWeather");
const transformWeather = require("./transformWeather");

async function run() {
  const lat = 19.00;
  const lon = 72.75;

  console.log("Fetching weather...");

  const raw = await fetchWeather(lat, lon);

  console.log("Transforming...");

  const transformed = transformWeather(raw);

  const document = {
    gridId: `${lat}_${lon}`,
    lat,
    lon,
    location: {
      type: "Point",
      coordinates: [lon, lat]
    },
    yearly_data: transformed
  };

  console.log(JSON.stringify(document, null, 2));
}

run();