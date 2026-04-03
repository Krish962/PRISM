import { BrowserRouter, Routes, Route } from "react-router-dom";
import SimulationForm from "./pages/SimulationForm";
import Results from "./pages/Results";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SimulationForm />} />
        <Route path="/results" element={<Results />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;