suppressPackageStartupMessages({
  library(dplyr)
  library(lubridate)
  library(DSSAT)
})

WEATHER_TEMPLATE_PATH <- normalizePath(
  file.path(script_dir, "..", "templates", "template.WTH")
)

fetch_power_weather <- function(lon, lat, from, to, pars, res, src, output_path = NULL){

  start_date <- format(as.Date(from), "%Y%m%d")
  end_date <- format(as.Date(to), "%Y%m%d")
  start_year <- as.integer(format(as.Date(from), "%Y"))
  end_year <- as.integer(format(as.Date(to), "%Y"))

  api_url <- paste0(
    "https://power.larc.nasa.gov/api/temporal/daily/point",
    "?parameters=T2M,T2M_MAX,T2M_MIN,PRECTOTCORR,ALLSKY_SFC_SW_DWN",
    "&community=AG",
    "&longitude=", lon,
    "&latitude=", lat,
    "&start=", start_date,
    "&end=", end_date,
    "&format=JSON"
  )

  response <- jsonlite::fromJSON(api_url)
  parameters <- response$properties$parameter
  date_keys <- names(parameters$T2M_MAX)
  dates <- as.Date(date_keys, format = "%Y%m%d")

  clean_values <- function(values){
    values <- as.numeric(unname(values[date_keys]))
    values[values <= -900] <- NA_real_
    values
  }

  weather_data <- data.frame(
    LON = rep(lon, length(dates)),
    LAT = rep(lat, length(dates)),
    YEAR = as.integer(format(dates, "%Y")),
    MM = as.integer(format(dates, "%m")),
    DD = as.integer(format(dates, "%d")),
    DOY = as.integer(format(dates, "%j")),
    YYYYMMDD = dates,
    T2M = clean_values(parameters$T2M),
    T2M_MAX = clean_values(parameters$T2M_MAX),
    T2M_MIN = clean_values(parameters$T2M_MIN),
    PRECTOTCORR = clean_values(parameters$PRECTOTCORR),
    ALLSKY_SFC_SW_DWN = clean_values(parameters$ALLSKY_SFC_SW_DWN)
  )

  weather_data$YYYYMMDD <- dates
  list(WEATHER_DAILY = weather_data)
}

extract_db_weather_df <- function(climate) {
  if (is.null(climate) || is.null(climate$records)) return(NULL)
  records <- climate$records
  if (length(records) == 0) return(NULL)

  dfs <- list()

  if (is.data.frame(records)) {
    for (i in seq_len(nrow(records))) {
      yr <- records$year[i]
      daily_obj <- records$daily[i]
      if (is.list(daily_obj) && !is.data.frame(daily_obj)) {
        df <- as.data.frame(daily_obj[[1]])
      } else {
        df <- as.data.frame(daily_obj)
      }
      df$YEAR <- as.integer(yr)
      dfs[[i]] <- df
    }
  } else if (is.list(records)) {
    for (i in seq_along(records)) {
      rec <- records[[i]]
      yr <- rec$year
      df <- as.data.frame(rec$daily)
      df$YEAR <- as.integer(yr)
      dfs[[i]] <- df
    }
  }

  if (length(dfs) == 0) return(NULL)

  combined <- bind_rows(dfs)
  required_cols <- c("YEAR", "doy", "srad", "tmax", "tmin", "rain")
  if (!all(required_cols %in% names(combined))) {
    return(NULL)
  }

  combined <- combined %>%
    transmute(
      DATE = as.Date(paste0(YEAR, "-", doy), format = "%Y-%j"),
      SRAD = as.numeric(srad),
      TMAX = as.numeric(tmax),
      TMIN = as.numeric(tmin),
      RAIN = as.numeric(rain)
    ) %>%
    filter(!is.na(DATE)) %>%
    arrange(DATE)

  return(combined)
}

