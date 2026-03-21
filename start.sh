#!/bin/bash

# Script de inicialização rápida
# Plataforma de Contabilidade com IA

set -e

echo "=================================================="
echo "  Plataforma de Contabilidade com IA"
echo "  Inicialização Rápida"
echo "=================================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Arquivo .env não encontrado!"
    echo ""
    echo "Por favor, siga estes passos:"
    echo "1. Copie o arquivo de exemplo:"
    echo "   cp .env.example .env"
    echo ""
    echo "2. Edite o .env e adicione sua chave do Claude:"
    echo "   ANTHROPIC_API_KEY=sua_chave_aqui"
    echo ""
    echo "3. Execute este script novamente"
    echo ""
    exit 1
fi

# Check if ANTHROPIC_API_KEY is set
if ! grep -q "ANTHROPIC_API_KEY=sk-" .env; then
    echo "⚠️  Atenção: ANTHROPIC_API_KEY não configurada no .env"
    echo ""
    echo "Para obter a chave:"
    echo "1. Acesse: https://console.anthropic.com/"
    echo "2. Crie uma conta ou faça login"
    echo "3. Vá em 'API Keys'"
    echo "4. Crie uma nova chave"
    echo "5. Cole no arquivo .env"
    echo ""
    read -p "Deseja continuar mesmo assim? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando!"
    echo ""
    echo "Por favor, inicie o Docker Desktop e tente novamente."
    exit 1
fi

echo "✓ Verificações iniciais passaram"
echo ""

# Ask if user wants to start
echo "Este script irá:"
echo "  • Iniciar PostgreSQL (banco de dados)"
echo "  • Iniciar Redis (cache e filas)"
echo "  • Iniciar MinIO (armazenamento de arquivos)"
echo "  • Iniciar Backend Python (FastAPI + Agentes IA)"
echo ""
read -p "Iniciar todos os serviços? (Y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Nn]$ ]]; then
    exit 0
fi

echo ""
echo "🚀 Iniciando serviços..."
echo ""

# Start services
docker-compose up -d postgres redis minio backend-python

echo ""
echo "⏳ Aguardando serviços iniciarem..."
sleep 5

# Check health
echo ""
echo "🔍 Verificando saúde dos serviços..."
echo ""

# Check backend
if curl -s http://localhost:8000/api/v1/health > /dev/null; then
    echo "✓ Backend Python está rodando"
else
    echo "⚠️  Backend Python ainda não está pronto"
    echo "   Execute: docker-compose logs -f backend-python"
fi

# Check PostgreSQL
if docker-compose exec -T postgres pg_isready > /dev/null 2>&1; then
    echo "✓ PostgreSQL está rodando"
else
    echo "⚠️  PostgreSQL ainda não está pronto"
fi

# Check Redis
if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo "✓ Redis está rodando"
else
    echo "⚠️  Redis ainda não está pronto"
fi

echo ""
echo "=================================================="
echo "  🎉 Sistema Iniciado!"
echo "=================================================="
echo ""
echo "Serviços disponíveis:"
echo "  • Backend Python: http://localhost:8000"
echo "  • API Docs: http://localhost:8000/api/v1/docs"
echo "  • MinIO Console: http://localhost:9001 (admin/admin123)"
echo ""
echo "Próximos passos:"
echo "  1. Abra http://localhost:8000/api/v1/docs no navegador"
echo "  2. Teste os endpoints na interface Swagger"
echo "  3. Execute: python scripts/test_system.py"
echo ""
echo "Ver logs:"
echo "  docker-compose logs -f backend-python"
echo ""
echo "Parar serviços:"
echo "  docker-compose down"
echo ""
echo "=================================================="
