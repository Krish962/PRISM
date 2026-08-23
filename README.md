# PRISM

PRISM is a web-based decision support system for rice crop simulation and sustainability analysis. It combines a React frontend, a Node.js/Express API, and R-based DSSAT integration to help users assess crop performance under different management, soil, and climate scenarios.

The system supports:

- Single-run crop simulations
- Batch simulations for multiple scenarios
- Soil lookup by latitude/longitude
- Yield, biomass, canopy, and growth-duration analysis
- Energy, CO₂, and water-footprint calculations
- Result visualization in the frontend

---

## Project overview

PRISM follows a three-layer architecture:

1. Frontend: React + Vite user interface
2. Backend: Express API for request handling and orchestration
3. Simulation layer: R scripts that generate DSSAT inputs and execute the crop model

The general flow is:

Frontend -> Backend API -> Build simulation input -> R script -> DSSAT model -> Parse output -> JSON response -> Frontend charts and analysis

---

## Key features

### Crop simulation
- Single simulation workflow with site and management parameters
- Batch simulation workflow for multi-scenario analyses
- Integration with DSSAT CERES-Rice model via R scripts
- Soil profile selection based on nearest matching soil data

### Data and analysis
- Input building from user form data
- Simulation output parsing into structured JSON
- Time series for LAI and biomass
- Key metrics such as yield, biomass, harvest index, maximum LAI, and growth duration

### Sustainability modules
- Energy analysis based on human labor, animal labor, fuel, fertilizer, seed, and machinery
- CO₂ footprint estimation from field emissions, energy use, and fertilizer-related inputs
- Water footprint estimation using green, blue, and grey water components

### User experience
- Route-based pages for simulation, batch simulation, and result review
- Recharts-based visual output for crop growth curves
- Dedicated pages for energy, CO₂, and water footprint analysis

---

## Tech stack

### Frontend
- React 19
- Vite
- React Router
- Recharts
- Axios

### Backend
- Node.js
- Express 5
- MongoDB via Mongoose (optional / graceful fallback)
- dotenv
- CORS

### Simulation engine
- Rscript
- DSSAT model assets included in the project under the backend simulation directory
- Output parsing through Node + R workflow

---

## Repository structure

```text
PRISM/
├── README.md
├── prism-backend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── app.js
│       ├── server.js
│       ├── config/
│       │   ├── db.config.js
│       │   └── env.config.js
│       ├── controllers/
│       │   ├── batchSimulation.controller.js
│       │   ├── energy.controller.js
│       │   └── simulation.controller.js
│       ├── data-access/
│       │   ├── climate.repository.js
│       │   ├── job.repository.js
│       │   ├── soil.repository.js
│       │   └── variety.repository.js
│       ├── models/
│       │   ├── climate.model.js
│       │   ├── soil.model.js
│       │   └── variety.model.js
│       ├── routes/
│       │   ├── batch.routes.js
│       │   ├── energy.routes.js
│       │   └── simulation.routes.js
│       ├── services/
│       │   ├── batchSimulation.service.js
│       │   ├── buildInput.service.js
│       │   └── simulation.service.js
│       ├── simulation/
│       │   ├── DSSAT48/
│       │   ├── dssat-csm-os/
│       │   ├── r/
│       │   └── templates/
│       ├── utils/
│       │   └── tempDir.js
│       └── workers/
├── prism-frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── public/
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── index.css
│       ├── components/
│       ├── pages/
│       ├── services/
│       └── utils/
└──
```

---

## Runtime architecture

### Frontend routes
The frontend uses React Router to expose the following views:

- `/` - home page
- `/simulation` - single simulation form
- `/batch` - batch simulation form
- `/batch-results` - batch results page
- `/results` - simulation result visualization
- `/energy` - energy calculation page
- `/co2` - CO₂ footprint estimator
- `/h2o` - water footprint estimator

### Backend routes
The API is mounted under `/api` and includes:

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/simulation/run` | POST | Run a single DSSAT crop simulation |
| `/api/batch/run` | POST | Run a batch set of simulations |
| `/api/energy/calculate` | POST | Compute farm energy input/output balance |
| `/health` | GET | Health check for backend service |

---

## Environment configuration

### Backend
Create a `.env` file inside `prism-backend` with values such as:

```env
PORT=5000
FRONTEND_URL=http://localhost:5173
MONGO_URI=mongodb://localhost:27017/prism
MONGO_DB_NAME=prism
NODE_ENV=development
```

Notes:
- `FRONTEND_URL` is required for CORS.
- If MongoDB is not available, the server still starts and logs a warning, as implemented in the app startup flow.

### Frontend
Create a `.env` file inside `prism-frontend` with:

```env
VITE_API_URL=http://localhost:5000
```

If `VITE_API_URL` is not set in production, the app throws an error during build.

---

## Local setup

### 1) Install backend dependencies

```bash
cd prism-backend
npm install
```

### 2) Install frontend dependencies

```bash
cd prism-frontend
npm install
```

### 3) Start the backend

```bash
cd prism-backend
npm run dev
```

This starts the Express API on the configured backend port.

### 4) Start the frontend

```bash
cd prism-frontend
npm run dev
```

The frontend should be available through the Vite development server, usually on:

```text
http://localhost:5173
```

---

## Simulation flow

1. The user enters location, crop, management, and simulation inputs in the frontend.
2. The frontend builds a structured payload and sends it to the backend.
3. The backend resolves the nearest soil profile for the provided geographic coordinates.
4. The backend prepares the simulation input object and invokes the R-based execution process.
5. The R job runs the DSSAT model using the project templates and model files.
6. The output is parsed into structured metrics like yield, biomass, harvest index, and growth series.
7. The result is returned to the frontend for charting and analysis.

---

## Output example

The backend returns structured JSON similar to:

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
```

---

## Development notes

- The simulation backend uses temporary directories under the OS temp folder for each run.
- The project is designed around reproducible crop modeling rather than a database-first architecture.
- The R and DSSAT assets are included in the repository, enabling local execution with proper R installation.
- MongoDB is present for optional persistence but is not required to run the app in a basic local setup.

---

## Production build

### Frontend

```bash
cd prism-frontend
npm run build
```

### Backend

```bash
cd prism-backend
npm start
```

---

## Notes

PRISM is intended to support agricultural planning and research by helping users investigate how soil, climate, and management decisions affect rice productivity and sustainability metrics. The platform is especially useful for exploring yield performance alongside environmental impact indicators.

---

## License

This project currently declares the backend license as ISC in the package metadata. Review the package configuration and project-specific legal requirements before publishing or deploying the solution externally.
