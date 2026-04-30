@echo off
echo =================================================
echo   SINCRONIZANDO CATALOGO CON LA NUBE
echo =================================================
echo.
echo [1/2] Guardando tus nuevos IDs fijos...
git add .
git commit -m "Fijando IDs de productos para evitar duplicados"

echo.
echo [2/2] Subiendo cambios a Vercel...
echo Por favor, si se abre una ventana del navegador, acepta los permisos.
git push origin dev
git checkout main
git merge dev
git push origin main
git checkout dev

echo.
echo Intentando forzar el despliegue directo...
npx vercel --prod --yes

echo.
echo =================================================
echo   PROCESO TERMINADO - REFRESA LA WEB CON CTRL+F5
echo =================================================
pause
