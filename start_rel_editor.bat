@echo off
setlocal
cd /d "%~dp0REL_EDITOR\server"
if not exist node_modules (
  call npm install
)
call npm start