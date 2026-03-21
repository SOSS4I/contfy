@echo off
echo ============================================
echo   Iniciando Frontend - Contabilidade AI
echo ============================================
echo.

cd frontend

echo [1/3] Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Node.js nao encontrado!
    echo Por favor, instale Node.js 18+ em: https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js instalado

echo.
echo [2/3] Instalando dependencias...
if not exist node_modules (
    npm install
) else (
    echo [OK] Dependencias ja instaladas
)

echo.
echo [3/3] Iniciando servidor de desenvolvimento...
echo.
echo ============================================
echo   Frontend disponivel em:
echo   http://localhost:3000
echo ============================================
echo.
echo Pressione Ctrl+C para parar o servidor
echo.

npm run dev
