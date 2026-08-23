import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { runBatchSimulation } from "../services/api";
import "./SimulationForm.css"; // Reuse native styling

function BatchSimulationForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    location: { latitude: "", longitude: "" },
    crop: { cultivarCode: "", cultivarName: "" },
    treatments: []
  });

  // --- DEBUG TOOL ---
  // Call window.fill() in the browser console to auto-fill the form!
  useEffect(() => {
    window.fill = () => {
      const mConfigs = {
        M1: {
          plantingDate: "2026-01-01", harvestDate: "2026-05-09",
          irrigationSchedules: [
            { date: "2026-01-20", depth: 25 }, { date: "2026-01-21", depth: 30 }, { date: "2026-01-24", depth: 30 },
            { date: "2026-01-26", depth: 30 }, { date: "2026-01-27", depth: 40 }, { date: "2026-01-30", depth: 40 }
          ],
          fertilizerSchedules: [
            { date: "2026-01-02", type: "DAP", amount: 60 }, { date: "2026-01-02", type: "MOP", amount: 40 },
            { date: "2026-01-02", type: "UREA", amount: 75 }, { date: "2026-02-02", type: "UREA", amount: 38 },
            { date: "2026-03-02", type: "UREA", amount: 38 }, { date: "2026-03-16", type: "FE661", amount: 25 }
          ]
        },
        M2: {
          plantingDate: "2026-01-10", harvestDate: "2026-05-13",
          irrigationSchedules: [
            { date: "2026-01-27", depth: 25 }, { date: "2026-01-28", depth: 30 }, { date: "2026-01-30", depth: 30 },
            { date: "2026-02-01", depth: 30 }, { date: "2026-02-03", depth: 40 }, { date: "2026-02-05", depth: 40 },
            { date: "2026-02-10", depth: 50 }
          ],
          fertilizerSchedules: [
            { date: "2026-01-11", type: "UREA", amount: 75 }, { date: "2026-01-11", type: "DAP", amount: 60 },
            { date: "2026-01-11", type: "MOP", amount: 40 }, { date: "2026-02-10", type: "UREA", amount: 38 },
            { date: "2026-03-07", type: "UREA", amount: 38 }, { date: "2026-03-16", type: "FE661", amount: 25 }
          ]
        },
        M3: {
          plantingDate: "2026-01-20", harvestDate: "2026-05-18",
          irrigationSchedules: [
            { date: "2026-02-04", depth: 25 }, { date: "2026-02-05", depth: 30 }, { date: "2026-02-06", depth: 30 },
            { date: "2026-02-10", depth: 30 }, { date: "2026-02-13", depth: 50 }
          ],
          fertilizerSchedules: [
            { date: "2026-01-21", type: "MOP", amount: 40 }, { date: "2026-01-21", type: "DAP", amount: 60 },
            { date: "2026-01-21", type: "UREA", amount: 75 }, { date: "2026-02-20", type: "UREA", amount: 38 },
            { date: "2026-03-16", type: "FE661", amount: 25 }, { date: "2026-03-19", type: "UREA", amount: 38 }
          ]
        }
      };

      const sConfig = {
        S1: { pop: 140, row: 15 },
        S2: { pop: 140, row: 20 },
        S3: { pop: 143, row: 25 },
        S4: { pop: 143, row: 30 }
      };

      const generatedTreatments = [];
      let pCounter = 1;

      for (let m = 1; m <= 3; m++) {
        for (let s = 1; s <= 4; s++) {
          const mKey = `M${m}`;
          const sKey = `S${s}`;
          let finalPop = sConfig[sKey].pop;
          if (m === 2 && s === 1) finalPop = 150;
          if (m === 2 && s >= 2) finalPop = 154;

          generatedTreatments.push({
            name: `${mKey}${sKey}`,
            factorLevels: {
              CU: 1, FL: 1, SA: 1, IC: 1, MP: pCounter++, MI: m, MF: m,
              MR: 0, MC: m, MT: 0, ME: 0, MH: m, SM: 1
            },
            planting: {
              date: mConfigs[mKey].plantingDate, method: "S",
              populationDensity: finalPop, rowSpacing: sConfig[sKey].row, depth: 2
            },
            irrigationSchedules: mConfigs[mKey].irrigationSchedules.map(i => ({...i})),
            fertilizerSchedules: mConfigs[mKey].fertilizerSchedules.map(f => ({...f})),
            harvestDate: mConfigs[mKey].harvestDate
          });
        }
      }

      setFormData({
        location: { latitude: 22.314, longitude: 87.311 },
        crop: { cultivarCode: "IB0015", cultivarName: "IR 64" },
        treatments: generatedTreatments
      });
      console.log("12 Treatments loaded into form!");
    };
    
    return () => { delete window.fill; };
  }, []);

  const cultivars = [
    { code: "IB0055", name: "Basmati 385" },
    { code: "IB0015", name: "IR64" }
  ];

  const getCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormData({
          ...formData,
          location: { latitude, longitude }
        });
      },
      (error) => {
        console.error(error);
        alert("Unable to fetch location");
      }
    );
  };

  const getEmptyTreatment = () => ({
    name: "",
    factorLevels: {
      CU: 1, FL: 1, SA: 1, IC: 1, MP: 1, MI: 1, MF: 1, MR: 0, MC: 1, MT: 0, ME: 0, MH: 1, SM: 1
    },
    planting: {
      date: "",
      method: "",
      populationDensity: "",
      rowSpacing: "",
      depth: ""
    },
    irrigationSchedules: [],
    fertilizerSchedules: [],
    harvestDate: ""
  });

  const addTreatment = () => {
    setFormData({
      ...formData,
      treatments: [...formData.treatments, getEmptyTreatment()]
    });
  };

  const removeTreatment = (tIndex) => {
    const updated = formData.treatments.filter((_, i) => i !== tIndex);
    setFormData({ ...formData, treatments: updated });
  };

  // Generic handler for root treatment fields
  const handleTreatmentChange = (tIndex, section, field, value) => {
    const updated = [...formData.treatments];
    if (section) {
      updated[tIndex][section][field] = value;
    } else {
      updated[tIndex][field] = value;
    }
    setFormData({ ...formData, treatments: updated });
  };

  // Factor Levels
  const handleFactorChange = (tIndex, factor, value) => {
    const updated = [...formData.treatments];
    updated[tIndex].factorLevels[factor] = Number(value);
    setFormData({ ...formData, treatments: updated });
  };

  // Irrigation
  const addIrrigation = (tIndex) => {
    const updated = [...formData.treatments];
    updated[tIndex].irrigationSchedules.push({ date: "", depth: "" });
    setFormData({ ...formData, treatments: updated });
  };

  const handleIrrigationChange = (tIndex, iIndex, field, value) => {
    const updated = [...formData.treatments];
    updated[tIndex].irrigationSchedules[iIndex][field] = value;
    setFormData({ ...formData, treatments: updated });
  };

  const removeIrrigation = (tIndex, iIndex) => {
    const updated = [...formData.treatments];
    updated[tIndex].irrigationSchedules = updated[tIndex].irrigationSchedules.filter((_, i) => i !== iIndex);
    setFormData({ ...formData, treatments: updated });
  };

  // Fertilizer
  const addFertilizer = (tIndex) => {
    const updated = [...formData.treatments];
    updated[tIndex].fertilizerSchedules.push({ date: "", type: "", amount: "" });
    setFormData({ ...formData, treatments: updated });
  };

  const handleFertilizerChange = (tIndex, fIndex, field, value) => {
    const updated = [...formData.treatments];
    updated[tIndex].fertilizerSchedules[fIndex][field] = value;
    setFormData({ ...formData, treatments: updated });
  };

  const removeFertilizer = (tIndex, fIndex) => {
    const updated = [...formData.treatments];
    updated[tIndex].fertilizerSchedules = updated[tIndex].fertilizerSchedules.filter((_, i) => i !== fIndex);
    setFormData({ ...formData, treatments: updated });
  };

  const handleSubmit = async () => {
    if (!formData.location.latitude || !formData.location.longitude) {
      alert("Please provide location");
      return;
    }
    if (!formData.crop.cultivarCode) {
      alert("Please select a crop cultivar");
      return;
    }
    if (formData.treatments.length === 0) {
      alert("Please add at least one treatment");
      return;
    }

    try {
      setLoading(true);

      // Deep copy to ensure numbers are correctly typed where necessary
      const payload = {
        location: {
          latitude: Number(formData.location.latitude),
          longitude: Number(formData.location.longitude)
        },
        crop: {
          cropCode: "RI", // Assuming Rice as default
          cultivarCode: formData.crop.cultivarCode,
          cultivarName: formData.crop.cultivarName
        },
        treatments: formData.treatments.map(t => ({
          name: t.name || "UNNAMED",
          factorLevels: t.factorLevels,
          planting: {
            date: t.planting.date,
            method: t.planting.method,
            populationDensity: Number(t.planting.populationDensity),
            rowSpacing: Number(t.planting.rowSpacing),
            depth: Number(t.planting.depth)
          },
          irrigationSchedules: t.irrigationSchedules.map(i => ({ date: i.date, depth: Number(i.depth) })),
          fertilizerSchedules: t.fertilizerSchedules.map(f => ({ date: f.date, type: f.type, amount: Number(f.amount) })),
          harvestDate: t.harvestDate
        }))
      };

      console.log("Submitting Batch Payload:", payload);
      const response = await runBatchSimulation(payload);
      const batchResults = Array.isArray(response) ? response : [response];

      navigate("/batch-results", {
        state: { batchResults }
      });
    } catch (error) {
      console.error("Batch simulation failed:", error);
      alert("Batch simulation failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1 className="title">Batch Simulation Builder</h1>

      {/* Global Config */}
      <div className="section">
        <h2>Location</h2>
        <div className="row">
          <input type="number" placeholder="Latitude" value={formData.location.latitude}
            onChange={(e) => setFormData({ ...formData, location: { ...formData.location, latitude: e.target.value } })}
          />
          <input type="number" placeholder="Longitude" value={formData.location.longitude}
            onChange={(e) => setFormData({ ...formData, location: { ...formData.location, longitude: e.target.value } })}
          />
        </div>
        <button className="secondary-btn" onClick={getCurrentLocation}>Use Current Location</button>
      </div>

      <div className="section">
        <h2>Crop</h2>
        <select
          value={formData.crop.cultivarCode}
          onChange={(e) => {
            const selected = cultivars.find(c => c.code === e.target.value);
            setFormData({
              ...formData,
              crop: { cultivarCode: selected?.code || "", cultivarName: selected?.name || "" }
            });
          }}
        >
          <option value="">Select Cultivar</option>
          {cultivars.map((c) => (
            <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
          ))}
        </select>
      </div>

      {/* Dynamic Treatments */}
      {formData.treatments.map((t, tIndex) => (
        <div key={tIndex} className="section" style={{ borderLeft: "4px solid var(--accent)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2>Treatment {tIndex + 1}</h2>
            <button className="danger-btn" onClick={() => removeTreatment(tIndex)}>Remove Treatment</button>
          </div>

          <div className="row">
            <input type="text" placeholder="Treatment Name (e.g. M1S1)" value={t.name}
              onChange={(e) => handleTreatmentChange(tIndex, null, "name", e.target.value)}
            />
          </div>

          <h3 style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "16px", marginBottom: "8px" }}>Factor Levels</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(50px, 1fr))", gap: "10px", marginBottom: "16px" }}>
            {Object.entries(t.factorLevels).map(([factor, value]) => (
              <div key={factor} style={{ display: "flex", flexDirection: "column" }}>
                <label style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "4px" }}>{factor}</label>
                <input type="number" value={value} onChange={(e) => handleFactorChange(tIndex, factor, e.target.value)} style={{ minWidth: "0", width: "100%", height: "30px", padding: "0 6px", fontSize: "13px" }} />
              </div>
            ))}
          </div>

          <h3 style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "16px", marginBottom: "8px" }}>Planting Details</h3>
          <div className="row">
            <input type="date" value={t.planting.date} onChange={(e) => handleTreatmentChange(tIndex, "planting", "date", e.target.value)} />
            <select value={t.planting.method} onChange={(e) => handleTreatmentChange(tIndex, "planting", "method", e.target.value)}>
              <option value="">Method</option>
              <option value="S">Seed</option>
              <option value="T">Transplant</option>
            </select>
          </div>
          <div className="row">
            <input type="number" placeholder="Pop Density" value={t.planting.populationDensity} onChange={(e) => handleTreatmentChange(tIndex, "planting", "populationDensity", e.target.value)} />
            <input type="number" placeholder="Row Space (cm)" value={t.planting.rowSpacing} onChange={(e) => handleTreatmentChange(tIndex, "planting", "rowSpacing", e.target.value)} />
            <input type="number" placeholder="Depth (cm)" value={t.planting.depth} onChange={(e) => handleTreatmentChange(tIndex, "planting", "depth", e.target.value)} />
          </div>

          <h3 style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "16px", marginBottom: "8px" }}>Irrigation Schedule</h3>
          {t.irrigationSchedules.map((item, iIndex) => (
            <div className="row" key={iIndex}>
              <input type="date" value={item.date} onChange={(e) => handleIrrigationChange(tIndex, iIndex, "date", e.target.value)} />
              <input type="number" placeholder="Depth (mm)" value={item.depth} onChange={(e) => handleIrrigationChange(tIndex, iIndex, "depth", e.target.value)} />
              <button className="danger-btn" onClick={() => removeIrrigation(tIndex, iIndex)}>Del</button>
            </div>
          ))}
          <button className="secondary-btn" onClick={() => addIrrigation(tIndex)}>+ Add Irrigation</button>

          <h3 style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "16px", marginBottom: "8px" }}>Fertilizer Schedule</h3>
          {t.fertilizerSchedules.map((item, fIndex) => (
            <div className="row" key={fIndex}>
              <input type="date" value={item.date} onChange={(e) => handleFertilizerChange(tIndex, fIndex, "date", e.target.value)} />
              <select value={item.type} onChange={(e) => handleFertilizerChange(tIndex, fIndex, "type", e.target.value)}>
                <option value="">Type</option>
                <option value="UREA">Urea</option>
                <option value="DAP">DAP</option>
                <option value="MOP">MOP</option>
                <option value="FE661">FE661</option>
              </select>
              <input type="number" placeholder="Amount" value={item.amount} onChange={(e) => handleFertilizerChange(tIndex, fIndex, "amount", e.target.value)} />
              <button className="danger-btn" onClick={() => removeFertilizer(tIndex, fIndex)}>Del</button>
            </div>
          ))}
          <button className="secondary-btn" onClick={() => addFertilizer(tIndex)}>+ Add Fertilizer</button>

          <h3 style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "16px", marginBottom: "8px" }}>Harvest Date</h3>
          <input type="date" value={t.harvestDate} onChange={(e) => handleTreatmentChange(tIndex, null, "harvestDate", e.target.value)} />

        </div>
      ))}

      <button className="secondary-btn" style={{ width: "100%", height: "48px", marginBottom: "20px" }} onClick={addTreatment}>
        + Add Treatment (Simulation)
      </button>

      <button className="primary-btn" onClick={handleSubmit} disabled={loading}>
        {loading ? "Running Batch..." : "Run Batch Simulation"}
      </button>
    </div>
  );
}

export default BatchSimulationForm;
