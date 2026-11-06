import { MongoClient } from "mongodb";
//raw driver used to talk to MongoDB directly
import { env } from "../config/env.config.js";

const client = new MongoClient(env.MONGO_URI);
//client is an instance of MongoClient and represents the connection pool to your MongoDB instance.
//env.MONGO_URI is the connection string that tells the driver where MongoDB is running.

let soilCollection = null;

async function init() {

  if (!soilCollection) {

    await client.connect();
    //Opens the connection pool to the MongoDB server/cluster across the network. await pauses until the handshake is complete.
    const db = client.db(env.MONGO_DB_NAME);

    soilCollection = db.collection("soils");
    await soilCollection.createIndex({ location: "2dsphere" });
    //Tells MongoDB to build a 2dsphere spatial index on the location field if it does not already exist
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
  //Query: Find the single document closest to the input (longitude, latitude).
  //Index Usage: The 2dsphere index allows MongoDB to perform this search extremely quickly.
  //Projection: Only return the fields needed, making the response small.

  return soil;
}
