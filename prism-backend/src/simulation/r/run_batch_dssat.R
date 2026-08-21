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

source(file.path(script_dir, "soil_generator.R"))
source(file.path(script_dir, "filex_generator.R"))
source(file.path(script_dir, "weather_generator.R"))
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

# -------------------------------------------
# .WTH file editing
# -------------------------------------------

weather_template_path <- normalizePath(
  file.path(script_dir, "..", "templates", "template.WTH")
)

weather_template <- read_wth(weather_template_path)
weather_general <- attr(weather_template, "GENERAL")

weather_config <- list(
  header = list(
    INSI = "PRSM",
    LAT = as.numeric(lat),
    LONG = as.numeric(lon),
    ELEV = weather_general$ELEV[1],
    TAV = weather_general$TAV[1],
    AMP = weather_general$AMP[1]
  ),
  data = weather_template
)

write_weather_file(
  weather_config,
  template_path = weather_template_path
)

cat("Weather template edited\n")

# -------------------------------------------
# .SOL file creation
# -------------------------------------------

file.copy(
  normalizePath(file.path(script_dir, "..", "templates", "template-batch.SOL")),
  "PR.SOL",
  overwrite = TRUE
)

cat("Soil pipeline finished\n")

# -------------------------------------------
# .X file creation
# -------------------------------------------

input <- jsonlite::fromJSON(input_file)
management <- input$management

template_path <- normalizePath(file.path(script_dir, "..", "templates", "template-batch.RIX"))

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

dssat_root <- Sys.getenv("DSSAT_ROOT", unset = "")
if (!nzchar(dssat_root)) {
  dssat_root <- if (dir.exists("/opt/dssat")) {
    "/opt/dssat"
  } else {
    normalizePath(file.path(script_dir, "..", "DSSAT48"))
  }
}

dssat_executable <- Sys.getenv("DSSAT_EXECUTABLE", unset = "")
if (!nzchar(dssat_executable)) {
  dssat_executable <- if (file.exists(file.path(dssat_root, "dscsm048"))) {
    file.path(dssat_root, "dscsm048")
  } else {
    file.path(dssat_root, "DSCSM048.EXE")
  }
}

if (!file.exists(dssat_executable)) {
  stop("DSSAT executable not found: ", dssat_executable)
}

options(DSSAT.CSM = normalizePath(dssat_executable, mustWork = TRUE))

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
  co = 0,
  file_name = "DSSBatch.V48"
)

cat(readLines("DSSBatch.V48"), sep = "\n")

cat("Batch file written: DSSBatch.V48\n")

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
