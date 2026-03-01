import os
import time
import json

from fetch_nasa_power import fetch_yearly_climate
from transform_climate import transform_nasa_to_daily
from validate_climate import validate_daily_climate
from grid_generator import generate_grid_points


# -----------------------------
# CONFIG
# -----------------------------
YEAR = 2024
RESOLUTION = 0.25
OUTPUT_FILE = f"climate_0p25deg_{YEAR}.json"
DELAY_SECONDS = 1.2
FAILED_LOG = "failed_grids_2024.log"


def load_existing_data():
    if os.path.exists(OUTPUT_FILE):
        with open(OUTPUT_FILE, "r") as f:
            return json.load(f)
    return {
        "year": YEAR,
        "resolution_deg": RESOLUTION,
        "source": "NASA POWER",
        "grids": []
    }


def save_data(data):
    with open(OUTPUT_FILE, "w") as f:
        json.dump(data, f, indent=2)


def run_bulk():
    grids = generate_grid_points(resolution=RESOLUTION)
    total = len(grids)

    data = load_existing_data()
    completed = {g["grid_id"] for g in data["grids"]}

    print(f"🌍 Total grid cells: {total}")
    print(f"📦 Already processed: {len(completed)}")
    print(f"📅 Climate year: {YEAR}\n")

    for idx, grid in enumerate(grids, start=1):
        grid_id = grid["grid_id"]

        if grid_id in completed:
            print(f"[{idx}/{total}] ⏭️  Skipping {grid_id}")
            continue

        lat, lon = grid["lat"], grid["lon"]
        print(f"[{idx}/{total}] 🌦️ Fetching {grid_id} ({lat}, {lon})")

        try:
            raw = fetch_yearly_climate(lat, lon, YEAR)
            daily = transform_nasa_to_daily(raw)
            validate_daily_climate(daily)

            data["grids"].append({
                "grid_id": grid_id,
                "latitude": lat,
                "longitude": lon,
                "daily": daily
            })

            save_data(data)

        except Exception as e:
            print(f"❌ Failed {grid_id}: {e}")
            with open(FAILED_LOG, "a") as f:
                f.write(f"{grid_id},{lat},{lon},{str(e)}\n")

        time.sleep(DELAY_SECONDS)

    print("\n🎉 Bulk climate ingestion completed")


if __name__ == "__main__":
    run_bulk()
