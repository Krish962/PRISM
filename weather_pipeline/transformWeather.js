function formatDate(dateStr) {
  return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
}

function getDayOfYear(dateStr) {
  const date = new Date(formatDate(dateStr));
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function transformWeather(data) {
  const dates = Object.keys(data.T2M_MAX);

  const result = {
    "2024": [],
    "2025": []
  };

  for (let date of dates) {
    const record = {
      date: formatDate(date),
      doy: getDayOfYear(date),
      tmax: data.T2M_MAX[date],
      tmin: data.T2M_MIN[date],
      rain: data.PRECTOTCORR[date],
      srad: data.ALLSKY_SFC_SW_DWN[date],
      wind: data.WS2M[date] || 2
    };

    const year = date.slice(0, 4);
    result[year].push(record);
  }

  return result;
}

module.exports = transformWeather;