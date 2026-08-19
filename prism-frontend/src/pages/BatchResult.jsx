import { useLocation, useNavigate } from "react-router-dom";

function BatchResult() {
  const navigate = useNavigate();
  const location = useLocation();
  const batchResults = location.state?.batchResults || [];

  if (!Array.isArray(batchResults) || batchResults.length === 0) {
    return (
      <div style={{ maxWidth: "700px", margin: "40px auto", padding: "24px", fontFamily: "sans-serif" }}>
        <h2>No batch results available</h2>
        <button
          onClick={() => navigate("/batch")}
          style={{
            padding: "10px 16px",
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer"
          }}
        >
          Back to Batch Simulation
        </button>
      </div>
    );
  }

  const handleOpenResult = (index) => {
    const selectedResult = batchResults[index];

    navigate("/results", {
      state: {
        simulationInputs: {
          location: { latitude: "", longitude: "" },
          trtno: selectedResult?.treatment ?? index + 1,
          management: {}
        },
        simulationResults: selectedResult
      }
    });
  };

  return (
    <div style={{ maxWidth: "800px", margin: "40px auto", padding: "24px", fontFamily: "sans-serif" }}>
      <h1>Batch Simulation Results</h1>
      <p style={{ marginBottom: "24px" }}>
        {batchResults.length} simulations found. Select one to view the detailed result.
      </p>

      <div style={{ display: "grid", gap: "12px" }}>
        {batchResults.map((result, index) => {
          const treatmentNo = result?.treatment ?? index + 1;
          const yieldValue = result?.yield_kg_ha ?? "N/A";

          return (
            <button
              key={`${treatmentNo}-${index}`}
              onClick={() => handleOpenResult(index)}
              style={{
                textAlign: "left",
                padding: "16px 18px",
                border: "1px solid #d1d5db",
                borderRadius: "10px",
                background: "#fff",
                cursor: "pointer",
                fontSize: "16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <span>Treatment {treatmentNo}</span>
              <span style={{ color: "#374151" }}>Yield: {yieldValue} kg/ha</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default BatchResult;
