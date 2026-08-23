import axios from "axios";

// Check if we are running in local development mode
const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

// Get the env variable, if any
const configuredApiUrl = import.meta.env.VITE_API_URL;

if (!isLocal && !configuredApiUrl && import.meta.env.PROD) {
  console.warn("VITE_API_URL is not configured for production build");
}

// Force localhost if running locally, otherwise use env var (or fallback to same origin)
const rawBaseUrl = isLocal ? "http://localhost:5000" : (configuredApiUrl || window.location.origin);

// Clean the base URL (strip off any accidental /api/simulation/run suffixes from the env file)
const cleanBaseUrl = rawBaseUrl.replace(/\/api\/(simulation|batch).*$/, "").replace(/\/$/, "");

const simulationAPI = axios.create({
  baseURL: `${cleanBaseUrl}/api/simulation`
});

const batchAPI = axios.create({
  baseURL: `${cleanBaseUrl}/api/batch`
});

export const runSimulation = async (payload) => {
  const res = await simulationAPI.post("/run", payload);
  return res.data;
};

export const runBatchSimulation = async (payload) => {
  const res = await batchAPI.post("/run", payload);
  return res.data;
};