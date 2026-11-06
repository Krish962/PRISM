#!/usr/bin/env node
/**
 * scripts/seed_nasa_power.js
 * -------------------------------------------------------------
 * High-performance, concurrent seeder to download NASA POWER daily
 * agroclimatology data (SRAD, TMAX, TMIN, RAIN) into MongoDB with 2dsphere indexing.
 *
 * Modes:
 *   1. All India (matches all unique grid coordinates from soils collection):
 *      node scripts/seed_nasa_power.js --allIndia --startYear 2020 --endYear 2024 --concurrency 6
 *
 *   2. Bounding Box:
 *      node scripts/seed_nasa_power.js --minLat 21.0 --maxLat 24.0 --minLon 85.0 --maxLon 88.0
 *
 *   3. Single Location:
 *      node scripts/seed_nasa_power.js --point 22.314,87.311 --startYear 2020 --endYear 2024
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import Climate from "../src/models/climate.model.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/prism";

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    allIndia: false,
    minLat: 8.0,
    maxLat: 37.0,
    minLon: 68.0,
    maxLon: 97.0,
    startYear: 2020,
    endYear: 2024,
    step: 0.5,
    concurrency: 6,
    limit: 0,
    point: null
  };

  for (let i = 0; i < args.length; i++) {
    const raw = args[i].replace(/^--/, "");
    if (raw === "allIndia") {
      options.allIndia = true;
      continue;
    }
    const val = args[i + 1];
    if (val && !val.startsWith("--")) {
      if (raw === "point") options.point = val;
      else if (["minLat", "maxLat", "minLon", "maxLon", "step"].includes(raw)) options[raw] = parseFloat(val);
      else if (["startYear", "endYear", "concurrency", "limit"].includes(raw)) options[raw] = parseInt(val, 10);
      i++;
    }
  }
  return options;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchNASAWeather(lat, lon, startYear, endYear) {
  const startStr = `${startYear}0101`;
  const endStr = `${endYear}1231`;

  const url = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=ALLSKY_SFC_SW_DWN,T2M_MAX,T2M_MIN,PRECTOTCORR&community=AG&longitude=${lon.toFixed(2)}&latitude=${lat.toFixed(2)}&start=${startStr}&end=${endStr}&format=JSON`;

  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const resp = await fetch(url, { headers: { "User-Agent": "PRISM-India-Seeder/1.0" } });
      if (resp.ok) {
        const json = await resp.json();
        return json?.properties?.parameter || null;
      }
      if (resp.status === 429) {
        const wait = attempt * 4000;
        await sleep(wait);
      } else {
        return null;
      }
    } catch {
      await sleep(1500 * attempt);
    }
  }
  return null;
}

async function processGrid(lat, lon, startYear, endYear) {
  const gridId = `NP_${lat.toFixed(2)}_${lon.toFixed(2)}`;

  const paramData = await fetchNASAWeather(lat, lon, startYear, endYear);
  if (!paramData) {
    return { gridId, success: false, reason: "Fetch failed or invalid coordinate" };
  }

  const sradMap = paramData.ALLSKY_SFC_SW_DWN || {};
  const tmaxMap = paramData.T2M_MAX || {};
  const tminMap = paramData.T2M_MIN || {};
  const rainMap = paramData.PRECTOTCORR || {};

  const yearsData = {};
  for (const dateKey of Object.keys(sradMap)) {
    const yr = parseInt(dateKey.slice(0, 4), 10);
    const mo = parseInt(dateKey.slice(4, 6), 10);
    const da = parseInt(dateKey.slice(6, 8), 10);

    const d = new Date(Date.UTC(yr, mo - 1, da));
    const startOfYear = new Date(Date.UTC(yr, 0, 1));
    const doy = Math.floor((d - startOfYear) / (24 * 60 * 60 * 1000)) + 1;

    const rawSrad = sradMap[dateKey];
    const rawTmax = tmaxMap[dateKey];
    const rawTmin = tminMap[dateKey];
    const rawRain = rainMap[dateKey];

    const srad = rawSrad <= -900 ? 15.0 : rawSrad;
    const tmax = rawTmax <= -900 ? 30.0 : rawTmax;
    const tmin = rawTmin <= -900 ? 20.0 : rawTmin;
    const rain = rawRain <= -900 ? 0.0 : rawRain;

    if (!yearsData[yr]) yearsData[yr] = [];
    yearsData[yr].push({ doy, srad, tmax, tmin, rain });
  }

  const bulkOps = [];
  for (const [yrStr, dailyList] of Object.entries(yearsData)) {
    const yr = parseInt(yrStr, 10);
    if (dailyList.length < 365) continue;

    bulkOps.push({
      updateOne: {
        filter: { grid_id: gridId, year: yr },
        update: {
          $set: {
            grid_id: gridId,
            latitude: Number(lat.toFixed(2)),
            longitude: Number(lon.toFixed(2)),
            location: {
              type: "Point",
              coordinates: [Number(lon.toFixed(2)), Number(lat.toFixed(2))]
            },
            elevation: 50,
            resolution_deg: 0.5,
            year: yr,
            source: "NASA POWER Bulk",
            daily: dailyList
          }
        },
        upsert: true
      }
    });
  }

  if (bulkOps.length > 0) {
    await Climate.bulkWrite(bulkOps, { ordered: false });
    return { gridId, success: true, count: bulkOps.length };
  }

  return { gridId, success: false, reason: "No complete yearly records" };
}

async function getGridTargets(options) {
  if (options.point) {
    const [pLat, pLon] = options.point.split(",").map(Number);
    const latGrid = Math.round(pLat * 2) / 2;
    const lonGrid = Math.round(pLon * 2) / 2;
    return [{ lat: latGrid, lon: lonGrid }];
  }

  if (options.allIndia) {
    console.log("Analyzing MongoDB soils collection to extract India agricultural grid points...");
    const soils = await mongoose.connection.collection("soils").find(
      {},
      { projection: { "location.coordinates": 1, _id: 0 } }
    ).toArray();

    const uniqueMap = new Map();
    soils.forEach(s => {
      if (s?.location?.coordinates?.length === 2) {
        const [lon, lat] = s.location.coordinates;
        const snapLat = Math.round(lat * 2) / 2;
        const snapLon = Math.round(lon * 2) / 2;
        const key = `${snapLat.toFixed(2)},${snapLon.toFixed(2)}`;
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, { lat: snapLat, lon: snapLon });
        }
      }
    });

    console.log(`Discovered ${uniqueMap.size} unique 0.5-degree grid cells matching all Indian soils.`);
    return Array.from(uniqueMap.values());
  }

  // Bounding box sweep
  const targets = [];
  for (let lat = options.minLat; lat <= options.maxLat; lat += options.step) {
    for (let lon = options.minLon; lon <= options.maxLon; lon += options.step) {
      targets.push({ lat: Number(lat.toFixed(2)), lon: Number(lon.toFixed(2)) });
    }
  }
  return targets;
}

async function main() {
  const options = parseArgs();

  console.log("==================================================");
  console.log("        PRISM NASA POWER BULK SEEDER              ");
  console.log("==================================================");
  console.log(`Database:     ${MONGO_URI}`);
  console.log(`Year Range:   ${options.startYear} .. ${options.endYear}`);
  console.log(`Concurrency:  ${options.concurrency} parallel workers`);

  await mongoose.connect(MONGO_URI);
  console.log("MongoDB connection verified.");

  // Guarantee 2dsphere index exists
  await Climate.collection.createIndex({ location: "2dsphere" });
  await Climate.collection.createIndex({ grid_id: 1, year: 1 }, { unique: true });

  let targets = await getGridTargets(options);

  // Resume capability: skip grids that already exist in DB
  const existingGrids = new Set(await Climate.distinct("grid_id", { year: options.endYear }));
  console.log(`Existing seeded grids in DB: ${existingGrids.size}`);

  const pending = targets.filter(t => !existingGrids.has(`NP_${t.lat.toFixed(2)}_${t.lon.toFixed(2)}`));
  console.log(`Pending grids to download:  ${pending.length} (Skipping ${targets.length - pending.length} already done)`);

  const queue = options.limit > 0 ? pending.slice(0, options.limit) : pending;
  const total = queue.length;

  if (total === 0) {
    console.log("All target grids are already seeded. Nothing to do!");
    await mongoose.disconnect();
    process.exit(0);
  }

  console.log(`Starting ingestion of ${total} grids...`);
  const startTime = Date.now();
  let completed = 0;
  let successful = 0;
  let failed = 0;

  // Worker pool for concurrency
  async function worker(items) {
    for (const item of items) {
      const res = await processGrid(item.lat, item.lon, options.startYear, options.endYear);
      completed++;
      if (res.success) {
        successful++;
      } else {
        failed++;
      }

      const elapsedSec = (Date.now() - startTime) / 1000;
      const rate = completed / (elapsedSec / 60); // grids per min
      const remainingSec = Math.round(((total - completed) / (completed / elapsedSec)) || 0);
      const pct = ((completed / total) * 100).toFixed(1);

      process.stdout.write(
        `\r[${completed}/${total}] (${pct}%) ` +
        `Grid: ${res.gridId} ${res.success ? "✓" : "✗"} ` +
        `| Speed: ${rate.toFixed(1)}/min ` +
        `| ETA: ${Math.floor(remainingSec / 60)}m ${remainingSec % 60}s     `
      );

      // Throttling to respect NASA POWER limits
      await sleep(150);
    }
  }

  // Partition queue among concurrent workers
  const chunkSize = Math.ceil(queue.length / options.concurrency);
  const workerPromises = [];
  for (let i = 0; i < options.concurrency; i++) {
    const chunk = queue.slice(i * chunkSize, (i + 1) * chunkSize);
    if (chunk.length > 0) {
      workerPromises.push(worker(chunk));
    }
  }

  await Promise.all(workerPromises);

  const durationMin = ((Date.now() - startTime) / 60000).toFixed(2);
  console.log("\n==================================================");
  console.log(`Ingestion Finished in ${durationMin} minutes!`);
  console.log(`Successful: ${successful} grids`);
  console.log(`Skipped / Failed: ${failed} grids`);
  console.log("==================================================");

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error("\nFatal Error:", err);
  process.exit(1);
});
