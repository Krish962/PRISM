#!/usr/bin/env python3
"""
scripts/seed_nasa_power.py
---------------------------------------------------------------
Extracts NASA POWER daily agroclimatology data (SRAD, TMAX, TMIN, RAIN)
and seeds it directly into MongoDB for offline PRISM DSSAT simulations.

Usage:
  python scripts/seed_nasa_power.py --min-lat 20.0 --max-lat 25.0 --min-lon 80.0 --max-lon 88.0 --start-year 2020 --end-year 2024
  python scripts/seed_nasa_power.py --point 22.314,87.311 --start-year 2015 --end-year 2024
"""

import os
import sys
import time
import argparse
from datetime import datetime
import requests
from dotenv import load_dotenv

# Try importing pymongo; prompt user if missing
try:
    from pymongo import MongoClient, UpdateOne
except ImportError:
    print("[ERROR] pymongo is not installed. Please run: pip install pymongo")
    sys.exit(1)

# Load environment variables
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(backend_dir, ".env"))

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/prism")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "prism")

NASA_POWER_POINT_API = "https://power.larc.nasa.gov/api/temporal/daily/point"

def fetch_grid_data(lat, lon, start_year, end_year):
    """
    Fetch daily agroclimatology for a specific 0.5 deg grid coordinate.
    """
    start_str = f"{start_year}0101"
    end_str = f"{end_year}1231"
    params = {
        "parameters": "ALLSKY_SFC_SW_DWN,T2M_MAX,T2M_MIN,PRECTOTCORR",
        "community": "AG",
        "longitude": round(lon, 2),
        "latitude": round(lat, 2),
        "start": start_str,
        "end": end_str,
        "format": "JSON"
    }
    
    headers = { "User-Agent": "PRISM-AgroClimate-Seeder/1.0" }
    
    for attempt in range(3):
        try:
            resp = requests.get(NASA_POWER_POINT_API, params=params, headers=headers, timeout=60)
            if resp.status_code == 200:
                data = resp.json()
                return data.get("properties", {}).get("parameter", {})
            elif resp.status_code == 429:
                wait_time = (attempt + 1) * 5
                print(f"  [Rate limit] Backing off {wait_time}s...")
                time.sleep(wait_time)
            else:
                print(f"  [Warning] HTTP {resp.status_code} for lat={lat}, lon={lon}: {resp.text[:120]}")
                return None
        except Exception as e:
            print(f"  [Retry {attempt+1}] Connection error: {e}")
            time.sleep(2)
            
    return None

def process_and_seed_grid(collection, lat, lon, start_year, end_year):
    """
    Fetch and structure daily data for a coordinate into MongoDB documents.
    1 document per year per grid.
    """
    grid_id = f"NP_{lat:.2f}_{lon:.2f}"
    print(f"Processing Grid {grid_id} (Lat: {lat:.2f}, Lon: {lon:.2f}) for {start_year}..{end_year}...")
    
    params_data = fetch_grid_data(lat, lon, start_year, end_year)
    if not params_data:
        print(f"  [Failed] Could not retrieve data for {grid_id}")
        return 0

    srad_map = params_data.get("ALLSKY_SFC_SW_DWN", {})
    tmax_map = params_data.get("T2M_MAX", {})
    tmin_map = params_data.get("T2M_MIN", {})
    rain_map = params_data.get("PRECTOTCORR", {})

    # Group daily readings by year
    years_data = {}
    for date_str, srad in srad_map.items():
        try:
            dt = datetime.strptime(date_str, "%Y%m%d")
        except ValueError:
            continue
            
        yr = dt.year
        doy = int(dt.strftime("%j"))
        
        tmax = tmax_map.get(date_str, -999)
        tmin = tmin_map.get(date_str, -999)
        rain = rain_map.get(date_str, -999)
        
        # Clean missing values (-900 to -999 in NASA POWER)
        clean_srad = None if srad <= -900 else float(srad)
        clean_tmax = None if tmax <= -900 else float(tmax)
        clean_tmin = None if tmin <= -900 else float(tmin)
        clean_rain = None if rain <= -900 else float(rain)

        if yr not in years_data:
            years_data[yr] = []
            
        years_data[yr].append({
            "doy": doy,
            "srad": clean_srad if clean_srad is not None else 15.0,
            "tmax": clean_tmax if clean_tmax is not None else 30.0,
            "tmin": clean_tmin if clean_tmin is not None else 20.0,
            "rain": clean_rain if clean_rain is not None else 0.0
        })

    # Prepare Mongo upserts
    ops = []
    for yr, daily_records in years_data.items():
        if len(daily_records) < 365:
            continue # Incomplete year
            
        doc = {
            "grid_id": grid_id,
            "latitude": round(lat, 2),
            "longitude": round(lon, 2),
            "location": {
                "type": "Point",
                "coordinates": [round(lon, 2), round(lat, 2)]
            },
            "elevation": 50,
            "resolution_deg": 0.5,
            "year": yr,
            "source": "NASA POWER Bulk",
            "daily": daily_records,
            "created_at": datetime.utcnow()
        }
        
        ops.append(UpdateOne(
            {"grid_id": grid_id, "year": yr},
            {"$set": doc},
            upsert=True
        ))

    if ops:
        res = collection.bulk_write(ops)
        print(f"  [Success] Saved {len(ops)} years for {grid_id} (Upserted: {res.upserted_count}, Modified: {res.modified_count})")
        return len(ops)
    return 0

