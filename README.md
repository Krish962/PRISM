## PRISM – Paddy Rice Integrated Simulation Model

PRISM is a web-based decision support system for simulating paddy rice growth using the DSSAT CERES-Rice model. It combines a React-based frontend with a Node.js + R backend to provide an end-to-end simulation and analysis pipeline.

---

## System Overview
Frontend (React)
↓
Backend API (Node.js / Express)
↓
R Integration (DSSAT Execution)
↓
Output Parsing → JSON → Frontend Visualization


---

## Frontend (React + Vite)

The frontend provides an intuitive interface for configuring simulations and visualizing results.

### Features

- **Simulation Form**
  - Location input (manual + geolocation)
  - Crop selection (cultivar dropdown)
  - Planting parameters (date, method, spacing, depth)
  - Dynamic irrigation & fertilizer scheduling
  - Harvest date input

- **Validation**
  - Ensures required inputs are present
  - Supports optional management practices

- **API Integration**
  - Sends structured payload to backend
  - Handles asynchronous simulation execution

- **Results Visualization**
  - Yield, Biomass, Harvest Index
  - Max LAI and Growth Duration
  - Charts (Recharts):
    - LAI growth curve
    - Biomass accumulation curve

---

## Backend (Node.js + Express + R)

The backend manages simulation execution, DSSAT integration, and output processing.

### Features

- **REST API**
  - Endpoint: `/api/simulation/run`
  - Accepts structured simulation input

- **Simulation Engine**
  - Node.js spawns R script (`run_dssat.R`)
  - R prepares DSSAT input files and runs CERES-Rice model

- **Temporary File Management**
  - Each simulation runs in an isolated temp directory
  - Stores DSSAT files (`.OUT`, `.WTH`, `.SOL`, etc.)

- **Output Parsing**
  - Reads `PlantGro.OUT`
  - Extracts:
    - Yield (GWAD)
    - Biomass (CWAD)
    - Harvest Index (HIAD)
    - Max LAI (LAID)
    - Growth duration (DAS)

- **Time-Series Extraction**
  - LAI over time
  - Biomass over time

- **Response Format**
```json
{
  "yield_kg_ha": 3019,
  "biomass_kg_ha": 4914,
  "harvest_index": 0.614,
  "max_lai": 1.08,
  "growth_duration": 109,

  "lai_series": [
    { "day": 11, "lai": 0.09 },
    { "day": 12, "lai": 0.08 }
  ],

  "biomass_series": [
    { "day": 11, "biomass": 138 },
    { "day": 12, "biomass": 138 }
  ]
}

## Data Flow

1. User inputs simulation parameters via frontend
2. Frontend validates and builds payload
3. Backend receives request and starts simulation
4. R script runs DSSAT model
5. Output files are generated (PlantGro.OUT)
6. Backend parses results into JSON
7. Frontend visualizes results