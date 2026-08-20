#!/usr/bin/env Rscript

# Usage:

# Rscript run_dssat.R input.json output.json

suppressPackageStartupMessages({
library(jsonlite)
library(DSSAT)
})

# -------------------------------------------
# Locate script directory
# -------------------------------------------

args_full <- commandArgs(trailingOnly = FALSE)
script_path <- sub("--file=", "", args_full[grep("--file=", args_full)])
script_dir <- dirname(normalizePath(script_path))

# -------------------------------------------
# Load helper scripts
# -------------------------------------------

source(file.path(script_dir, "weather_generator.R"))
source(file.path(script_dir, "soil_generator.R"))
source(file.path(script_dir, "filex_generator.R"))
# -------------------------------------------
# Read command line arguments
# -------------------------------------------

args <- commandArgs(trailingOnly = TRUE)

if(length(args) == 0){
input_file <- "test_input.json"
output_file <- "output.json"
} else {
input_file <- args[1]
output_file <- args[2]
}

# -------------------------------------------
# Set working directory to simulation folder
# -------------------------------------------

simulation_dir <- dirname(normalizePath(input_file))
setwd(simulation_dir)

# -------------------------------------------
# Load input JSON
# -------------------------------------------


input <- fromJSON(input_file)

lat <- input$latitude
lon <- input$longitude

cat("DEBUG lat:", lat, "lon:", lon, "\n")
# -------------------------------------------
# .WTH file creation
# -------------------------------------------

plant_date  <- as.Date(input$management$planting$date)
harvest_date <- as.Date(input$management$harvestDate)

start_year <- as.integer(format(plant_date, "%Y"))
end_year   <- as.integer(format(harvest_date, "%Y"))

weather_config <- generate_weather_config(
lat,
lon,
start_year,
end_year
)

write_weather_file(weather_config)

cat("Weather pipeline finished\n")

# -------------------------------------------
# .SOL file creation
# -------------------------------------------

soil_config <- generate_soil_config(
  input
)

write_soil_file(soil_config)

cat("Soil pipeline finished\n")

# -------------------------------------------
# .X file creation
# -------------------------------------------

input <- jsonlite::fromJSON(input_file)
management <- input$management

template_path <- normalizePath(file.path(script_dir, "..", "templates", "template.RIX"))

filex <- generate_filex(
template_path,
lat,
lon,
management
)

write_filex_file(filex)


cat("FileX pipeline finished\n")

# -------------------------------------------
# Batch creation and simulation run
# -------------------------------------------

dssat_root <- Sys.getenv(
  "DSSAT_ROOT",
  unset = normalizePath(file.path(script_dir, "..", "DSSAT48"))
)
dssat_executable <- Sys.getenv(
  "DSSAT_EXECUTABLE",
  unset = file.path(dssat_root, "DSCSM048.EXE")
)

options(DSSAT.CSM = normalizePath(dssat_executable))

write_dssbatch(
x = "PRISM.X",
trtno = 1,
rp = 1,
sq = 0,
op = 0,
co = 0
)

cat("Batch file written: DSSBatch.v48\n")

run_dssat(run_mode = "B")

# -------------------------------------------
# Extract and Format Results
# -------------------------------------------
pg <- read_output("PlantGro.OUT")

final <- tail(pg, 1)

ghg <- read_output("GHG.OUT")
tceqc_parsed <- tail(ghg$TCEQC, 1)

SoilWat <- read_output("SoilWat.OUT")
total_precipitation <- tail(SoilWat$PREC, 1)
total_drainage <- tail(SoilWat$DRNC, 1)

etDat <- read_output("ET.OUT")
total_ET <- tail(etDat$ETAC, 1)

results <- list(
  yield_kg_ha = final$GWAD,
  biomass_kg_ha = final$CWAD,
  harvest_index = final$HIAD,
  max_lai = max(pg$LAID, na.rm = TRUE),
  growth_duration = max(pg$DAS, na.rm = TRUE),
  lai_series = data.frame(day = pg$DAS, lai = pg$LAID),
  biomass_series = data.frame(day = pg$DAS, biomass = pg$CWAD),
  tceqc = tceqc_parsed,
  total_drainage = total_drainage,
  total_precipitation = total_precipitation,
  total_ET = total_ET
)

#print(results)




# -------------------------------------------
# Write results to JSON for backend
# -------------------------------------------

write_json(results, output_file, auto_unbox = TRUE, pretty = TRUE)

cat("Simulation completed. Results written to:", output_file, "\n")
