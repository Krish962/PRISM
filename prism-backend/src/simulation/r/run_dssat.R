library(jsonlite)
suppressPackageStartupMessages(library(DSSAT))

args <- commandArgs(trailingOnly = TRUE)

input_file  <- args[1]
output_file <- args[2]

# -----------------------------
# DSSAT path
# -----------------------------
dssat_path <- "C:/DSSAT48"
options(DSSAT.CSM = file.path(dssat_path, "DSCSM048.exe"))

# -----------------------------
# Read input JSON
# -----------------------------
input <- fromJSON(input_file)

climate    <- input$climate
soil       <- input$soil
genotype   <- input$genotype
management <- input$management
location   <- input$location

# -----------------------------
# Create working directory
# -----------------------------
timestamp <- format(Sys.time(), "%Y%m%d_%H%M%S")
workdir <- file.path("C:/PRISM_DEBUG", paste0("prism_", timestamp))

dir.create(workdir, recursive = TRUE)
setwd(workdir)

cat("Working directory:", workdir, "\n")



# -----------------------------
# Copy template experiment
# -----------------------------
# ------------------------------------------------
# COPY TEMPLATE EXPERIMENT
# ------------------------------------------------

template_dir <- "C:/Users/asus/PRISM/prism-backend/simulation_templates/rice_base"

# List template files
template_files <- list.files(template_dir, full.names = TRUE)

cat("Template files found:\n")
print(template_files)

if (length(template_files) == 0) {
  stop("No template files found in simulation_templates/rice_base")
}

# Copy templates into the working directory
copy_status <- file.copy(
  from = template_files,
  to   = workdir,
  overwrite = TRUE
)

cat("Copy status:\n")
print(copy_status)

if (!all(copy_status)) {
  stop("Failed to copy one or more template files")
}

# ------------------------------------------------
# CREATE CLEAN DSSBATCH.V48
# ------------------------------------------------


batch_path <- file.path(workdir, "DSSBATCH.V48")

batch_lines <- c(
"$BATCH(RI)",
"! FILEX TRTNO RP SQ OP CO",
"PRISM 1 1 1 1 1"
)

writeLines(batch_lines, "DSSBATCH.V48")
con <- file(batch_path, open = "wb")   # binary mode avoids BOM
writeLines(batch_lines, con, sep = "\n", useBytes = TRUE)
close(con)

cat("Batch file written:\n")
print(readLines(batch_path))

# -----------------------------
# WEATHER FILE
# -----------------------------
daily <- climate$daily

weather_df <- data.frame(
  DATE = paste0(
    climate$year,
    sprintf("%03d", daily$doy)
  ),
  SRAD = daily$srad,
  TMAX = daily$tmax,
  TMIN = daily$tmin,
  RAIN = daily$rain
)

write_wth(
  weather_df,
  file_name = "PRSM8601.WTH",
  INSI = "PRSM",
  LAT = location$latitude,
  LONG = location$longitude,
  ELEV = 50,
  TAV = mean((weather_df$TMAX + weather_df$TMIN)/2),
  AMP = sd((weather_df$TMAX + weather_df$TMIN)/2)
)

# -----------------------------
# MODIFY CULTIVAR PARAMETERS
# -----------------------------
cul_file <- "RICER048.CUL"
cul <- read_cul(cul_file)

# Read experiment file to know which cultivar is used
filex <- read_filex("IRMZ8601.RIX")
cultivar_table <- filex[["CULTIVARS"]]

cultivar_code <- cultivar_table$INGENO[1]
cat("Experiment cultivar:", cultivar_code, "\n")

row_idx <- which(cul$`VAR#` == cultivar_code)

if(length(row_idx) == 0){
  stop("Cultivar not found in cultivar file")
}

# Inject parameters
cul[row_idx,"P1"]  <- genotype$P1
cul[row_idx,"P2R"] <- genotype$P2R
cul[row_idx,"P5"]  <- genotype$P5
cul[row_idx,"G1"]  <- genotype$G1
cul[row_idx,"G2"]  <- genotype$G2
cul[row_idx,"G3"]  <- genotype$G3

write_cul(cul, file_name = cul_file)

cat("Genotype parameters injected successfully\n")

# -----------------------------
# MODIFY EXPERIMENT FILE
# -----------------------------
filex <- read_filex("IRMZ8601.RIX")

# Weather station
filex$FIELDS$WSTA[1] <- "PRSM"

# Soil profile
filex$FIELDS$ID_SOIL[1] <- "PRSM0001"

# Convert date to DSSAT format
to_dssat_date <- function(date_str){
  d <- as.Date(date_str)
  year <- format(d,"%y")
  doy  <- format(d,"%j")
  as.integer(paste0(year,doy))
}

if(!is.null(management$planting_date)){
  filex$`PLANTING DETAILS`$PDATE[1] <- to_dssat_date(management$planting_date)
}

if(!is.null(management$plant_density)){
  filex$`PLANTING DETAILS`$PPOP[1] <- management$plant_density
}

write_filex(filex, file_name = "PRISM.X")

# -----------------------------
# CREATE BATCH FILE
# -----------------------------
writeLines(
  "@FILEX  TRTNO  RP  SQ\nPRISM.X   1   1   0",
  "DSSBATCH.V48"
)

# -----------------------------
# RUN DSSAT
# -----------------------------
run_dssat(
  run_mode = "B",
  file_name = "DSSBATCH.V48"
)

# -----------------------------
# PARSE OUTPUT
# -----------------------------
if(!file.exists("Summary.OUT")){
  stop("DSSAT did not produce Summary.OUT")
}

summary_data <- read_output("Summary.OUT")

yield   <- summary_data$HWAM[1]
biomass <- summary_data$CWAM[1]

# -----------------------------
# RETURN RESULT
# -----------------------------
result <- list(
  yield = yield,
  biomass = biomass
)

write(
  toJSON(result, auto_unbox = TRUE, pretty = TRUE),
  output_file
)

cat("Simulation completed\n")