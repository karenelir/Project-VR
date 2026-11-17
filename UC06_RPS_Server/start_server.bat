@echo off
rem Starts the hand-shape server for Pepper's camera Rock Paper Scissors (UC06).
rem Usage:  start_server.bat [Pepper's IP address]      (default 10.10.42.150)
cd /d "%~dp0"
set ROBOT=%1
if "%ROBOT%"=="" set ROBOT=10.10.42.150
".venv\Scripts\python.exe" rps_server.py --robot %ROBOT%
pause