generate_weather_config <- function(lat, lon, start_year, end_year, elevation = 50, input = NULL){

  # ensure numeric values
  lat <- as.numeric(lat)
  lon <- as.numeric(lon)

  # Check if pre-loaded weather data is available from database via input.json
  db_weather_df <- NULL
  if (!is.null(input) && !is.null(input$climate)) {
    db_weather_df <- extract_db_weather_df(input$climate)
    if (!is.null(input$climate$elevation) && is.numeric(input$climate$elevation)) {
      elevation <- as.numeric(input$climate$elevation)
    }
  }

  if (!is.null(db_weather_df) && nrow(db_weather_df) > 0) {
    grid_name <- ifelse(!is.null(input$climate$grid_id), input$climate$grid_id, "DB_GRID")
    cat("Using pre-loaded weather data from database for grid:", grid_name, "\n")

    req_start <- as.Date(paste0(start_year, "-01-01"))
    req_end   <- as.Date(paste0(end_year, "-12-31"))

    # If requested date range is within database records, filter to range
    has_exact_range <- min(db_weather_df$DATE) <= req_start && max(db_weather_df$DATE) >= req_end

    if (has_exact_range) {
      weather_df <- db_weather_df %>%
        filter(DATE >= req_start & DATE <= req_end) %>%
        arrange(DATE)
    } else {
      # Use daily climatology from available database years
      cat("Requested dates outside database range; applying climatology average\n")
      weather_average <- db_weather_df %>%
        transmute(
          MONTH_DAY = format(DATE, "%m-%d"),
          SRAD = SRAD,
          TMAX = TMAX,
          TMIN = TMIN,
          RAIN = RAIN
        ) %>%
        group_by(MONTH_DAY) %>%
        summarise(
          across(c(SRAD, TMAX, TMIN, RAIN), ~ mean(.x, na.rm = TRUE)),
          .groups = "drop"
        )

      weather_df <- tibble(DATE = seq(req_start, req_end, by = "day")) %>%
        mutate(MONTH_DAY = format(DATE, "%m-%d")) %>%
        left_join(weather_average, by = "MONTH_DAY") %>%
        select(-MONTH_DAY)
    }

  } else {
    # Fallback to live NASA POWER API
    cat("Database weather not available. Fallback: Downloading weather from NASA POWER API\n")

    use_climatology <- end_year > 2025
    download_start_year <- if (use_climatology) 2005 else start_year
    download_end_year   <- if (use_climatology) 2025 else end_year

    weather <- fetch_power_weather(
      lon = lon,
      lat = lat,
      pars = c("air_temperature","precipitation","solar_radiation"),
      res = "daily",
      from = paste0(download_start_year, "-01-01"),
      to   = paste0(download_end_year, "-12-31"),
      src  = "nasa_power"
    )

    daily <- weather$WEATHER_DAILY

    if (use_climatology) {
      weather_average <- daily %>%
        transmute(
          MONTH_DAY = format(as.Date(YYYYMMDD), "%m-%d"),
          SRAD = ALLSKY_SFC_SW_DWN,
          TMAX = T2M_MAX,
          TMIN = T2M_MIN,
          RAIN = PRECTOTCORR
        ) %>%
        group_by(MONTH_DAY) %>%
        summarise(
          across(c(SRAD, TMAX, TMIN, RAIN), ~ mean(.x, na.rm = TRUE)),
          .groups = "drop"
        )

      weather_df <- tibble(DATE = seq(
        as.Date(paste0(start_year, "-01-01")),
        as.Date(paste0(end_year, "-12-31")),
        by = "day"
      )) %>%
        mutate(MONTH_DAY = format(DATE, "%m-%d")) %>%
        left_join(weather_average, by = "MONTH_DAY") %>%
        select(-MONTH_DAY)
    } else {
      weather_df <- daily %>%
        transmute(
          DATE = as.Date(YYYYMMDD),
          SRAD = ALLSKY_SFC_SW_DWN,
          TMAX = T2M_MAX,
          TMIN = T2M_MIN,
          RAIN = PRECTOTCORR
        ) %>%
        arrange(DATE)
    }
  }

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

write_weather_file <- function(
  weather_config,
  file_name="PRSM.WTH",
  template_path=WEATHER_TEMPLATE_PATH
){

  weather <- read_wth(template_path)
  weather_data <- weather_config$data

  if (inherits(weather_data$DATE, "POSIXt")) {
    template_dates <- as.POSIXct(weather_data$DATE, tz = "UTC")
  } else {
    template_dates <- as.POSIXct(
      as.Date(
        paste0(
          2000 + weather_data$DATE %/% 1000,
          "-01-01"
        )
      ) + weather_data$DATE %% 1000 - 1,
      tz = "UTC"
    )
  }

  weather <- weather[rep(1, nrow(weather_data)), , drop = FALSE]
  weather$DATE <- template_dates
  weather$SRAD <- weather_data$SRAD
  weather$TMAX <- weather_data$TMAX
  weather$TMIN <- weather_data$TMIN
  weather$RAIN <- weather_data$RAIN

  general <- attr(weather, "GENERAL")
  general$INSI <- weather_config$header$INSI
  general$LAT <- weather_config$header$LAT
  general$LONG <- weather_config$header$LONG
  general$ELEV <- weather_config$header$ELEV
  general$TAV <- weather_config$header$TAV
  general$AMP <- weather_config$header$AMP
  attr(weather, "GENERAL") <- general

  write_wth(weather, file_name = file_name, force_std_fmt = TRUE)

  cat("Weather file written:", file_name, "\n")
}