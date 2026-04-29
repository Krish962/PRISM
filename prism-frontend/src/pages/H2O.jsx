import { useLocation } from "react-router-dom";
import { useState } from "react";
import "./H2O.css";

function H2O() {
  const location = useLocation();
  const { simulationInputs, simulationResults } = location.state || {};

  const [result, setResult] = useState(null);

  if (!simulationResults || !simulationInputs) {
    return <h2>No Data Available</h2>;
  }

  const handleCalculate = () => {

    // 🔹 Extract values from simulation
    const precipitation = Number(simulationResults.total_precipitation);
    const drainage = Number(simulationResults.total_drainage);
    const ETc = Number(simulationResults.total_ET);
    const yield_kg_ha = Number(simulationResults.yield_kg_ha);

    // 🔹 Effective rainfall
    const P_eff = Math.max(0, precipitation - drainage);

    // 🔹 Green & Blue water
    const ET_green = Math.min(P_eff, ETc);
    const ET_blue = ETc - ET_green;

    // 🔹 Convert mm → m³/ha
    const green_water = ET_green * 10;
    const blue_water = ET_blue * 10;

    // 🔹 Normalize by yield (kg/ha)
    const WF_green = green_water / yield_kg_ha;
    const WF_blue = blue_water / yield_kg_ha;

    // 🔹 Fertilizer data
    const fertilizers =
      simulationInputs.management.totalFertilizers || {};

    const urea = fertilizers.UREA || 0;
    const dap = fertilizers.DAP || 0;
    const an = fertilizers.AN || 0;

    // 🔹 Total Nitrogen
    const totalN =
      0.46 * urea +
      0.35 * an +
      0.18 * dap;

    // 🔹 Grey Water (your formula)
    const N_part = (0.1 * totalN) / 3.1;
    const P_part = (0.46 * dap * 0.03) / 0.95;

    const WF_grey = (N_part + P_part) / yield_kg_ha;

    // 🔥 Total Water Footprint
    const WF_total = WF_green + WF_blue + WF_grey;

    setResult({
      WF_green,
      WF_blue,
      WF_grey,
      WF_total,
      ET_green,
      ET_blue
    });
  };

  return (
    <div className="h2o-container">
      <h1>Water Footprint (H₂O)</h1>

      <button className="primary-btn" onClick={handleCalculate}>
        Calculate Water Footprint
      </button>

      {result && (
        <div className="result-section">
          <h2>Total WF: {result.WF_total.toFixed(4)} m³/kg</h2>

          <p>Green WF: {result.WF_green.toFixed(4)}</p>
          <p>Blue WF: {result.WF_blue.toFixed(4)}</p>
          <p>Grey WF: {result.WF_grey.toFixed(4)}</p>

          <hr />

          <p>ET Green: {result.ET_green.toFixed(2)} mm</p>
          <p>ET Blue: {result.ET_blue.toFixed(2)} mm</p>
        </div>
      )}
    </div>
  );
}

export default H2O;