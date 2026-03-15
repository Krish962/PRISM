library(DSSAT)

filex <- read_filex("template.RIX")

cat("\n--- IRRIGATION AND WATER MANAGEMENT ---\n")
str(filex$`IRRIGATION AND WATER MANAGEMENT`)

cat("\n--- FERTILIZERS (INORGANIC) ---\n")
str(filex$`FERTILIZERS (INORGANIC)`)

cat("\n--- PLANTING DETAILS ---\n")
str(filex$`PLANTING DETAILS`)

str(filex)