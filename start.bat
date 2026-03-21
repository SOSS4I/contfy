@echo off
REM Script de inicialização rápida para Windows
REM Plataforma de Contabilidade com IA

echo ==================================================
echo   Plataforma de Contabilidade com IA
echo   Inicialização Rápida (Windows)
echo ==================================================
echo.

REM Check if .env exists
if not exist .env (
    echo [ERRO] Arquivo .env nao encontrado!
    echo.
    echo Por favor, siga estes passos:
    echo 1. Copie o arquivo de exemplo:
    echo    copy .env.example .env
    echo.
    echo 2. Edite o .env e adicione sua chave do Claude:
    echo    ANTHROPIC_API_KEY=sua_chave_aqui
    echo.
    echo 3. Execute este script novamente
    echo.
    pause
    exit /b 1
)

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Docker nao esta rodando!
    echo.
    echo Por favor, inicie o Docker Desktop e tente novamente.
    echo.
    pause
    exit /b 1
)

echo [OK] Verificacoes iniciais passaram
echo.

echo Este script ira:
echo   * Iniciar PostgreSQL (banco de dados)
echo   * Iniciar Redis (cache e filas)
echo   * Iniciar MinIO (armazenamento de arquivos)
echo   * Iniciar Backend Python (FastAPI + Agentes IA)
echo.
set /p CONTINUE="Iniciar todos os servicos? (S/n): "
if /i "%CONTINUE%"=="n" exit /b 0

echo.
echo [*] Iniciando servicos...
echo.

REM Start services
docker-compose up -d postgres redis minio backend-python

echo.
echo [*] Aguardando servicos iniciarem...
timeout /t 5 /nobreak >nul

echo.
echo [*] Verificando saude dos servicos...
echo.

REM Check backend
curl -s http://localhost:8000/api/v1/health >nul 2>&1
if %errorlevel%==0 (
    echo [OK] Backend Python esta rodando
) else (
    echo [AVISO] Backend Python ainda nao esta pronto
    echo         Execute: docker-compose logs -f backend-python
)

echo.
echo ==================================================
echo   Sistema Iniciado!
echo ==================================================
echo.
echo Servicos disponiveis:
echo   * Backend Python: http://localhost:8000
echo   * API Docs: http://localhost:8000/api/v1/docs
echo   * MinIO Console: http://localhost:9001 (admin/admin123)
echo.
echo Proximos passos:
echo   1. Abra http://localhost:8000/api/v1/docs no navegador
echo   2. Teste os endpoints na interface Swagger
echo   3. Execute: python scripts\test_system.py
echo.
echo Ver logs:
echo   docker-compose logs -f backend-python
echo.
echo Parar servicos:
echo   docker-compose down
echo.
echo ==================================================
echo.
pause
