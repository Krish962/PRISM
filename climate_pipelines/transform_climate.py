from datetime import datetime


def date_to_doy(date_str):
    """
    Convert YYYYMMDD string to day-of-year (DOY)
    """
    date = datetime.strptime(date_str, "%Y%m%d")
    return date.timetuple().tm_yday


def transform_nasa_to_daily(raw_json):
    """
    Transform NASA POWER yearly JSON to CERES-ready daily records
    """

    params = raw_json["properties"]["parameter"]

    srad_raw = params["ALLSKY_SFC_SW_DWN"]
    tmax_raw = params["T2M_MAX"]
    tmin_raw = params["T2M_MIN"]
    rain_raw = params["PRECTOTCORR"]

    daily_records = []

    # Iterate by date key (YYYYMMDD)
    for date_str in sorted(srad_raw.keys()):
        record = {
            "doy": date_to_doy(date_str),
            "srad": float(srad_raw[date_str]),
            "tmax": float(tmax_raw[date_str]),
            "tmin": float(tmin_raw[date_str]),
            "rain": float(rain_raw[date_str])
        }

        daily_records.append(record)

    return daily_records
