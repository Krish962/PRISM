import { BrowserRouter, Routes, Route } from "react-router-dom";
import SimulationForm from "./pages/SimulationForm";
import Results from "./pages/Results";
import Energy from "./pages/Energy";
import CO2 from "./pages/CO2";
import H2O from "./pages/H2O";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SimulationForm />} />
        <Route path="/results" element={<Results />} />
        <Route path="/energy" element={<Energy />} /> 
        <Route path="/co2" element={<CO2 />} />
        <Route path="/h2o" element={<H2O />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;