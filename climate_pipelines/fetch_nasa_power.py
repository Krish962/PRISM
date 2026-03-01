import requests


NASA_POWER_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"


def fetch_yearly_climate(lat, lon, year):
    """
    Fetch one full year of daily climate data from NASA POWER
    for a given latitude & longitude.

    Returns raw JSON response.
    """

    params = {
        "latitude": lat,
        "longitude": lon,
        "start": f"{year}0101",
        "end": f"{year}1231",
        "parameters": ",".join([
            "ALLSKY_SFC_SW_DWN",   # Solar radiation (MJ/m²/day)
            "T2M_MAX",             # Max temperature (°C)
            "T2M_MIN",             # Min temperature (°C)
            "PRECTOTCORR"          # Precipitation (mm/day)
        ]),
        "community": "AG",
        "format": "JSON"
    }

    response = requests.get(NASA_POWER_URL, params=params, timeout=30)

    # Raise error for HTTP issues (429, 500, etc.)
    response.raise_for_status()

    data = response.json()

    # Basic sanity check
    if "properties" not in data or "parameter" not in data["properties"]:
        raise ValueError("Invalid NASA POWER response format")

    return data


# ------------------------------------------------------
# Standalone test (IMPORTANT)
# ------------------------------------------------------
if __name__ == "__main__":
    lat = 23.875
    lon = 85.375
    year = 2024

    raw = fetch_yearly_climate(lat, lon, year)

    # Print available parameters and number of days
    params = raw["properties"]["parameter"]
    print("Fetched parameters:", params.keys())

    sample_param = next(iter(params.values()))
    print("Number of days fetched:", len(sample_param))
