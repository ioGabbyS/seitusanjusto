@echo off
title SINCRONIZADOR SEITU v5.7
echo =================================================
echo   SINCRONIZANDO CATALOGO (v5.7.0)
echo =================================================
echo.
echo [1/3] Guardando cambios locales...
git add .
git commit -m "Fix final catalogo e IDs fijos"
echo.
echo Presiona una tecla para subir a Internet...
pause

echo.
echo [2/3] Subiendo cambios...
git push origin dev
git checkout main
git merge dev --no-edit
git push origin main
git checkout dev
echo.
echo [3/3] Desplegando en Vercel...
npx vercel --prod --yes
echo.
echo =================================================
echo   PROCESO TERMINADO!
echo   Refresca la web con CTRL + F5 y busca la v5.7.0
echo =================================================
pause
