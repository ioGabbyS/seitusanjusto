@echo off
echo =================================================
echo   DIAGNOSTICO DE SUBIDA
echo =================================================
echo [1/1] Intentando subir...
call npx vercel --prod --yes
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo -------------------------------------------------
    echo   ERROR DETECTADO! Saca una foto a esta pantalla
    echo -------------------------------------------------
) else (
    echo.
    echo   SUBIDA EXITOSA! Refresca la web.
)
pause
