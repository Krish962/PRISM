import { useLocation } from "react-router-dom";
import { useState } from "react";
import "./Energy.css";

function Energy() {
  const location = useLocation();
  const { simulationInputs, simulationResults } = location.state || {};

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const [energyInputs, setEnergyInputs] = useState({
    area: "",
    human: {
      men: "",
      women: "",
      menHours: "",
      womenHours: ""
    },
    animal: {
      bullocks: "",
      bullockHours: "",
      others: "",
      othersHours: ""
    },
    fuel: {
      diesel: "",
      petrol: "",
      electricity: ""
    },
    machinery: {   // ✅ FIXED (was missing)
      electricMotors: "",
      primeMovers: "",
      farmMachinery: "",
      tractor: "",
      harvester: ""
    },
    seed: {        // ✅ NEW
      amount: ""
    }
  });

  if (!simulationResults) {
    return <h2>No Data Available</h2>;
  }

  const handleChange = (section, field, value) => {
    setEnergyInputs({
      ...energyInputs,
      [section]: {
        ...energyInputs[section],
        [field]: value
      }
    });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const payload = {
        simulationInputs,
        simulationResults,
        energyInputs
      };

      console.log("ENERGY PAYLOAD:", payload);

      const res = await fetch("http://localhost:5000/api/energy/calculate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      console.log("Result Json: ", data)
      setResult(data);

    } catch (err) {
      console.error(err);
      alert("Energy calculation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="energy-container">
      <h1>Energy Calculation</h1>

      {/* 🌍 Farm Area */}
      <div className="section">
        <h2>Farm Details</h2>
        <input
          type="number"
          placeholder="Farm Area (hectares)"
          onChange={(e) =>
            setEnergyInputs({
              ...energyInputs,
              area: e.target.value
            })
          }
        />
      </div>

      {/* 👨‍🌾 Human Labour */}
      <div className="section">
        <h2>Human Labour</h2>
        <input type="number" placeholder="Men"
          onChange={(e) => handleChange("human", "men", e.target.value)} />
        <input type="number" placeholder="Men Hours"
          onChange={(e) => handleChange("human", "menHours", e.target.value)} />
        <input type="number" placeholder="Women"
          onChange={(e) => handleChange("human", "women", e.target.value)} />
        <input type="number" placeholder="Women Hours"
          onChange={(e) => handleChange("human", "womenHours", e.target.value)} />
      </div>

      {/* 🐂 Animal Labour */}
      <div className="section">
        <h2>Animal Labour</h2>
        <input type="number" placeholder="Bullocks"
          onChange={(e) => handleChange("animal", "bullocks", e.target.value)} />
        <input type="number" placeholder="Bullock Hours"
          onChange={(e) => handleChange("animal", "bullockHours", e.target.value)} />
        <input type="number" placeholder="Other Animals"
          onChange={(e) => handleChange("animal", "others", e.target.value)} />
        <input type="number" placeholder="Other Hours"
          onChange={(e) => handleChange("animal", "othersHours", e.target.value)} />
      </div>

      {/* ⛽ Fuel */}
      <div className="section">
        <h2>Fuel & Electricity</h2>
        <input type="number" placeholder="Diesel (L)"
          onChange={(e) => handleChange("fuel", "diesel", e.target.value)} />
        <input type="number" placeholder="Petrol (L)"
          onChange={(e) => handleChange("fuel", "petrol", e.target.value)} />
        <input type="number" placeholder="Electricity (kWh)"
          onChange={(e) => handleChange("fuel", "electricity", e.target.value)} />
      </div>

      {/* 🌱 Seed */}
      <div className="section">
        <h2>Seed</h2>
        <input
          type="number"
          placeholder="Seed Rate (kg/ha)"
          onChange={(e) => handleChange("seed", "amount", e.target.value)}
        />
      </div>

      {/* 🚜 Machinery */}
      <div className="section">
        <h2>Machinery (hours)</h2>

        <input type="number" placeholder="Electric Motors Hours"
          onChange={(e) => handleChange("machinery", "electricMotors", e.target.value)}
        />

        <input type="number" placeholder="Prime Movers Hours"
          onChange={(e) => handleChange("machinery", "primeMovers", e.target.value)}
        />

        <input type="number" placeholder="Farm Machinery Hours"
          onChange={(e) => handleChange("machinery", "farmMachinery", e.target.value)}
        />

        <input type="number" placeholder="Tractor Hours"
          onChange={(e) => handleChange("machinery", "tractor", e.target.value)}
        />

        <input type="number" placeholder="Combine Harvester Hours"
          onChange={(e) => handleChange("machinery", "harvester", e.target.value)}
        />
      </div>

      <button className="primary-btn" onClick={handleSubmit} disabled={loading}>
        {loading ? "Calculating..." : "Calculate Energy"}
      </button>

      {/* 📊 Result Section */}
      {result && (
        <div className="result-section">
          <h2>Total Energy: {result.totalEnergy} MJ</h2>

          <div className="result-item">Human: {result.breakdown.human}</div>
          <div className="result-item">Animal: {result.breakdown.animal}</div>
          <div className="result-item">Fuel: {result.breakdown.fuel}</div>
          <div className="result-item">Fertilizer: {result.breakdown.fertilizer}</div>
          <div className="result-item">Seed: {result.breakdown.seed}</div> {/* ✅ NEW */}
          <div className="result-item">Machinery: {result.breakdown.machinery}</div> {/* ✅ NEW */}
        </div>
      )}
    </div>
  );
}

export default Energy;