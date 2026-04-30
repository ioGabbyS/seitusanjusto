@echo off
echo =================================================
echo   ACTUALIZADOR RAPIDO SAN JUSTO (v2.1)
echo =================================================
echo.
echo [1/3] Guardando cambios locales...
git add .
git commit -m "update branding and access"

echo.
echo [2/3] Sincronizando con la nube (Git)...
echo (Subiendo desde rama dev...)
git push origin dev --force

echo.
echo [3/3] Desplegando en Vercel...
npx vercel --prod --yes

echo.
echo =================================================
echo   FINALIZADO. ACTUALIZA LA WEB EN 2 MINUTOS.
echo =================================================
pause
