#!/bin/bash

echo "============================================"
echo "  Iniciando Frontend - Contabilidade AI"
echo "============================================"
echo ""

cd frontend

echo "[1/3] Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo "[ERRO] Node.js não encontrado!"
    echo "Por favor, instale Node.js 18+ em: https://nodejs.org/"
    exit 1
fi
echo "[OK] Node.js instalado ($(node --version))"

echo ""
echo "[2/3] Instalando dependências..."
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "[OK] Dependências já instaladas"
fi

echo ""
echo "[3/3] Iniciando servidor de desenvolvimento..."
echo ""
echo "============================================"
echo "  Frontend disponível em:"
echo "  http://localhost:3000"
echo "============================================"
echo ""
echo "Pressione Ctrl+C para parar o servidor"
echo ""

npm run dev
