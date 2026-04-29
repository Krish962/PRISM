import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";

import "./Results.css";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const { simulationInputs, simulationResults } = location.state || {};

  if (!simulationResults) {
    return <h2 className="no-data">No Data Available</h2>;
  }

  return (
    <div className="results-container">
      <h1 className="results-title">Simulation Results</h1>

      {/* 📊 Summary Card */}
      <div className="results-card">
        <div className="result-item">
          <span className="label">Yield</span>
          <span className="value">{simulationResults.yield_kg_ha} kg/ha</span>
        </div>

        <div className="result-item">
          <span className="label">Biomass</span>
          <span className="value">{simulationResults.biomass_kg_ha} kg/ha</span>
        </div>

        <div className="result-item">
          <span className="label">Harvest Index</span>
          <span className="value">{simulationResults.harvest_index}</span>
        </div>

        <div className="result-item">
          <span className="label">Max LAI</span>
          <span className="value">{simulationResults.max_lai}</span>
        </div>

        <div className="result-item">
          <span className="label">Growth Duration</span>
          <span className="value">{simulationResults.growth_duration} days</span>
        </div>
      </div>

      {/* 🌿 LAI Chart */}
      <div className="chart-container">
        <h2>LAI Growth Curve</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={simulationResults.lai_series}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" label={{ value: "Days", position: "insideBottom", offset: -5 }} />
            <YAxis label={{ value: "LAI", angle: -90, position: "insideLeft" }} />
            <Tooltip />
            <Line type="monotone" dataKey="lai" stroke="#28a745" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 📈 Biomass Chart */}
      <div className="chart-container">
        <h2>Biomass Accumulation</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={simulationResults.biomass_series}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" label={{ value: "Days", position: "insideBottom", offset: -5 }} />
            <YAxis label={{ value: "Biomass (kg/ha)", angle: -90, position: "insideLeft" }} />
            <Tooltip />
            <Line type="monotone" dataKey="biomass" stroke="#007bff" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <button
        className="primary-btn"
        onClick={() =>
          navigate("/energy", {
            state: {
              simulationInputs,
              simulationResults
            }
          })
        }
      >
        Calculate Energy
      </button>

      <button
        className="primary-btn"
        onClick={() =>
          navigate("/co2", {
            state: {
              simulationInputs,
              simulationResults
            }
          })
        }
      >
        Calculate CO₂ Footprint
      </button>

      <button
        className="primary-btn"
        onClick={() =>
          navigate("/h2o", {
            state: {
              simulationInputs,
              simulationResults
            }
          })
        }
      >
        Calculate H₂O Footprint
      </button>
    </div>
  );
}

export default Results;