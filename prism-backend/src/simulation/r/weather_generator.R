suppressPackageStartupMessages({
  library(dplyr)
  library(lubridate)
  library(csmTools)
  library(DSSAT)
})

generate_weather_config <- function(lat, lon, start_year, end_year, elevation = 50){

  cat("Downloading weather from NASA POWER\n")

  # ensure numeric values
  lat <- as.numeric(lat)
  lon <- as.numeric(lon)

  # --------------------------------------------------
  # NASA POWER currently has data only up to 2025.
  # If future years are requested, download only 2025
  # and later duplicate it.
  # --------------------------------------------------

  duplicate_future <- FALSE

  download_start_year <- start_year
  download_end_year   <- end_year

  if (start_year > 2025) {
    download_start_year <- 2025
    duplicate_future <- TRUE
  }

  if (end_year > 2025) {
    download_end_year <- 2025
    duplicate_future <- TRUE
  }

  weather <- get_weather_data(
    lon = lon,
    lat = lat,
    pars = c("air_temperature","precipitation","solar_radiation"),
    res = "daily",
    from = paste0(download_start_year, "-01-01"),
    to   = paste0(download_end_year, "-12-31"),
    src  = "nasa_power"
  )

  daily <- weather$WEATHER_DAILY

  # --------------------------------------------------
  # If future weather was requested, duplicate the
  # downloaded year(s) by shifting one year forward.
  # --------------------------------------------------

  if (duplicate_future) {

    daily_future <- daily

    daily_future$YYYYMMDD <-
      lubridate::ymd(daily_future$YYYYMMDD) + years(1)

    daily <- bind_rows(
      daily,
      daily_future
    ) %>%
      arrange(YYYYMMDD)
  }

  weather_df <- daily %>%
    transmute(
      DATE = as.Date(YYYYMMDD),
      SRAD = ALLSKY_SFC_SW_DWN,
      TMAX = T2M_MAX,
      TMIN = T2M_MIN,
      RAIN = PRECTOTCORR
    ) %>%
    arrange(DATE)

  tav <- calc_TAV(weather_df)
  amp <- calc_AMP(weather_df)

  weather_df <- weather_df %>%
    mutate(
      DATE = as.integer(
        paste0(format(DATE,"%y"), format(DATE,"%j"))
      )
    )

  weather_config <- list(
    header = list(
      INSI = "PRSM",
      LAT = lat,
      LONG = lon,
      ELEV = elevation,
      TAV = tav,
      AMP = amp
    ),
    data = weather_df
  )

  return(weather_config)
}

write_weather_file <- function(weather_config, file_name="PRSM.WTH"){

  write_wth(
    wth = weather_config$data,
    file_name = file_name,
    force_std_fmt = TRUE,

    location = "PRSM",
    comments = NULL,

    INSI = weather_config$header$INSI,
    LAT  = weather_config$header$LAT,
    LONG = weather_config$header$LONG,
    ELEV = weather_config$header$ELEV,

    TAV = weather_config$header$TAV,
    AMP = weather_config$header$AMP,

    REFHT = NULL,
    WNDHT = NULL,
    CO2   = NULL
  )

  cat("Weather file written:", file_name, "\n")
}