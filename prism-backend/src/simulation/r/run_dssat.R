#!/usr/bin/env Rscript

suppressPackageStartupMessages({
  library(jsonlite)
  library(dplyr)
  library(lubridate)
  library(DSSAT)
})

args <- commandArgs(trailingOnly = TRUE)

if (length(args) < 2) {
  stop("Usage: Rscript run_dssat.R input.json output.json")
}

input_file  <- args[1]
output_file <- args[2]

# ------------------------------------------------
# DSSAT executable path
# ------------------------------------------------
dssat_path <- "C:/DSSAT48"
options(DSSAT.CSM = file.path(dssat_path, "DSCSM048.exe"))

# ------------------------------------------------
# Directories
# ------------------------------------------------
template_dir <- "C:/Users/asus/PRISM/prism-backend/simulation_templates/rice_base"
work_root    <- "C:/PRISM_DEBUG"

# ------------------------------------------------
# Read input JSON
# ------------------------------------------------
input <- fromJSON(input_file)

climate    <- input$climate
soil       <- input$soil
genotype   <- input$genotype
management <- input$management
location   <- input$location

# ------------------------------------------------
# Create simulation working directory
# ------------------------------------------------
timestamp <- format(Sys.time(), "%Y%m%d_%H%M%S")
workdir <- file.path(work_root, paste0("sim_", timestamp))

dir.create(workdir, recursive = TRUE, showWarnings = FALSE)
setwd(workdir)

cat("Simulation directory:", workdir, "\n")

# ------------------------------------------------
# Copy template experiment files
# ------------------------------------------------
if (!dir.exists(template_dir)) {
  stop("Template directory not found")
}

template_files <- list.files(template_dir, full.names = TRUE)

copy_status <- file.copy(
  from = template_files,
  to   = workdir,
  overwrite = TRUE
)

print(copy_status)
cat("Template files copied\n")

# ------------------------------------------------
# WEATHER FILE
# ------------------------------------------------
if (is.null(climate$daily) || length(climate$daily$doy) == 0) {
  stop("Missing climate.daily data")
}

daily <- climate$daily

weather_df <- data.frame(
  DATE = as.integer(
    paste0(
      "86",
      sprintf("%03d", daily$doy)
    )
  ),
  SRAD = daily$srad,
  TMAX = daily$tmax,
  TMIN = daily$tmin,
  RAIN = daily$rain
)

tav <- mean((weather_df$TMAX + weather_df$TMIN)/2, na.rm = TRUE)
amp <- sd((weather_df$TMAX + weather_df$TMIN)/2, na.rm = TRUE)

write_wth(
  weather_df,
  file_name = "PRSM.WTH",
  INSI = "PRSM",
  LAT  = ifelse(is.null(location$latitude),0,location$latitude),
  LONG = ifelse(is.null(location$longitude),0,location$longitude),
  ELEV = ifelse(is.null(location$elevation),50,location$elevation),
  TAV  = tav,
  AMP  = amp
)

cat("Weather file created\n")

# ------------------------------------------------
# Read experiment template
# ------------------------------------------------
filex <- read_filex("IRMZ8601.RIX")

# ------------------------------------------------
# Apply genotype parameters
# ------------------------------------------------
cul_file <- "RICER048.CUL"

if(file.exists(cul_file) && !is.null(genotype)){

  cul <- read_cul(cul_file)

  cultivar_code <- filex$CULTIVARS$INGENO[1]

  idx <- which(cul$`VAR#` == cultivar_code)

  if(length(idx) > 0){

    if(!is.null(genotype$P1))  cul[idx,"P1"]  <- genotype$P1
    if(!is.null(genotype$P2R)) cul[idx,"P2R"] <- genotype$P2R
    if(!is.null(genotype$P5))  cul[idx,"P5"]  <- genotype$P5
    if(!is.null(genotype$G1))  cul[idx,"G1"]  <- genotype$G1
    if(!is.null(genotype$G2))  cul[idx,"G2"]  <- genotype$G2
    if(!is.null(genotype$G3))  cul[idx,"G3"]  <- genotype$G3

    write_cul(cul, cul_file)

    cat("Genotype parameters applied\n")
  }
}

# ------------------------------------------------
# Link weather station and soil
# ------------------------------------------------
filex$FIELDS$WSTA[1] <- "PRSM"

soil_id <- ifelse(is.null(soil$id),"AZMC920001",soil$id)

filex$FIELDS$ID_SOIL[1] <- soil_id

# ------------------------------------------------
# Convert planting date
# ------------------------------------------------
to_yyddd <- function(date_str){

  d <- as.Date(date_str)
  doy <- format(d,"%j")

  as.numeric(paste0("86", doy))

}

pdate <- NULL

if(!is.null(management$planting_date)){
  pdate <- to_yyddd(management$planting_date)
  cat("Planting date:", pdate, "\n")
}

if(!is.null(management$plant_density)){
  filex$`PLANTING DETAILS`[1,"PPOP"] <- management$plant_density
}

# ------------------------------------------------
# Write experiment file
# ------------------------------------------------
write_filex(filex,"PRISM.X")

# ------------------------------------------------
# Force correct planting date directly in file
# (avoids DSSAT R package date parsing issues)
# ------------------------------------------------
if(!is.null(pdate)){

  lines <- readLines("PRISM.X")

  lines <- gsub(
    "^\\s*1\\s+70001",
    paste0(" 1 ", pdate),
    lines
  )

  writeLines(lines,"PRISM.X")
}

cat("Experiment file prepared\n")

# ------------------------------------------------
# Create DSSAT batch file
# ------------------------------------------------
write_dssbatch(
  x = "PRISM.X",
  trtno = 1,
  rp = 1,
  sq = 0,
  file_name = "DSSBATCH.V48"
)

cat("Batch file created\n")

cat("Files in simulation folder:\n")
print(list.files())

# ------------------------------------------------
# Run DSSAT simulation
# ------------------------------------------------
cat("Running DSSAT model...\n")

run_dssat(
  run_mode = "B",
  file_name = "DSSBATCH.V48"
)

# ------------------------------------------------
# Read OVERVIEW.OUT (cleaner than Evaluate.OUT)
# ------------------------------------------------

if(!file.exists("OVERVIEW.OUT")){
  stop("OVERVIEW.OUT not produced by DSSAT")
}

# read binary to avoid DSSAT null characters
con <- file("OVERVIEW.OUT", "rb")
raw_file <- readBin(con, "raw", n = file.info("OVERVIEW.OUT")$size)
close(con)

# remove null bytes
raw_file <- raw_file[raw_file != as.raw(0)]

txt <- rawToChar(raw_file)

lines <- strsplit(txt, "\n")[[1]]

# find the row that begins with the run number
data_line <- lines[grep("^\\s*1\\s", lines)]

if(length(data_line) == 0){
  stop("Could not locate simulation row in OVERVIEW.OUT")
}

vals <- strsplit(trimws(data_line[1]), "\\s+")[[1]]

# column order
# RUN CR TRT FLO MAT TOPWT HARWT ...

biomass <- as.numeric(vals[6])
yield   <- as.numeric(vals[7])

result <- list(
  yield = yield,
  biomass = biomass
)

write(
  toJSON(result, auto_unbox = TRUE, pretty = TRUE),
  output_file
)

cat("Simulation successful\n")