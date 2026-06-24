@echo off
cd /d "%~dp0"
title Quiz App Manager
cls

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo =====================================================================
    echo ERROR: Node.js is not installed or not found in your system's PATH.
    echo Please install Node.js ^(https://nodejs.org/^) and try again.
    echo =====================================================================
    pause
    exit /b 1
)

:MENU
cls
echo =====================================================================
echo                     Quiz App Windows CLI Manager
echo =====================================================================
echo.
echo  [1] Start Development Server  (npm run dev)
echo  [2] Build Production App      (npm run build)
echo  [3] Run Production Server     (npm run start)
echo  [4] Run ESLint Check          (npm run lint)
echo  [5] Install Dependencies       (npm install)
echo  [6] Help / Check Environment
echo  [7] Exit
echo.
echo =====================================================================
echo.

set /p choice="Enter your choice (1-7): "

if "%choice%"=="1" goto DEV
if "%choice%"=="2" goto BUILD
if "%choice%"=="3" goto START
if "%choice%"=="4" goto LINT
if "%choice%"=="5" goto INSTALL
if "%choice%"=="6" goto ENV_CHECK
if "%choice%"=="7" goto EXIT

echo.
echo [!] Invalid selection, please choose between 1 and 7.
timeout /t 2 >nul
goto MENU

:DEV
cls
echo =====================================================================
echo [1] Starting Next.js Development Server...
echo =====================================================================
echo.
if not exist node_modules (
    echo [!] node_modules folder is missing. Installing dependencies first...
    call npm install
    echo.
)
if not exist .env.local (
    echo [WARNING] .env.local was not found. 
    echo Make sure you have your Gemini API keys and MongoDB URI configured!
    echo.
)
call npm run dev
echo.
echo Server stopped. Press any key to return to the menu...
pause >nul
goto MENU

:BUILD
cls
echo =====================================================================
echo [2] Building Next.js Production Build...
echo =====================================================================
echo.
call npm run build
echo.
echo Build complete. Press any key to return to the menu...
pause >nul
goto MENU

:START
cls
echo =====================================================================
echo [3] Starting Next.js Production Server...
echo =====================================================================
echo.
if not exist .next (
    echo [!] Production build folder (.next) not found.
    echo Building the application first...
    echo.
    call npm run build
    echo.
)
call npm run start
echo.
echo Server stopped. Press any key to return to the menu...
pause >nul
goto MENU

:LINT
cls
echo =====================================================================
echo [4] Running ESLint Static Analysis...
echo =====================================================================
echo.
call npm run lint
echo.
echo Linting finished. Press any key to return to the menu...
pause >nul
goto MENU

:INSTALL
cls
echo =====================================================================
echo [5] Installing Dependencies...
echo =====================================================================
echo.
call npm install
echo.
echo Installation completed. Press any key to return to the menu...
pause >nul
goto MENU

:ENV_CHECK
cls
echo =====================================================================
echo [6] Environment & System Diagnosis
echo =====================================================================
echo.
echo Node.js version:
call node -v
echo.
echo npm version:
call npm -v
echo.
echo Project Directory: %CD%
echo.
echo Configuration Files Status:
if exist .env.local (
    echo  - .env.local: FOUND
) else (
    echo  - .env.local: MISSING (Create this for API Keys & MongoDB)
)
if exist node_modules (
    echo  - node_modules: INSTALLED
) else (
    echo  - node_modules: MISSING (Run option 5 to install)
)
if exist .next (
    echo  - .next build: BUILT
) else (
    echo  - .next build: NOT BUILT
)
echo.
echo =====================================================================
echo Press any key to return to the menu...
pause >nul
goto MENU

:EXIT
cls
echo.
echo Thank you for using Quiz App Manager!
echo.
timeout /t 2 >nul
exit /b 0
