def validate_daily_climate(daily):
    """
    Validate daily climate records for CERES compatibility
    """

    if len(daily) not in (365, 366):
        raise ValueError(f"Invalid number of days: {len(daily)}")

    expected_doy = 1

    for day in daily:
        # Check DOY continuity
        if day["doy"] != expected_doy:
            raise ValueError(
                f"Missing or unordered day: expected DOY {expected_doy}, got {day['doy']}"
            )

        # Physical sanity checks
        if day["tmax"] < day["tmin"]:
            raise ValueError(
                f"TMAX < TMIN on DOY {day['doy']}"
            )

        if day["rain"] < 0:
            raise ValueError(
                f"Negative rainfall on DOY {day['doy']}"
            )

        expected_doy += 1

    return True
