@echo off
chcp 65001 >nul
title DuoMed - mandar questoes para o Supabase
cd /d "%~dp0supabase\importar"
echo.
echo  Abra no navegador: Supabase ^> projeto duomed ^> SQL Editor ^> New query
echo.
echo  Para cada arquivo, este programa COPIA o texto para voce.
echo  No Supabase: clique na caixa de texto, Ctrl+A, Ctrl+V e clique em Run.
echo  Espere aparecer "Success" e volte aqui.
echo.
for /L %%i in (1,1,16) do (
  if exist "mudancas-%%i.sql" (
    powershell -NoProfile -Command "Get-Content -Raw -Encoding UTF8 'mudancas-%%i.sql' | Set-Clipboard"
    echo  [%%i de 16] mudancas-%%i.sql COPIADO. Cole no Supabase e clique em Run.
    pause
  )
)
echo.
echo  Pronto! Todos os arquivos foram copiados. Avise o Claude no chat.
pause
