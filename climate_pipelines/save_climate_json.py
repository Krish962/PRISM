import json
import os


def save_climate_json(record, year, output_dir="output"):
    """
    Save one grid's yearly climate data as JSON
    """
    os.makedirs(output_dir, exist_ok=True)

    filename = f"climate_{record['grid_id']}_{year}.json"
    path = os.path.join(output_dir, filename)

    with open(path, "w") as f:
        json.dump(record, f, indent=2)

    return path
