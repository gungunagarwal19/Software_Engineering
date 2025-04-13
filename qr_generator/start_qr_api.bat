@echo off
echo Starting QR Code Generator API...
python -m uvicorn qr_api:app --host 0.0.0.0 --port 3002
pause
