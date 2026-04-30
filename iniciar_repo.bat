@echo off
echo INICIALIZANDO REPOSITORIO DE CONTROL DE VERSIONES...

:: Check if git installed
git --version
if %errorlevel% neq 0 (
    echo [ERROR] Git no esta instalado. Descargalo de https://git-scm.com/
    pause
    exit /b
)

:: Init Repo
if not exist .git (
    git init
    echo Repositorio local creado.
) else (
    echo Repositorio ya existe.
)

:: Add all files
git add .
git commit -m "Backup Automatico - %date% %time%"

:: Create MAIN branch if not exists
git branch -M main

:: Create and Switch to DEV branch
git checkout -b dev 2>nul || git checkout dev

echo ===================================================
echo   TODO LISTO! ESTAS EN LA RAMA DE DESARROLLO (dev)
echo ===================================================
echo.
echo   - Trabaja aqui tranquilo. Si rompes algo, la rama 'main' esta a salvo.
echo   - Para guardar cambios: 'git add .' -> 'git commit -m "mensaje"'
echo   - Para subir a produccion (Vercel):
echo       1. git checkout main
echo       2. git merge dev
echo       3. deploy_fast.bat
echo       4. git checkout dev
echo.
pause
