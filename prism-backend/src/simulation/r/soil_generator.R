suppressPackageStartupMessages({
  library(dplyr)
  library(DSSAT)
})

TEMPLATE_PATH <- "C:/Users/asus/PRISM/prism-backend/src/simulation/templates/template.SOL"

# ------------------------------------------------
# Generate soil profile from DB input (Pedotransfer)
# ------------------------------------------------
prism_generate_soil_profile <- function(soil){

  layers_raw <- as.data.frame(soil$layers)

  SLB <- sapply(
    layers_raw$depth_cm,
    function(x){
      x <- gsub("cm","",x)
      as.numeric(strsplit(x,"-")[[1]][2])
    }
  )

  n <- length(SLB)

  compute_hydraulic <- function(sand, clay, soc){

    s <- sand/100
    c <- clay/100
    om <- soc/10

    theta_1500t <- -0.024*s + 0.487*c + 0.006*om +
                   0.005*s*om - 0.013*c*om + 0.068*s*c + 0.031

    theta_1500 <- theta_1500t + (0.14 * theta_1500t - 0.02)

    theta_33t <- -0.251*s + 0.195*c + 0.011*om +
                 0.006*s*om - 0.027*c*om + 0.452*s*c + 0.299

    theta_33 <- theta_33t + (1.283 * theta_33t^2 - 0.374 * theta_33t - 0.015)

    theta_sat <- theta_33 + (0.636 * theta_33 - 0.107)

    ks <- 1930 * (theta_sat - theta_33)^1.8

    list(SLLL=theta_1500, SDUL=theta_33, SSAT=theta_sat, SSKS=ks)
  }

  SLLL <- numeric(n)
  SDUL <- numeric(n)
  SSAT <- numeric(n)
  SSKS <- numeric(n)

  for(i in 1:n){
    hyd <- compute_hydraulic(
      layers_raw$sand[i],
      layers_raw$clay[i],
      layers_raw$soc[i]
    )

    SLLL[i] <- hyd$SLLL
    SDUL[i] <- hyd$SDUL
    SSAT[i] <- hyd$SSAT
    SSKS[i] <- hyd$SSKS
  }

  return(list(
    SLB  = SLB,
    SLLL = SLLL,
    SDUL = SDUL,
    SSAT = SSAT,
    SRGF = exp(-0.02 * SLB),
    SSKS = SSKS,
    SBDM = layers_raw$bdod,
    SLOC = layers_raw$soc,
    SLCL = layers_raw$clay,
    SLSI = layers_raw$silt,
    SLNI = rep(as.numeric(NA), n),
    SLHW = layers_raw$phh2o
  ))
}

# ------------------------------------------------
# Generate DSSAT .SOL (FINAL FIXED VERSION)
# ------------------------------------------------
generate_soil_config <- function(soil){

  layers <- prism_generate_soil_profile(soil)

  template <- DSSAT::read_sol(TEMPLATE_PATH)

  n <- length(layers$SLB)

  # 🔥 Replace ALL layer columns consistently
  template$SLB  <- list(layers$SLB)
  template$SLMH <- list(rep(as.numeric(NA), n))
  template$SLLL <- list(layers$SLLL)
  template$SDUL <- list(layers$SDUL)
  template$SSAT <- list(layers$SSAT)
  template$SRGF <- list(layers$SRGF)
  template$SSKS <- list(layers$SSKS)
  template$SBDM <- list(layers$SBDM)
  template$SLOC <- list(layers$SLOC)
  template$SLCL <- list(layers$SLCL)
  template$SLSI <- list(layers$SLSI)
  template$SLCF <- list(rep(as.numeric(NA), n))
  template$SLNI <- list(layers$SLNI)
  template$SLHW <- list(layers$SLHW)
  template$SLHB <- list(rep(as.numeric(NA), n))
  template$SCEC <- list(rep(as.numeric(NA), n))
  template$SADC <- list(rep(as.numeric(NA), n))

  return(template)
}

write_soil_file <- function(soil_config, file_name = "PRSM.SOL"){

  DSSAT::write_sol(
    sol = soil_config,
    file_name = file_name,
    append = FALSE,
    force_std_fmt = TRUE
  )

  cat("Soil file written:", file_name, "\n")
}