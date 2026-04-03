export const buildPayload = (formData) => {
  return {
    location: {
      latitude: Number(formData.location.latitude),
      longitude: Number(formData.location.longitude)
    },
    crop: {
      cultivarCode: formData.crop.cultivarCode,
      cultivarName: formData.crop.cultivarName
    },
    management: {
      planting: {
        ...formData.management.planting,
        populationDensity: Number(formData.management.planting.populationDensity),
        rowSpacing: Number(formData.management.planting.rowSpacing),
        depth: Number(formData.management.planting.depth)
      },
      irrigationSchedules: formData.management.irrigationSchedules.map((i) => ({
        date: i.date,
        depth: Number(i.depth)
      })),
      fertilizerSchedules: formData.management.fertilizerSchedules.map((f) => ({
        date: f.date,
        type: f.type,
        amount: Number(f.amount)
      })),
      harvestDate: formData.management.harvestDate
    }
  };
};