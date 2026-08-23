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
# Generate FileX object from template for batch mode
# ------------------------------------------------
generate_batch_filex <- function(template_path, lat, lon, treatments){

  filex <- read_filex(template_path)

  # ------------------------------------------------
  # Update field coordinates
  # ------------------------------------------------
  filex$FIELDS$XCRD[1] <- as.numeric(lon)
  filex$FIELDS$YCRD[1] <- as.numeric(lat)
  filex$FIELDS$WSTA[1] <- "PRSM"
  filex$FIELDS$ID_SOIL[1] <- "PRSM0001"
  filex$FIELDS$ID_FIELD[1] <- "PRSM0001"

  # ------------------------------------------------
  # Update Treatments
  # ------------------------------------------------
  # Find exact name of TREATMENTS block to avoid appending duplicate due to partial match
  trt_name <- names(filex)[grepl("^TREATMENTS", names(filex))]
  trt_tier <- filex[[trt_name]]
  trt_tier <- trt_tier[rep(1, nrow(treatments)), ]
  for (i in seq_len(nrow(treatments))) {
    trt_tier$N[i] <- i
    trt_tier$R[i] <- 1
    trt_tier$O[i] <- 1
    trt_tier$C[i] <- 0
    trt_tier$TNAME[i] <- treatments$name[i]
    fl <- treatments$factorLevels[i, ]
    trt_tier$CU[i] <- fl$CU
    trt_tier$FL[i] <- fl$FL
    trt_tier$SA[i] <- fl$SA
    trt_tier$IC[i] <- fl$IC
    trt_tier$MP[i] <- fl$MP
    trt_tier$MI[i] <- fl$MI
    trt_tier$MF[i] <- fl$MF
    trt_tier$MR[i] <- fl$MR
    trt_tier$MC[i] <- fl$MC
    trt_tier$MT[i] <- fl$MT
    trt_tier$ME[i] <- fl$ME
    trt_tier$MH[i] <- fl$MH
    trt_tier$SM[i] <- fl$SM
  }
  filex[[trt_name]] <- trt_tier

  # ------------------------------------------------
  # Variety Selection
  # ------------------------------------------------
  cult_df <- filex$CULTIVARS[1, ]
  cult_list <- list()
  unique_cu <- unique(treatments$factorLevels$CU)
  for (cu in unique_cu) {
    c <- cult_df
    c$C <- cu
    c$CR <- input$crop$cropCode
    c$INGENO <- input$crop$cultivarCode
    c$CNAME <- input$crop$cultivarName
    cult_list[[length(cult_list) + 1]] <- c
  }
  filex$CULTIVARS <- do.call(rbind, cult_list)

  # ------------------------------------------------
  # Planting Details
  # ------------------------------------------------
  plant_df <- filex$`PLANTING DETAILS`[1, ]
  plant_list <- list()
  unique_mp <- unique(treatments$factorLevels$MP)
  for (mp in unique_mp) {
    idx <- which(treatments$factorLevels$MP == mp)[1]
    p <- plant_df
    p$P <- mp
    m <- treatments$planting[idx, ]
    p$PDATE <- to_dssat_date(m$date)
    p$EDATE <- NA
    p$PPOP <- as.numeric(m$populationDensity)
    p$PPOE <- as.numeric(m$populationDensity)
    p$PLRS <- as.numeric(m$rowSpacing)
    p$PLDP <- as.numeric(m$depth)
    p$PLME <- m$method
    p$PLNAME <- treatments$name[idx]
    plant_list[[length(plant_list) + 1]] <- p
  }
  filex$`PLANTING DETAILS` <- do.call(rbind, plant_list)

  # ------------------------------------------------
  # Irrigation
  # ------------------------------------------------
  irr_df <- filex$`IRRIGATION AND WATER MANAGEMENT`[1, ]
  irr_list <- list()
  unique_mi <- unique(treatments$factorLevels$MI)
  for (mi in unique_mi) {
    idx <- which(treatments$factorLevels$MI == mi)[1]
    p <- irr_df
    p$I <- mi
    sched <- treatments$irrigationSchedules[[idx]]
    if (!is.null(sched) && nrow(sched) > 0) {
      irr_dates <- as.POSIXct(sched$date, tz="UTC")
      irr_vals  <- as.numeric(sched$depth)
      p$IDATE <- list(irr_dates)
      p$IROP  <- list(rep("IR003", length(irr_dates)))
      p$IRVAL <- list(irr_vals)
    } else {
      p$IDATE <- list(to_dssat_date(treatments$planting$date[idx]))
      p$IROP  <- list("IR003")
      p$IRVAL <- list(0)
    }
    p$IRNAME <- treatments$name[idx]
    irr_list[[length(irr_list) + 1]] <- p
  }
  filex$`IRRIGATION AND WATER MANAGEMENT` <- do.call(rbind, irr_list)

  # ------------------------------------------------
  # Fertilizers
  # ------------------------------------------------
  fert_df <- filex$`FERTILIZERS (INORGANIC)`[1, ]
  
  # Create a clean template row
  f_clean <- fert_df
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

  fert_list <- list()
  unique_mf <- unique(treatments$factorLevels$MF)
  for (mf in unique_mf) {
    idx <- which(treatments$factorLevels$MF == mf)[1]
    sched <- treatments$fertilizerSchedules[[idx]]
    if (is.null(sched) || nrow(sched) == 0) {
      sched <- data.frame(date = treatments$planting$date[idx], type = "UREA", amount = 0)
    }
    
    f_tier <- f_clean[rep(1, nrow(sched)), ]
    f_tier$F <- mf
    f_tier$FDATE <- as.POSIXct(sched$date, tz="UTC")
    
    for (j in seq_len(nrow(sched))) {
      type <- sched$type[j]
      amount <- as.numeric(sched$amount[j])
      
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
        # Try to use the code directly if it's already a DSSAT code
        f_tier$FMCD[j] <- type 
        f_tier$FAMN[j] <- amount
      }
    }
    f_tier$FERNAME <- treatments$name[idx]
    fert_list[[length(fert_list) + 1]] <- f_tier
  }
  filex$`FERTILIZERS (INORGANIC)` <- do.call(rbind, fert_list)

  # ------------------------------------------------
  # Harvest
  # ------------------------------------------------
  harv_df <- filex$`HARVEST DETAILS`[1, ]
  harv_list <- list()
  unique_mh <- unique(treatments$factorLevels$MH)
  for (mh in unique_mh) {
    idx <- which(treatments$factorLevels$MH == mh)[1]
    p <- harv_df
    p$H <- mh
    p$HDATE <- to_dssat_date(treatments$harvestDate[idx])
    p$HNAME <- treatments$name[idx]
    harv_list[[length(harv_list) + 1]] <- p
  }
  filex$`HARVEST DETAILS` <- do.call(rbind, harv_list)

  # Update SDATE based on the earliest planting date
  min_plant_date <- min(as.Date(treatments$planting$date))
  filex$`SIMULATION CONTROLS`$SDATE[1] <- as.POSIXct(min_plant_date)

  return(filex)
}

# ------------------------------------------------
# Write FileX file
# ------------------------------------------------
write_batch_filex_file <- function(filex, file_name="PRISM.X"){
  write_filex(
    filex,
    file_name=file_name,
    force_std_fmt=TRUE
  )
  cat("Experiment batch file written:", file_name, "\n")
}
