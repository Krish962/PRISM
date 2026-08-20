import axios from "axios";

const configuredApiUrl = import.meta.env.VITE_API_URL;

if (!configuredApiUrl && import.meta.env.PROD) {
  throw new Error("VITE_API_URL must be configured for production builds");
}

const apiBaseUrl = configuredApiUrl || "http://localhost:5000";

const simulationAPI = axios.create({
  baseURL: `${apiBaseUrl}/api/simulation`
});

const batchAPI = axios.create({
  baseURL: `${apiBaseUrl}/api/batch`
});

export const runSimulation = async (payload) => {
  const res = await simulationAPI.post("/run", payload);
  return res.data;
};

export const runBatchSimulation = async (payload) => {
  const res = await batchAPI.post("/run", payload);
  return res.data;
};