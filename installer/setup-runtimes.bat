@echo off
setlocal
cd /d "%~dp0"
title BrowsMe - Python ve Node.js Qurasdirilmasi

powershell.exe -ExecutionPolicy Bypass -NoProfile -NonInteractive -File "%~dp0setup-runtimes.ps1"
set EXIT_CODE=%ERRORLEVEL%

exit /b %EXIT_CODE%