def main():
    parser = argparse.ArgumentParser(description="Seed NASA POWER Weather into MongoDB")
    parser.add_argument("--min-lat", type=float, default=21.0, help="Min Latitude (default: 21.0)")
    parser.add_argument("--max-lat", type=float, default=24.0, help="Max Latitude (default: 24.0)")
    parser.add_argument("--min-lon", type=float, default=85.0, help="Min Longitude (default: 85.0)")
    parser.add_argument("--max-lon", type=float, default=88.5, help="Max Longitude (default: 88.5)")
    parser.add_argument("--start-year", type=int, default=2015, help="Start Year (default: 2015)")
    parser.add_argument("--end-year", type=int, default=2024, help="End Year (default: 2024)")
    parser.add_argument("--step", type=float, default=0.5, help="Grid step in degrees (default: 0.5)")
    parser.add_argument("--point", type=str, default=None, help="Single point: 'lat,lon' (e.g. '22.314,87.311')")
    args = parser.parse_args()

    print(f"Connecting to MongoDB: {MONGO_URI}")
    client = MongoClient(MONGO_URI)
    db = client[MONGO_DB_NAME]
    collection = db["climates"]

    # Ensure indexes
    collection.create_index([("grid_id", 1), ("year", 1)], unique=True)
    collection.create_index([("location", "2dsphere")])
    collection.create_index([("latitude", 1), ("longitude", 1)])

    if args.point:
        parts = args.point.split(",")
        lat, lon = float(parts[0].strip()), float(parts[1].strip())
        # Snap to nearest 0.5 grid
        lat_grid = round(lat * 2) / 2
        lon_grid = round(lon * 2) / 2
        print(f"Seeding single grid near ({lat}, {lon}) -> snapped ({lat_grid}, {lon_grid})")
        process_and_seed_grid(collection, lat_grid, lon_grid, args.start_year, args.end_year)
    else:
        # Bounding box grid sweep
        lats = []
        curr_lat = args.min_lat
        while curr_lat <= args.max_lat:
            lats.append(round(curr_lat, 2))
            curr_lat += args.step

        lons = []
        curr_lon = args.min_lon
        while curr_lon <= args.max_lon:
            lons.append(round(curr_lon, 2))
            curr_lon += args.step

        total_grids = len(lats) * len(lons)
        print(f"Starting grid sweep: {len(lats)} lats x {len(lons)} lons = {total_grids} total grid cells.")
        print(f"Year range: {args.start_year} - {args.end_year}")

        count = 0
        for lat in lats:
            for lon in lons:
                count += 1
                print(f"[{count}/{total_grids}] ", end="")
                process_and_seed_grid(collection, lat, lon, args.start_year, args.end_year)
                time.sleep(0.5) # Gentle pause between requests

    print("\n[Done] NASA POWER weather seeding complete!")

if __name__ == "__main__":
    main()
