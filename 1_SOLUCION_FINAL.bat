@echo off
title SOLUCION FINAL SEITU
echo =================================================
echo   REPARANDO SISTEMA DE STOCK (v5.7.3)
echo =================================================
echo.
echo [1/2] Guardando parche de unificacion...
git add .
git commit -m "Solucion definitiva: Unificacion de stock por ID oficial"
echo.
echo [2/2] Subiendo a la nube...
npx vercel --prod --yes
echo.
echo =================================================
echo   TODO LISTO! 
echo   Refresca con CTRL + F5 y pulsa REPARAR TODO.
echo =================================================
pause
