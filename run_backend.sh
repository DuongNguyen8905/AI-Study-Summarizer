#!/bin/bash
echo "=== Khởi động AI Study Summarizer Backend (FastAPI) ==="
cd "$(dirname "$0")/backend" || exit
PYTHONPATH=. ../venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
