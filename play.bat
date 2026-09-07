@echo off
cd /d "%~dp0"
echo Opening CASH COW at http://127.0.0.1:8765/
echo Keep this window open while you play.
start "" "http://127.0.0.1:8765/"
python -m http.server 8765
pause
