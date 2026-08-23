suppressPackageStartupMessages({
  library(DSSAT)
})

# ------------------------------------------------
# Convert YYYY-MM-DD → POSIXct (DSSAT expects dates)
# ------------------------------------------------
to_dssat_date <- function(date_str){

  as.POSIXct(date_str, tz="UTC")
}

# ------------------------------------------------
# Generate FileX object from template
# ------------------------------------------------
generate_filex <- function(template_path, lat, lon, management, batch_mode = FALSE){

  filex <- read_filex(template_path)

# ------------------------------------------------
# Update field coordinates
# ------------------------------------------------
  filex$FIELDS$XCRD[1] <- as.numeric(lon)
  filex$FIELDS$YCRD[1] <- as.numeric(lat)

  filex$FIELDS$WSTA[1] <- "PRSM"
  filex$FIELDS$ID_SOIL[1] <- "PRSM0001"
  filex$FIELDS$ID_FIELD[1] <- "PRSM0001"
  if (batch_mode) {
      return(filex)
  }

# ------------------------------------------------
# Variety Selection
# ------------------------------------------------
  cultivar <- input$crop

  cultivar_tier <- filex$CULTIVARS

  cultivar_tier$CR <- "RI"
  cultivar_tier$INGENO <- cultivar$cultivarCode
  cultivar_tier$CNAME <- cultivar$cultivarName

  filex$CULTIVARS <- cultivar_tier
# ------------------------------------------------
# Planting
# ------------------------------------------------
  plant <- filex$`PLANTING DETAILS`

  plant$PDATE[1] <- to_dssat_date(management$planting$date)

  plant$PPOP[1] <- as.numeric(management$planting$populationDensity)
  plant$PPOE[1] <- as.numeric(management$planting$populationDensity)
  plant$PLRS[1] <- as.numeric(management$planting$rowSpacing)
  plant$PLDP[1] <- as.numeric(management$planting$depth)
  plant$PLME[1] <- management$planting$method

  filex$`PLANTING DETAILS` <- plant

# ------------------------------------------------
# Irrigation schedule
# ------------------------------------------------

  if (is.null(management$irrigationSchedules) ||
      length(management$irrigationSchedules) == 0 ||
      (is.data.frame(management$irrigationSchedules) &&
      nrow(management$irrigationSchedules) == 0)) {

    management$irrigationSchedules <- data.frame(
      date = management$planting$date,
      depth = 0
    )
  }

  if(!is.null(management$irrigationSchedules) &&
    nrow(management$irrigationSchedules) > 0){

    irr <- management$irrigationSchedules

    irr_dates <- as.POSIXct(irr$date, tz="UTC")
    irr_vals  <- as.numeric(irr$depth)

    irr_tier <- filex$`IRRIGATION AND WATER MANAGEMENT`

    irr_tier <- irr_tier[1,]

    irr_tier$IDATE <- list(irr_dates)
    irr_tier$IROP  <- list(rep("IR003", length(irr_dates)))
    irr_tier$IRVAL <- list(irr_vals)

    filex$`IRRIGATION AND WATER MANAGEMENT` <- irr_tier
  }

# ------------------------------------------------
# Fertilizer schedule
# ------------------------------------------------

  # ADD DEFAULT FERTILIZER IF NONE PROVIDED
  if (is.null(management$fertilizerSchedules) ||
      length(management$fertilizerSchedules) == 0 ||
      (is.data.frame(management$fertilizerSchedules) &&
      nrow(management$fertilizerSchedules) == 0)) {

    management$fertilizerSchedules <- data.frame(
      date = management$planting$date,
      type = "N",
      amount = 0
    )
  }

  if(!is.null(management$fertilizerSchedules) &&
    nrow(management$fertilizerSchedules) > 0){

    fert <- management$fertilizerSchedules

    fert_tier <- filex$`FERTILIZERS (INORGANIC)`
    
    # Create a clean template row
    f_clean <- fert_tier[1, ]
    f_clean$FDATE <- NA
    f_clean$FMCD <- "FE005"
    f_clean$FACD <- "AP002"
    f_clean$FDEP <- 5
    f_clean$FAMN <- NA
    f_clean$FAMP <- NA
    f_clean$FAMK <- NA
    f_clean$FAMC <- NA
    f_clean$FAMO <- NA
    f_clean$FOCD <- NA

    f_tier <- f_clean[rep(1, nrow(fert)), ]
    f_tier$F <- 1
    f_tier$FDATE <- as.POSIXct(fert$date, tz="UTC")
    
    for (j in seq_len(nrow(fert))) {
      type <- fert$type[j]
      amount <- as.numeric(fert$amount[j])
      
      if (type == "DAP") {
        f_tier$FMCD[j] <- "FE013"
        f_tier$FAMP[j] <- amount
        f_tier$FAMN[j] <- 0
      } else if (type == "MOP") {
        f_tier$FMCD[j] <- "FE007"
        f_tier$FAMK[j] <- amount
        f_tier$FAMN[j] <- 0
      } else if (type == "UREA") {
        f_tier$FMCD[j] <- "FE005"
        f_tier$FAMN[j] <- amount
      } else if (type == "FE661" || type == "ORGANIC") {
        f_tier$FMCD[j] <- "FE661"
        f_tier$FACD[j] <- "AP006"
        f_tier$FDEP[j] <- 0
        f_tier$FAMO[j] <- amount
        f_tier$FAMN[j] <- 0
      } else {
        f_tier$FMCD[j] <- type 
        f_tier$FAMN[j] <- amount
      }
    }

    filex$`FERTILIZERS (INORGANIC)` <- f_tier
  }

# ------------------------------------------------
# Harvest
# ------------------------------------------------
  filex$`HARVEST DETAILS`$HDATE[1] <- to_dssat_date(
    management$harvestDate
  )

  plant_date <- as.Date(management$planting$date)
  sdate <- plant_date
  filex$`SIMULATION CONTROLS`$SDATE[1] <- as.POSIXct(sdate)

  return(filex)
}

# ------------------------------------------------
# Write FileX file
# ------------------------------------------------
write_filex_file <- function(filex, file_name="PRISM.X"){

  write_filex(
    filex,
    file_name=file_name,
    force_std_fmt=TRUE
  )

  cat("Experiment file written:", file_name, "\n")
}