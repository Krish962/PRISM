@echo off

for %%f in (*_mean_1000.tif) do (
    echo Cropping %%f
    gdalwarp -te 68 6 97 37 -te_srs EPSG:4326 %%f india_%%f
)

echo Cropping finished.
pause