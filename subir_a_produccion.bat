@echo off
echo =================================================
echo   SUBIR CAMBIOS A PRODUCCION (De DEV a MAIN)
echo =================================================
echo.
echo   Este script va a:
echo   1. Guardar tus cambios actuales en 'dev'
echo   2. Pasarlos a la rama 'main'
echo   3. Subirlos a Vercel (Internet)
echo   4. Volver a 'dev' para seguir trabajando
echo.
pause

echo.
echo [1/5] Guardando cambios en DEV...
git add .
git commit -m "Guardado automatico antes de deploy"

echo.
echo [2/5] Cambiando a rama MAIN...
git checkout main

echo.
echo [3/5] Trayendo cambios de DEV...
git merge dev

echo.
echo [4/5] Subiendo a VERCEL...
call deploy_reset.bat

echo.
echo [5/5] Volviendo a rama DEV...
git checkout dev

echo.
echo =================================================
echo   !LISTO! TU SITIO ESTA ACTUALIZADO EN VERCEL
echo   Y YA ESTAS DE VUELTA EN 'DEV'.
echo =================================================
pause
