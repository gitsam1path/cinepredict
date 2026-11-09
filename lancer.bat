@echo off
chcp 65001 >nul
title CinePredict
echo.
echo  ====================================
echo      CinePredict - lancement
echo  ====================================
echo.

cd /d "%~dp0"

REM --- 1. Environnement Python (cree une seule fois) ---
if not exist ".venv\Scripts\python.exe" (
  echo [1/4] Creation de l'environnement Python...
  python -m venv .venv || (echo Python introuvable : installez Python 3.11+ depuis python.org & pause & exit /b 1)
  echo [2/4] Installation des dependances Python ^(quelques minutes la premiere fois^)...
  ".venv\Scripts\python.exe" -m pip install --upgrade pip >nul
  ".venv\Scripts\python.exe" -m pip install -r backend\requirements.txt || (pause & exit /b 1)
) else (
  echo [1-2/4] Environnement Python deja pret.
)

REM --- 2. Dependances du site (une seule fois) ---
if not exist "frontend\node_modules" (
  echo [3/4] Installation des dependances du site ^(npm install^)...
  pushd frontend
  call npm install || (echo Node.js introuvable : installez-le depuis nodejs.org & popd & pause & exit /b 1)
  popd
) else (
  echo [3/4] Dependances du site deja installees.
)

REM --- 3. Lancement des deux serveurs dans deux fenetres ---
echo [4/4] Demarrage de l'API (port 8000) et du site (port 5173)...
REM /d "..." fixe le dossier de travail, meme si le chemin contient des espaces
start "CinePredict - API" /d "%~dp0backend" cmd /k ""%~dp0.venv\Scripts\python.exe" -m uvicorn api:app --reload --port 8000"
start "CinePredict - Site" /d "%~dp0frontend" cmd /k "npm run dev"

REM --- 4. Ouverture du navigateur ---
REM On laisse le temps a l'API de charger les 4 modeles
timeout /t 10 >nul
start http://localhost:5173
echo.
echo  C'est parti ! Fermez les deux fenetres noires pour tout arreter.
echo.
pause
