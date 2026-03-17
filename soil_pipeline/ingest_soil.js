import fs from "fs";
import { MongoClient } from "mongodb";

const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);

const filePath = "./soil_india.json";

async function ingestSoil() {

await client.connect();
console.log("MongoDB connected");

const db = client.db("prism");
const soilCollection = db.collection("soils");

const soils = JSON.parse(fs.readFileSync(filePath));

const docs = soils.map((soil) => {


const lon = Number(soil.longitude);
const lat = Number(soil.latitude);

if (isNaN(lon) || isNaN(lat)) {
  throw new Error(`Invalid coordinates for soil_id ${soil.soil_id}`);
}

return {
  soil_id: soil.soil_id,
  source: soil.source,

  location: {
    type: "Point",
    coordinates: [lon, lat]
  },

  layers: soil.layers
};


});

console.log("Inserting soil profiles:", docs.length);

await soilCollection.insertMany(docs);

console.log("Creating geospatial index...");

await soilCollection.createIndex({ location: "2dsphere" });

console.log("Soil ingestion finished successfully");

await client.close();
}

ingestSoil();
