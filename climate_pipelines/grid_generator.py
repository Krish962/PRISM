# ======================================================
# INDIA GRID GENERATOR (0.25° RESOLUTION)
# Used by: soil, climate, future pipelines
# ======================================================

INDIA_BOUNDS = {
    "lat_min": 6.0,
    "lat_max": 37.0,
    "lon_min": 68.0,
    "lon_max": 97.0
}


def generate_grid_points(resolution=0.25):
    """
    Generate centroid points for a regular lat-lon grid
    over India at given resolution (default 0.25°).

    Returns a list of dicts:
    {
        "grid_id": "GRID_025_00001",
        "lat": 23.875,
        "lon": 85.375
    }
    """

    points = []
    index = 1

    lat = INDIA_BOUNDS["lat_min"] + resolution / 2
    while lat < INDIA_BOUNDS["lat_max"]:
        lon = INDIA_BOUNDS["lon_min"] + resolution / 2
        while lon < INDIA_BOUNDS["lon_max"]:

            grid_id = f"GRID_{int(resolution * 1000):03d}_{index:05d}"

            points.append({
                "grid_id": grid_id,
                "lat": round(lat, 3),
                "lon": round(lon, 3)
            })

            index += 1
            lon += resolution

        lat += resolution

    return points


# ------------------------------------------------------
# Standalone test
# ------------------------------------------------------
if __name__ == "__main__":
    grids = generate_grid_points(0.25)
    print("Total grid points:", len(grids))
    print("Sample:", grids[0], grids[-1])
