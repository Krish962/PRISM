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
      totalFertilizers: {
        UREA: Number(formData.management.totalFertilizers?.UREA || 0),
        DAP: Number(formData.management.totalFertilizers?.DAP || 0),
        MOP: Number(formData.management.totalFertilizers?.MOP || 0),
        KNO3: Number(formData.management.totalFertilizers?.KNO3 || 0),
        AN: Number(formData.management.totalFertilizers?.AN || 0)
      },
      harvestDate: formData.management.harvestDate
    }
  };
};