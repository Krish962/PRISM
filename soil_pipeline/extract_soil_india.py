import rasterio
import numpy as np
import json
from tqdm import tqdm
from pyproj import Transformer

variables = ["bdod","clay","sand","silt","soc","phh2o"]
depths = ["0-5cm","5-15cm","15-30cm","30-60cm","60-100cm","100-200cm"]

rasters = {}

# open rasters
for v in variables:
    for d in depths:
        path = f"india_{v}_{d}_mean_1000.tif"
        rasters[(v,d)] = rasterio.open(path)

# coordinate transformer (lat/lon -> raster CRS)
sample_raster = list(rasters.values())[0]
transformer = Transformer.from_crs("EPSG:4326", sample_raster.crs, always_xy=True)

lat_vals = np.arange(6,37,0.25)
lon_vals = np.arange(68,97,0.25)

grid = [(lat,lon) for lat in lat_vals for lon in lon_vals]

results = []

for lat,lon in tqdm(grid):

    # convert coordinates to raster projection
    x,y = transformer.transform(lon,lat)

    profile = {
        "soil_id": f"SOIL_{lat:.3f}_{lon:.3f}",
        "latitude": float(lat),
        "longitude": float(lon),
        "source": "SoilGrids_1km",
        "layers":[]
    }

    valid_profile = True

    for d in depths:

        layer = {"depth_cm":d}

        for v in variables:

            value = list(rasters[(v,d)].sample([(x,y)]))[0][0]

            # skip ocean pixels
            if value == -32768:
                valid_profile = False
                break

            value = float(value)

            # convert SoilGrids units
            if v == "bdod":
                value = value/100
            else:
                value = value/10

            layer[v] = value

        if not valid_profile:
            break

        profile["layers"].append(layer)

    if valid_profile:
        results.append(profile)

with open("soil_india.json","w") as f:
    json.dump(results,f,indent=2)

print("Done")
print("Profiles:",len(results))