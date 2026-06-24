@echo off
cd /d "%~dp0"
if not exist ".next" (
  call npm run build
)
npm run start
