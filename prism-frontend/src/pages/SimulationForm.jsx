import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { buildPayload } from "../utils/buildPayload";
import { runSimulation } from "../services/api";
import { validateForm } from "../utils/validateForm";
import "./SimulationForm.css";

function SimulationForm() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    location: { latitude: "", longitude: "" },
    crop: { cultivarCode: "", cultivarName: "" },
    management: {
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
    }
  });

  const getCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        setFormData({
          ...formData,
          location: {
            latitude,
            longitude
          }
        });
      },
      (error) => {
        console.error(error);
        alert("Unable to fetch location");
      }
    );
  };

  const cultivars = [
    { code: "IB0055", name: "Basmati 385" },
    { code: "IR064", name: "IR64" }
  ];

  const addIrrigation = () => {
    setFormData({
      ...formData,
      management: {
        ...formData.management,
        irrigationSchedules: [
          ...formData.management.irrigationSchedules,
          { date: "", depth: "" }
        ]
      }
    });
  };

  const handleIrrigationChange = (index, field, value) => {
    const updated = [...formData.management.irrigationSchedules];
    updated[index][field] = value;

    setFormData({
      ...formData,
      management: {
        ...formData.management,
        irrigationSchedules: updated
      }
    });
  };

  const removeIrrigation = (index) => {
    const updated = formData.management.irrigationSchedules.filter(
      (_, i) => i !== index
    );

    setFormData({
      ...formData,
      management: {
        ...formData.management,
        irrigationSchedules: updated
      }
    });
  };

  const addFertilizer = () => {
    setFormData({
      ...formData,
      management: {
        ...formData.management,
        fertilizerSchedules: [
          ...formData.management.fertilizerSchedules,
          { date: "", type: "", amount: "" }
        ]
      }
    });
  };

  const handleFertilizerChange = (index, field, value) => {
    const updated = [...formData.management.fertilizerSchedules];
    updated[index][field] = value;

    setFormData({
      ...formData,
      management: {
        ...formData.management,
        fertilizerSchedules: updated
      }
    });
  };

  const removeFertilizer = (index) => {
    const updated = formData.management.fertilizerSchedules.filter(
      (_, i) => i !== index
    );

    setFormData({
      ...formData,
      management: {
        ...formData.management,
        fertilizerSchedules: updated
      }
    });
  };

  const handleSubmit = async () => {
    const errors = validateForm(formData);

    if (errors.length > 0) {
      alert(errors.join("\n"));
      return;
    }

    try {
      setLoading(true);

      const payload = buildPayload(formData);

      console.log("FINAL PAYLOAD:", payload);

      const result = await runSimulation(payload);

      navigate("/results", { state: result });

    } catch (err) {
      console.error(err);
      alert("Simulation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1 className="title">PRISM Simulation</h1>

      <div className="section">
        <h2>Location</h2>
        <div className="row">
          <input type="number" placeholder="Latitude" value={formData.location.latitude}
            onChange={(e) =>
              setFormData({
                ...formData,
                location: { ...formData.location, latitude: e.target.value }
              })
            }
          />
          <input type="number" placeholder="Longitude" value={formData.location.longitude}
            onChange={(e) =>
              setFormData({
                ...formData,
                location: { ...formData.location, longitude: e.target.value }
              })
            }
          />
        </div>
        <button className="secondary-btn" onClick={getCurrentLocation}>
          Use Current Location
        </button>
      </div>

      <div className="section">
        <h2>Crop</h2>
        <select
          value={formData.crop.cultivarCode}
          onChange={(e) => {
            const selected = cultivars.find(c => c.code === e.target.value);
            setFormData({
              ...formData,
              crop: {
                cultivarCode: selected.code,
                cultivarName: selected.name
              }
            });
          }}
        >
          <option value="">Select Cultivar</option>
          {cultivars.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name} ({c.code})
            </option>
          ))}
        </select>
      </div>

      <div className="section">
        <h2>Planting Details</h2>
        <div className="row">
          <input type="date" value={formData.management.planting.date}
            onChange={(e) =>
              setFormData({
                ...formData,
                management: {
                  ...formData.management,
                  planting: {
                    ...formData.management.planting,
                    date: e.target.value
                  }
                }
              })
            }
          />
          <select value={formData.management.planting.method}
            onChange={(e) =>
              setFormData({
                ...formData,
                management: {
                  ...formData.management,
                  planting: {
                    ...formData.management.planting,
                    method: e.target.value
                  }
                }
              })
            }
          >
            <option value="">Select Method</option>
            <option value="T">Transplanting</option>
            <option value="D">Direct Seeding</option>
          </select>
        </div>

        <div className="row">
          <input type="number" placeholder="Population Density (plants/m²)" value={formData.management.planting.populationDensity}
            onChange={(e) =>
              setFormData({
                ...formData,
                management: {
                  ...formData.management,
                  planting: {
                    ...formData.management.planting,
                    populationDensity: e.target.value
                  }
                }
              })
            }
          />

          <input type="number" placeholder="Row Spacing (cm)" value={formData.management.planting.rowSpacing}
            onChange={(e) =>
              setFormData({
                ...formData,
                management: {
                  ...formData.management,
                  planting: {
                    ...formData.management.planting,
                    rowSpacing: e.target.value
                  }
                }
              })
            }
          />

          <input type="number" placeholder="Depth (cm)" value={formData.management.planting.depth}
            onChange={(e) =>
              setFormData({
                ...formData,
                management: {
                  ...formData.management,
                  planting: {
                    ...formData.management.planting,
                    depth: e.target.value
                  }
                }
              })
            }
          />
        </div>
      </div>

      <div className="section">
        <h2>Irrigation Schedule</h2>
        {formData.management.irrigationSchedules.map((item, index) => (
          <div className="row" key={index}>
            <input type="date" value={item.date}
              onChange={(e) =>
                handleIrrigationChange(index, "date", e.target.value)
              }
            />
            <input type="number" placeholder="Depth (mm water)" value={item.depth}
              onChange={(e) =>
                handleIrrigationChange(index, "depth", e.target.value)
              }
            />
            <button className="danger-btn" onClick={() => removeIrrigation(index)}>Delete</button>
          </div>
        ))}
        <button className="secondary-btn" onClick={addIrrigation}>Add Irrigation</button>
      </div>

      <div className="section">
        <h2>Fertilizer Schedule</h2>
        {formData.management.fertilizerSchedules.map((item, index) => (
          <div className="row" key={index}>
            <input type="date" value={item.date}
              onChange={(e) =>
                handleFertilizerChange(index, "date", e.target.value)
              }
            />
            <select value={item.type}
              onChange={(e) =>
                handleFertilizerChange(index, "type", e.target.value)
              }
            >
              <option value="">Type</option>
              <option value="N">Nitrogen</option>
              <option value="P">Phosphorus</option>
              <option value="K">Potassium</option>
            </select>
            <input type="number" placeholder="Amount (Kg/ha)" value={item.amount}
              onChange={(e) =>
                handleFertilizerChange(index, "amount", e.target.value)
              }
            />
            <button className="danger-btn" onClick={() => removeFertilizer(index)}>Delete</button>
          </div>
        ))}
        <button className="secondary-btn" onClick={addFertilizer}>Add Fertilizer</button>
      </div>

      <div className="section">
        <h2>Harvest</h2>
        <input type="date" value={formData.management.harvestDate}
          onChange={(e) =>
            setFormData({
              ...formData,
              management: {
                ...formData.management,
                harvestDate: e.target.value
              }
            })
          }
        />
      </div>

      <button className="primary-btn" onClick={handleSubmit} disabled={loading}>
        {loading ? "Running Simulation..." : "Run Simulation"}
      </button>
    </div>
  );
}

export default SimulationForm;