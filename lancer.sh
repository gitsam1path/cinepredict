#!/usr/bin/env bash
# Lancement de CinéPredict sur macOS / Linux : ./lancer.sh
set -e
cd "$(dirname "$0")"

if [ ! -x ".venv/bin/python" ]; then
  echo "▶ Création de l'environnement Python et installation des dépendances..."
  python3 -m venv .venv
  .venv/bin/python -m pip install --upgrade pip >/dev/null
  .venv/bin/python -m pip install -r backend/requirements.txt
fi

if [ ! -d "frontend/node_modules" ]; then
  echo "▶ Installation des dépendances du site..."
  (cd frontend && npm install)
fi

echo "▶ API sur http://localhost:8000  ·  Site sur http://localhost:5173  (Ctrl+C pour arrêter)"
(cd backend && ../.venv/bin/python -m uvicorn api:app --reload --port 8000) &
API_PID=$!
trap "kill $API_PID 2>/dev/null" EXIT
cd frontend && npm run dev
