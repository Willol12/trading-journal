@echo off
chcp 65001 >nul
title Trading Journal
cd /d "C:\Users\ccoss\Desktop\claude\trading-journal"

echo ============================================
echo              TRADING JOURNAL
echo ============================================
echo.

if not exist ".next\BUILD_ID" (
  echo Primeira inicializacao: preparando o app. Aguarde...
  echo.
  call npm run build
  echo.
)

echo Abrindo no navegador em instantes...
start "" /min cmd /c "timeout /t 4 >nul & start http://localhost:3000"
echo.
echo  O app esta rodando NESTA janela.
echo  - NAO feche esta janela enquanto estiver usando o Trading Journal.
echo  - Para encerrar o app, feche esta janela.
echo.
call npm run start
