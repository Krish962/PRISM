suppressPackageStartupMessages({
  library(DSSAT)
})

args_full <- commandArgs(trailingOnly = FALSE)
script_path <- sub("--file=", "", args_full[grep("--file=", args_full)])
TEMPLATE_PATH <- normalizePath(file.path(dirname(script_path), "template.SOL"))

cat("\n==================== LOAD TEMPLATE ====================\n")

template <- DSSAT::read_sol(TEMPLATE_PATH)

# ------------------------------------------------
# TOP LEVEL STRUCTURE
# ------------------------------------------------
cat("\n--- TEMPLATE STRUCTURE ---\n")
str(template)

# ------------------------------------------------
# SOIL OBJECT STRUCTURE
# ------------------------------------------------
cat("\n--- template$SOIL STRUCTURE ---\n")
str(template$SOIL)

cat("\n--- template$SOIL CLASS ---\n")
print(class(template$SOIL))

cat("\n--- template$SOIL DIMENSIONS ---\n")
print(dim(template$SOIL))

cat("\n--- template$SOIL COLUMN NAMES ---\n")
print(names(template$SOIL))

# ------------------------------------------------
# CHECK EACH COLUMN TYPE
# ------------------------------------------------
cat("\n==================== COLUMN TYPES ====================\n")

for(col in names(template$SOIL)){
  cat("\nCOLUMN:", col, "\n")
  print(class(template$SOIL[[col]]))

  if(is.list(template$SOIL[[col]])){
    cat(" -> This is a LIST column\n")
    cat(" -> Length of list:", length(template$SOIL[[col]]), "\n")

    if(length(template$SOIL[[col]]) > 0){
      cat(" -> Type inside list:\n")
      print(class(template$SOIL[[col]][[1]]))

      cat(" -> First few values:\n")
      print(head(template$SOIL[[col]][[1]]))
    }
  } else {
    cat(" -> Normal column\n")
    print(template$SOIL[[col]])
  }
}

# ------------------------------------------------
# CHECK ONE FULL ROW
# ------------------------------------------------
cat("\n==================== FIRST ROW ====================\n")
print(template$SOIL[1, ])

# ------------------------------------------------
# CHECK LIST COLUMN LENGTH CONSISTENCY
# ------------------------------------------------
cat("\n==================== LAYER LENGTH CHECK ====================\n")

for(col in names(template$SOIL)){
  if(is.list(template$SOIL[[col]])){
    cat(col, "-> length:", length(template$SOIL[[col]][[1]]), "\n")
  }
}

# ------------------------------------------------
# CHECK HOW DSSAT EXPECTS STRUCTURE
# ------------------------------------------------
cat("\n==================== FINAL SUMMARY ====================\n")

cat("Rows:", nrow(template$SOIL), "\n")
cat("Columns:", ncol(template$SOIL), "\n")

cat("\nIMPORTANT OBSERVATIONS:\n")
cat("- If columns are LIST → must assign using list(vector)\n")
cat("- If columns are numeric → assign directly\n")
cat("- If mixed → handle column-wise\n")

cat("\n==================== END ====================\n")