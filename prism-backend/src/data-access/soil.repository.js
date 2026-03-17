import { MongoClient } from "mongodb";

const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);

let soilCollection = null;

async function init() {

  if (!soilCollection) {

    await client.connect();

    const db = client.db("prism");

    soilCollection = db.collection("soils");
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
