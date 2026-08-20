suppressPackageStartupMessages(library(DSSAT))

dssat_path <- "C:/DSSAT48"

# inspect experiment file
filex <- read_filex(file.path(dssat_path, "Rice", "IRMZ8601.RIX"))

cat("\n---- FILEX STRUCTURE ----\n")
print(names(filex))

cat("\n---- PLANTING TABLE ----\n")
print(filex$planting)

cat("\n---- CULTIVAR TABLE (if exists) ----\n")
if ("cultivars" %in% names(filex)) {
  print(filex$cultivars)
}

# inspect cultivar file
cul <- read_cul(file.path(dssat_path, "Genotype", "RICER048.CUL"))

cat("\n---- CUL COLUMNS ----\n")
print(colnames(cul))

cat("\n---- FIRST 10 CULTIVARS ----\n")
print(head(cul,10))