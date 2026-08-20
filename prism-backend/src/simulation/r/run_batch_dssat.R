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

start_year <- 2026
end_year   <- 2026

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

file.copy(
  "C:/Users/asus/PRISM/prism-backend/src/simulation/templates/template-batch.SOL",
  "PR.SOL",
  overwrite = TRUE
)

cat("Soil pipeline finished\n")

# -------------------------------------------
# .X file creation
# -------------------------------------------

input <- jsonlite::fromJSON(input_file)
management <- input$management

template_path <- "C:/Users/asus/PRISM/prism-backend/src/simulation/templates/template-batch.RIX"

filex <- generate_filex(
template_path,
lat,
lon,
management,
batch_mode = TRUE
)

write_filex_file(filex)


cat("FileX pipeline finished\n")

# -------------------------------------------
# Batch creation and simulation run
# -------------------------------------------

trtno <- input$trtno
if (is.null(trtno) || length(trtno) == 0) {
  trtno <- 1
}

batch_trt <- seq_len(trtno)

write_dssbatch(
    x = "PRISM.X",
    trtno = batch_trt,
    rp = 1,
    sq = 0,
    op = 0,
    co = 0
)

cat(readLines("DSSBatch.v48"), sep = "\n")

cat("Batch file written: DSSBatch.v48\n")

options(DSSAT.CSM = "C:/DSSAT48/DSCSM048.EXE")

result <- run_dssat(run_mode = "B")

print(result)

# -------------------------------------------
# Extract and Format Results
# -------------------------------------------
pg <- read_output("PlantGro.OUT")

print(names(pg))

# Get all unique runs
runs <- unique(pg$RUN)

results <- lapply(runs, function(run_no) {
  
  # Data for this particular run
  run_data <- pg[pg$RUN == run_no, ]
  
  # Final row of this run
  final <- tail(run_data, 1)
  
  list(
    run = run_no,
    treatment = unique(run_data$TRNO),
    
    # Final values
    yield_kg_ha = final$GWAD,
    biomass_kg_ha = final$CWAD,
    harvest_index = final$HIAD,
    
    # Overall crop development
    max_lai = max(run_data$LAID, na.rm = TRUE),
    growth_duration = max(run_data$DAS, na.rm = TRUE),
    
    # Time-series data
    lai_series = data.frame(
      day = run_data$DAS,
      lai = run_data$LAID
    ),
    
    biomass_series = data.frame(
      day = run_data$DAS,
      biomass = run_data$CWAD
    )
  )
})

#print(results)




# -------------------------------------------
# Write results to JSON for backend
# -------------------------------------------

write_json(results, output_file, auto_unbox = TRUE, pretty = TRUE)

cat("Simulation completed. Results written to:", output_file, "\n")
