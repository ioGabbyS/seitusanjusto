@echo off
title SUBIDA DIRECTA SEITU
echo =================================================
echo   FORZANDO ACTUALIZACION A v5.7.0
echo =================================================
echo.
echo [1/2] Preparando archivos para Internet...
npx vercel build --prod
echo.
echo [2/2] Subiendo directamente a la nube...
npx vercel deploy --prebuilt --prod --yes
echo.
echo =================================================
echo   DESPLIEGUE COMPLETADO!
echo   Ahora si, refresca con CTRL + F5.
echo =================================================
pause
