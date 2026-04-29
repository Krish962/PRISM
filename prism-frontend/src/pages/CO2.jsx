import { useLocation } from "react-router-dom";
import { useState } from "react";
import "./CO2.css";

function CO2() {
  const location = useLocation();
  const { simulationInputs, simulationResults } = location.state || {};

  const [inputs, setInputs] = useState({
    area: "",
    diesel: "",
    petrol: "",
    electricity: ""
  });

  const [result, setResult] = useState(null);

  if (!simulationResults || !simulationInputs) {
    return <h2>No Data Available</h2>;
  }

  const handleChange = (field, value) => {
    setInputs({
      ...inputs,
      [field]: value
    });
  };

  const handleCalculate = () => {
    const area = Number(inputs.area);
    const diesel = Number(inputs.diesel);
    const petrol = Number(inputs.petrol);
    const electricity = Number(inputs.electricity);

    const fertilizers =
      simulationInputs.management.totalFertilizers || {};

    // 🔹 1. FIELD EMISSION
    const fieldEmission =
      Number(simulationResults.tceqc || 0) * area;

    // 🔹 2. ENERGY EMISSION
    const energyEmission =
      diesel * 2.68 +
      petrol * 2.31 +
      electricity * 0.82;

    // 🔹 3. INPUT EMISSION

    const urea = (fertilizers.UREA || 0) * area;
    const dap = (fertilizers.DAP || 0) * area;
    const an = (fertilizers.AN || 0) * area;

    // Total Nitrogen
    const totalN =
      0.46 * urea +
      0.35 * an +
      0.18 * dap;

    // N2O Emission
    const n2oEmission =
      265 * (44 / 28) * (totalN / 100);

    // Manufacturing
    const manufacturingEmission =
      1.5 * urea +
      3 * an +
      1 * dap;

    const inputEmission =
      n2oEmission + manufacturingEmission;

    // 🔥 FINAL
    const totalCO2 =
      fieldEmission +
      energyEmission +
      inputEmission;

    setResult({
      fieldEmission,
      energyEmission,
      inputEmission,
      totalCO2
    });
  };

  return (
    <div className="co2-container">
      <h1>CO₂ Footprint Calculator</h1>

      <div className="section">
        <h2>Inputs</h2>

        <input
          type="number"
          placeholder="Area (hectares)"
          onChange={(e) =>
            handleChange("area", e.target.value)
          }
        />

        <input
          type="number"
          placeholder="Diesel (litres)"
          onChange={(e) =>
            handleChange("diesel", e.target.value)
          }
        />

        <input
          type="number"
          placeholder="Petrol (litres)"
          onChange={(e) =>
            handleChange("petrol", e.target.value)
          }
        />

        <input
          type="number"
          placeholder="Electricity (kWh)"
          onChange={(e) =>
            handleChange("electricity", e.target.value)
          }
        />
      </div>

      <button className="primary-btn" onClick={handleCalculate}>
        Calculate CO₂
      </button>

      {result && (
        <div className="result-section">
          <h2>Total CO₂: {result.totalCO2.toFixed(2)} kg CO₂eq</h2>

          <p>Field: {result.fieldEmission.toFixed(2)}</p>
          <p>Energy: {result.energyEmission.toFixed(2)}</p>
          <p>Inputs: {result.inputEmission.toFixed(2)}</p>
        </div>
      )}
    </div>
  );
}

export default CO2;