import { MongoClient } from "mongodb";
import { env } from "../config/env.config.js";

const client = new MongoClient(env.MONGO_URI);

let soilCollection = null;

async function init() {

  if (!soilCollection) {

    await client.connect();

    const db = client.db(env.MONGO_DB_NAME);

    soilCollection = db.collection("soils");
    await soilCollection.createIndex({ location: "2dsphere" });
  }
}

export async function getNearestSoil(latitude, longitude) {

  await init();

  const soil = await soilCollection.findOne(
    {
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude]
          }
        }
      }
    },
    {
      projection: {
        soil_id: 1,
        layers: 1,
        _id: 0
      }
    }
  );

  return soil;
}
