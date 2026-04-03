import { useLocation } from "react-router-dom";
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
  const data = location.state;

  if (!data) {
    return <h2 className="no-data">No Data Available</h2>;
  }

  return (
    <div className="results-container">
      <h1 className="results-title">Simulation Results</h1>

      {/* 📊 Summary Card */}
      <div className="results-card">
        <div className="result-item">
          <span className="label">Yield</span>
          <span className="value">{data.yield_kg_ha} kg/ha</span>
        </div>

        <div className="result-item">
          <span className="label">Biomass</span>
          <span className="value">{data.biomass_kg_ha} kg/ha</span>
        </div>

        <div className="result-item">
          <span className="label">Harvest Index</span>
          <span className="value">{data.harvest_index}</span>
        </div>

        <div className="result-item">
          <span className="label">Max LAI</span>
          <span className="value">{data.max_lai}</span>
        </div>

        <div className="result-item">
          <span className="label">Growth Duration</span>
          <span className="value">{data.growth_duration} days</span>
        </div>
      </div>

      {/* 🌿 LAI Chart */}
      <div className="chart-container">
        <h2>LAI Growth Curve</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.lai_series}>
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
          <LineChart data={data.biomass_series}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" label={{ value: "Days", position: "insideBottom", offset: -5 }} />
            <YAxis label={{ value: "Biomass (kg/ha)", angle: -90, position: "insideLeft" }} />
            <Tooltip />
            <Line type="monotone" dataKey="biomass" stroke="#007bff" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default Results;