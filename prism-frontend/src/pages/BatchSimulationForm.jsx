import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { runBatchSimulation } from "../services/api";

function BatchSimulationForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    location: {
      latitude: "",
      longitude: ""
    },
    trtno: ""
  });

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    if (name === "latitude" || name === "longitude") {
      setFormData((prev) => ({
        ...prev,
        location: {
          ...prev.location,
          [name]: value
        }
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const latitude = Number(formData.location.latitude);
    const longitude = Number(formData.location.longitude);
    const trtno = Number(formData.trtno);

    if (!formData.location.latitude || !formData.location.longitude || !formData.trtno) {
      alert("Please enter latitude, longitude, and trtno");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        location: {
          latitude,
          longitude
        },
        trtno
      };

      const response = await runBatchSimulation(payload);

      const batchResults = Array.isArray(response) ? response : [response];

      navigate("/batch-results", {
        state: {
          batchResults
        }
      });
    } catch (error) {
      console.error("Batch simulation failed:", error);
      alert("Batch simulation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "40px auto", padding: "24px", fontFamily: "sans-serif" }}>
      <h1>Batch Simulation</h1>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "8px" }}>Latitude</label>
          <input
            type="number"
            step="any"
            name="latitude"
            value={formData.location.latitude}
            onChange={handleInputChange}
            placeholder="22.314"
            style={{ width: "100%", padding: "10px", boxSizing: "border-box" }}
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "8px" }}>Longitude</label>
          <input
            type="number"
            step="any"
            name="longitude"
            value={formData.location.longitude}
            onChange={handleInputChange}
            placeholder="87.311"
            style={{ width: "100%", padding: "10px", boxSizing: "border-box" }}
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "8px" }}>TRTNO</label>
          <input
            type="number"
            name="trtno"
            value={formData.trtno}
            onChange={handleInputChange}
            placeholder="12"
            style={{ width: "100%", padding: "10px", boxSizing: "border-box" }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            background: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "Running..." : "Run Batch Simulation"}
        </button>
      </form>
    </div>
  );
}

export default BatchSimulationForm;
