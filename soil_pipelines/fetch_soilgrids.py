import requests
import json
import time
import os


# ======================================================
# INDIA BOUNDING BOX & GRID SETTINGS
# ======================================================

INDIA_BOUNDS = {
    "lat_min": 6.0,
    "lat_max": 37.0,
    "lon_min": 68.0,
    "lon_max": 97.0
}

GRID_STEP = 0.25
OUTPUT_FILE = "soil_profiles_0p25deg.json"


# ======================================================
# Generate 0.25° grid centroids
# ======================================================

def generate_grid_centroids(bounds, step=0.25):
    points = []

    lat = bounds["lat_min"] + step / 2
    while lat < bounds["lat_max"]:
        lon = bounds["lon_min"] + step / 2
        while lon < bounds["lon_max"]:
            points.append({
                "lat": round(lat, 3),
                "lon": round(lon, 3)
            })
            lon += step
        lat += step

    return points


# ======================================================
# Fetch SoilGrids data with rate-limit handling
# ======================================================

def fetch_soilgrids(lat, lon, max_retries=5):
    url = "https://rest.isric.org/soilgrids/v2.0/properties/query"

    params = {
        "lat": lat,
        "lon": lon,
        "property": ["bdod", "clay", "sand", "silt", "phh2o"],
        "depth": ["0-5cm", "5-15cm", "15-30cm"],
        "value": "mean"
    }

    for attempt in range(max_retries):
        response = requests.get(url, params=params, timeout=30)

        if response.status_code == 429:
            wait_time = 30 + attempt * 15
            print(f"⏳ Rate limited. Waiting {wait_time}s...")
            time.sleep(wait_time)
            continue

        response.raise_for_status()
        return response.json()

    raise Exception("Failed due to repeated rate limiting")


# ======================================================
# USDA Soil Texture Classification
# ======================================================

def classify_texture(sand, silt, clay):
    if sand is None or silt is None or clay is None:
        return "Unknown"

    if clay >= 40:
        if sand >= 45:
            return "Sandy Clay"
        elif silt >= 40:
            return "Silty Clay"
        else:
            return "Clay"

    if 27 <= clay < 40:
        if 20 <= sand <= 45:
            return "Clay Loam"
        elif sand > 45:
            return "Sandy Clay Loam"
        else:
            return "Silty Clay Loam"

    if 20 <= clay < 27:
        if sand >= 52:
            return "Sandy Clay Loam"
        elif silt >= 50:
            return "Silt Loam"
        else:
            return "Loam"

    if clay < 20:
        if sand >= 85:
            return "Sand"
        elif sand >= 70:
            return "Loamy Sand"
        elif sand >= 43:
            return "Sandy Loam"
        elif silt >= 80:
            return "Silt"
        elif silt >= 50:
            return "Silt Loam"
        else:
            return "Loam"

    return "Unknown"


# ======================================================
# Pedotransfer Functions (CERES-safe)
# ======================================================

def compute_field_capacity(sand, clay, bulk_density):
    fc = (
        0.7919
        + 0.001691 * clay
        - 0.29619 * bulk_density
        - 0.000001491 * sand * sand
        + 0.0000821 * clay * clay
    )
    return round(max(min(fc, 0.6), 0.1), 3)


def compute_wilting_point(sand, clay):
    wp = 0.024 + 0.004 * clay + 0.00015 * sand
    return round(max(min(wp, 0.4), 0.05), 3)


# ======================================================
# Safe SoilGrids value extraction
# ======================================================

def get_soilgrids_value(data, property_name, depth_label):
    for layer in data["properties"]["layers"]:
        if layer["name"] == property_name:
            d_factor = layer["unit_measure"]["d_factor"]
            for depth in layer["depths"]:
                if depth["label"] == depth_label:
                    mean_val = depth["values"].get("mean")
                    if mean_val is None:
                        return None
                    return mean_val / d_factor
    return None


# ======================================================
# Convert SoilGrids → PRISM soil profile
# ======================================================

def transform_to_prism_soil(data, lat, lon, location_id):
    depths = ["0-5cm", "5-15cm", "15-30cm"]
    layers = []

    for depth in depths:
        sand = get_soilgrids_value(data, "sand", depth)
        clay = get_soilgrids_value(data, "clay", depth)
        silt = get_soilgrids_value(data, "silt", depth)
        bd = get_soilgrids_value(data, "bdod", depth)

        if None in (sand, clay, silt, bd):
            return None

        layers.append({
            "depth_cm": depth,
            "bulk_density": bd,
            "sand": sand,
            "clay": clay,
            "silt": silt,
            "ph": get_soilgrids_value(data, "phh2o", depth),
            "texture_class": classify_texture(sand, silt, clay),
            "field_capacity": compute_field_capacity(sand, clay, bd),
            "wilting_point": compute_wilting_point(sand, clay)
        })

    return {
        "soil_id": f"SOIL_{lat}_{lon}",
        "location_id": location_id,
        "latitude": lat,
        "longitude": lon,
        "source": "SoilGrids_0.25deg",
        "layers": layers
    }


# ======================================================
# MAIN — Safe batch execution with resume support
# ======================================================

if __name__ == "__main__":

    grid_points = generate_grid_centroids(INDIA_BOUNDS, GRID_STEP)
    print(f"Total grid points: {len(grid_points)}")

    if os.path.exists(OUTPUT_FILE):
        with open(OUTPUT_FILE, "r") as f:
            soil_profiles = json.load(f)
        start_index = len(soil_profiles)
        print(f"Resuming from index {start_index}")
    else:
        soil_profiles = []
        start_index = 0

    for idx in range(start_index, len(grid_points)):
        lat = grid_points[idx]["lat"]
        lon = grid_points[idx]["lon"]
        location_id = f"GRID_025_{idx}"

        try:
            print(f"[{idx+1}/{len(grid_points)}] Fetching {lat}, {lon}")
            raw = fetch_soilgrids(lat, lon)
            soil = transform_to_prism_soil(raw, lat, lon, location_id)

            if soil is None:
                print(f"⚠️ Skipping invalid soil at {lat}, {lon}")
                continue

            soil_profiles.append(soil)

            with open(OUTPUT_FILE, "w") as f:
                json.dump(soil_profiles, f, indent=2)

            time.sleep(2)  # respectful rate limit

        except Exception as e:
            print(f"❌ Error at {lat}, {lon}: {e}")
            time.sleep(30)

    print("\n✅ SoilGrids 0.25° batch processing completed")
