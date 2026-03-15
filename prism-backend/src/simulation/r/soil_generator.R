suppressPackageStartupMessages({
  library(dplyr)
  library(DSSAT)
})

TEMPLATE_PATH <- "C:/Users/asus/PRISM/prism-backend/src/simulation/templates/template.SOL"

# ------------------------------------------------
# Fetch SoilGrids profile (same as before)
# ------------------------------------------------
prism_get_soil_profile <- function(lon, lat, dir = "C:/PRISM_SOIL_DATA") {

  if (!dir.exists(dir)) dir.create(dir, recursive = TRUE)
  soil_dir <- csmTools:::.get_soilGrids_dataverse(dir = dir)
  message("Extracting soil profile...")
  sol_file <- file.path(soil_dir, "IN.SOL")
  if (!file.exists(sol_file)) {
    stop("IN.SOL not found in SoilGrids dataset")
  }
  lines <- readLines(sol_file)
  pedon_idx <- grep("^\\*", lines)
  pedon_block <- lines[pedon_idx[1]:(pedon_idx[2] - 1)]
  tmpfile <- file.path(getwd(), "temp_pedon.SOL")
  writeLines(pedon_block, tmpfile)
  soil_raw <- DSSAT::read_sol(tmpfile)
  soil_dssat <- list(
    SOIL = DSSAT::as_DSSAT_tbl(soil_raw)
  )
  soil_icasa <- csmTools::convert_dataset(
    dataset = soil_dssat,
    input_model = "dssat",
    output_model = "icasa"
  )
  message("Soil profile retrieved")
  return(soil_icasa)
}


# ------------------------------------------------
# Convert SoilGrids layers → DSSAT parameters
# ------------------------------------------------
generate_soil_layers <- function(lon, lat){

  cat("Fetching soil profile\n")

  soil_icasa <- prism_get_soil_profile(lon, lat)

  layers_raw <- soil_icasa$SOIL_PROFILE_LAYERS

  layers <- data.frame(
    SLB  = layers_raw$SLB[[1]],
    SLMH = rep(NA, length(layers_raw$SLB[[1]])),
    SLLL = layers_raw$SLLL[[1]],
    SDUL = layers_raw$SDUL[[1]],
    SSAT = layers_raw$SSAT[[1]],
    SRGF = layers_raw$SRGF[[1]],
    SSKS = layers_raw$SSKS[[1]],
    SBDM = layers_raw$SBDM[[1]],
    SLOC = layers_raw$SLOC[[1]],
    SLCL = layers_raw$SLCL[[1]],
    SLSI = layers_raw$SLSI[[1]],
    SLCF = rep(NA, length(layers_raw$SLB[[1]])),
    SLNI = layers_raw$SLNI[[1]],
    SLHW = layers_raw$SLHW[[1]],
    SLHB = rep(NA, length(layers_raw$SLB[[1]])),
    SCEC = rep(NA, length(layers_raw$SLB[[1]])),
    SADC = rep(NA, length(layers_raw$SLB[[1]]))
  )

  return(layers)
}

# ------------------------------------------------
# Generate PRSM.SOL using template
# ------------------------------------------------
generate_soil_config <- function(lon, lat){



  layers <- generate_soil_layers(lon, lat)

  template <- DSSAT::read_sol(TEMPLATE_PATH)

  soil_tbl <- template$SOIL

  n_layers <- nrow(layers)

  # expand template row
  soil_tbl <- soil_tbl[rep(1, n_layers), ]

  soil_tbl$SLB  <- layers$SLB
  soil_tbl$SLLL <- layers$SLLL
  soil_tbl$SDUL <- layers$SDUL
  soil_tbl$SSAT <- layers$SSAT
  soil_tbl$SRGF <- layers$SRGF
  soil_tbl$SSKS <- layers$SSKS
  soil_tbl$SBDM <- layers$SBDM
  soil_tbl$SLOC <- layers$SLOC
  soil_tbl$SLCL <- layers$SLCL
  soil_tbl$SLSI <- layers$SLSI
  soil_tbl$SLNI <- layers$SLNI
  soil_tbl$SLHW <- layers$SLHW

  template$SOIL <- soil_tbl

  return(template)
}

# ------------------------------------------------
# Write soil file
# ------------------------------------------------
write_soil_file <- function(soil_config, file_name = "PRSM.SOL"){

  DSSAT::write_sol(
    sol = soil_config,
    file_name = file_name,
    append = FALSE,
    force_std_fmt = TRUE
  )

  cat("Soil file written:", file_name, "\n")
}