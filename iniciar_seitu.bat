@echo off
title Seitu Manager
echo Iniciando Sistema Seitu...
echo Por favor, no cierres esta ventana mientras uses el programa.

:: Cambiar al directorio donde está este archivo
cd /d "%~dp0"

:: Abrir el navegador (espera unos segundos para asegurar que Vite inicie)
timeout /t 3 >nul
start "" "http://localhost:3000"

:: Iniciar el servidor
npm run dev -- --port 3000 --host
