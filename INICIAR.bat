@echo off
title DuoMed
cd /d "%~dp0"

rem Garante que o Node seja encontrado mesmo em terminais antigos
set "PATH=C:\Program Files\nodejs;%PATH%"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js nao encontrado. Instale em https://nodejs.org e tente de novo.
  pause
  exit /b
)

if not exist node_modules (
  echo Instalando dependencias pela primeira vez, aguarde...
  call npm.cmd install
)

echo.
echo Abrindo o DuoMed no navegador...
echo Para fechar o app, feche esta janela.
echo.
call npm.cmd run dev -- --open
pause
