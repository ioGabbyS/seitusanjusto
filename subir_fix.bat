@echo off
echo =================================================
echo   SUBIR CAMBIOS (VERSION MEJORADA)
echo =================================================
echo.
echo [1/3] Guardando cambios locales...
git add .
git commit -m "Limpieza de catalogo e IDs fijos"

echo.
echo [2/3] Subiendo cambios a la nube...
echo Intentando subir por Git...
git push origin dev
git checkout main
git merge dev
git push origin main
git checkout dev

echo.
echo [3/3] Verificando despliegue...
echo Si usas el comando 'vercel' manualmente, tambien se ejecutara ahora:
where vercel >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Detectado Vercel CLI, desplegando...
    vercel --prod
) else (
    echo Vercel CLI no detectado, se confia en el push de Git.
)

echo.
echo =================================================
echo   PROCESO FINALIZADO
echo =================================================
pause
