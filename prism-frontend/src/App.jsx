import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import SimulationForm from "./pages/SimulationForm";
import BatchSimulationForm from "./pages/BatchSimulationForm";
import BatchResult from "./pages/BatchResult";
import Results from "./pages/Results";
import Energy from "./pages/Energy";
import CO2 from "./pages/CO2";
import H2O from "./pages/H2O";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/simulation" element={<SimulationForm />} />
        <Route path="/batch" element={<BatchSimulationForm />} />
        <Route path="/batch-results" element={<BatchResult />} />
        <Route path="/results" element={<Results />} />
        <Route path="/energy" element={<Energy />} /> 
        <Route path="/co2" element={<CO2 />} />
        <Route path="/h2o" element={<H2O />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;