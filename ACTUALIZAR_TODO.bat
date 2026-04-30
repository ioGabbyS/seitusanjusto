@echo off
echo =================================================
echo   ACTUALIZADOR MAESTRO SAN JUSTO (v2.3)
echo =================================================
echo.
echo [1/3] Guardando cambios locales...
git add .
git commit -m "force production deploy"

echo.
echo [2/3] Sincronizando con la nube (Git)...
git push origin main --force

echo.
echo [3/3] Desplegando en Vercel (MODO PRODUCCION FORZADO)...
npx vercel --prod --force --yes

echo.
echo =================================================
echo   ESPERA A QUE TERMINE DE VERDAD...
echo =================================================
pause
