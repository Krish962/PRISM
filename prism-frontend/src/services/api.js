import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api/simulation" // adjust if needed
});

export const runSimulation = async (payload) => {
  const res = await API.post("/run", payload);
  return res.data;
};