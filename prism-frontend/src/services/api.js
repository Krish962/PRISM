import axios from "axios";

const simulationAPI = axios.create({
  baseURL: "http://localhost:5000/api/simulation"
});

const batchAPI = axios.create({
  baseURL: "http://localhost:5000/api/batch"
});

export const runSimulation = async (payload) => {
  const res = await simulationAPI.post("/run", payload);
  return res.data;
};

export const runBatchSimulation = async (payload) => {
  const res = await batchAPI.post("/run", payload);
  return res.data;
};