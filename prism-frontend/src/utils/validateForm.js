export const validateForm = (formData) => {
  const errors = [];

  // Location
  if (!formData.location.latitude || !formData.location.longitude) {
    errors.push("Location (latitude & longitude) is required");
  }

  // Crop
  if (!formData.crop.cultivarCode) {
    errors.push("Please select a cultivar");
  }

  // Planting
  const p = formData.management.planting;

  if (!p.date) errors.push("Planting date is required");
  if (!p.method) errors.push("Planting method is required");

  if (!p.populationDensity || p.populationDensity <= 0) {
    errors.push("Population density must be > 0 (plants/m²)");
  }

  if (!p.rowSpacing || p.rowSpacing <= 0) {
    errors.push("Row spacing must be > 0 (cm)");
  }

  if (!p.depth || p.depth <= 0) {
    errors.push("Planting depth must be > 0 (cm)");
  }

  // Irrigation


  formData.management.irrigationSchedules.forEach((i, idx) => {
    if (!i.date) errors.push(`Irrigation #${idx + 1}: date required`);
    if (!i.depth || i.depth <= 0) {
      errors.push(`Irrigation #${idx + 1}: depth must be > 0 (mm)`);
    }
  });

  // Fertilizer
  formData.management.fertilizerSchedules.forEach((f, idx) => {
    if (!f.date) errors.push(`Fertilizer #${idx + 1}: date required`);
    if (!f.type) errors.push(`Fertilizer #${idx + 1}: type required`);
    if (!f.amount || f.amount <= 0) {
      errors.push(`Fertilizer #${idx + 1}: amount must be > 0 (kg/ha)`);
    }
  });

  // Harvest
  if (!formData.management.harvestDate) {
    errors.push("Harvest date is required");
  }

  return errors;
};