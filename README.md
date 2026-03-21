# Plataforma de Contabilidade Automatizada com IA

Sistema escalável de contabilidade que utiliza múltiplos agentes de IA para automatizar processos contábeis, permitindo atender milhares de clientes com eficiência e precisão.

## 🎯 Visão Geral

Esta plataforma permite que contadores ofereçam serviços contábeis automatizados através de agentes de IA especializados que:
- Processam e classificam documentos fiscais
- Calculam impostos automaticamente (Simples Nacional, ICMS, ISS, etc)
- Geram declarações fiscais (DEFIS, DASN, DAS)
- Validam e verificam erros automaticamente
- Se comunicam com clientes de forma inteligente

## 🏗️ Arquitetura

### Backend Python (FastAPI)
- **Agentes de IA**: Sistema multi-agente usando Claude SDK
- **Processamento de Documentos**: OCR e extração de dados
- **Cálculos Fiscais**: Lógica complexa de impostos brasileiros
- **Validações**: Verificação automática de conformidade

### Backend Node.js (TypeScript + Express)
- **API REST**: Interface para frontend e integrações
- **Autenticação**: JWT e controle de acesso
- **WebSockets**: Comunicação em tempo real
- **Orquestração**: Coordenação entre serviços

### Frontend (React + Next.js)
- **Dashboard**: Interface intuitiva para contadores
- **Portal do Cliente**: Área para upload de documentos
- **Relatórios**: Visualização de dados fiscais
- **Chat IA**: Comunicação com agentes

### Infraestrutura
- **PostgreSQL**: Banco de dados principal
- **Redis**: Cache e filas de processamento
- **S3/MinIO**: Armazenamento de documentos
- **Docker**: Containerização de serviços

## 🤖 Agentes de IA

### 1. Agente de Processamento de Documentos
- Recebe uploads de notas fiscais, recibos, etc
- Extrai dados usando OCR e análise inteligente
- Classifica tipo de documento

### 2. Agente de Classificação Fiscal
- Analisa documentos processados
- Identifica natureza da operação
- Classifica conforme CFOP, NCM, CST

### 3. Agente de Cálculo de Impostos
- Calcula impostos federais, estaduais e municipais
- Simples Nacional (anexos I a VI)
- ICMS, ISS, PIS, COFINS, IPI

### 4. Agente de Geração de Declarações
- Gera DEFIS (Declaração de Informações Socioeconômicas e Fiscais)
- Gera DASN (Declaração Anual do Simples Nacional)
- Gera DAS (Documento de Arrecadação do Simples Nacional)
- Gera outras obrigações acessórias

### 5. Agente de Validação
- Verifica consistência de dados
- Identifica erros e inconsistências
- Sugere correções automaticamente

### 6. Agente de Comunicação
- Interage com clientes via chat
- Solicita documentos faltantes
- Responde dúvidas sobre declarações
- Envia notificações e lembretes

### 7. Agente Coordenador (Orquestrador)
- Gerencia fluxo entre agentes
- Prioriza tarefas
- Resolve conflitos
- Monitora performance

## 📦 Estrutura do Projeto

```
projeto-contabilidade/
├── backend-python/           # Processamento IA e cálculos
│   ├── app/
│   │   ├── agents/          # Agentes de IA
│   │   ├── services/        # Lógica de negócio
│   │   ├── models/          # Modelos de dados
│   │   ├── api/             # Endpoints FastAPI
│   │   └── utils/           # Utilitários
│   ├── requirements.txt
│   └── Dockerfile
│
├── backend-nodejs/          # API REST e orquestração
│   ├── src/
│   │   ├── controllers/    # Controladores HTTP
│   │   ├── services/       # Serviços de negócio
│   │   ├── routes/         # Rotas da API
│   │   ├── middleware/     # Middlewares
│   │   └── types/          # Tipos TypeScript
│   ├── package.json
│   └── Dockerfile
│
├── frontend/               # Interface React
│   ├── src/
│   │   ├── components/    # Componentes React
│   │   ├── pages/         # Páginas Next.js
│   │   ├── services/      # Chamadas API
│   │   ├── hooks/         # React hooks
│   │   └── types/         # Tipos TypeScript
│   ├── package.json
│   └── Dockerfile
│
├── shared/                # Código compartilhado
│   ├── types/            # Tipos comuns
│   └── constants/        # Constantes
│
├── database/             # Scripts de banco
│   ├── migrations/      # Migrações
│   └── seeds/           # Dados iniciais
│
├── docs/                # Documentação
│   ├── api/            # Docs da API
│   ├── agents/         # Docs dos agentes
│   └── deployment/     # Guias de deploy
│
├── docker-compose.yml   # Orquestração Docker
└── README.md           # Este arquivo
```

## 🚀 Instalação e Configuração

### Pré-requisitos
- Docker e Docker Compose
- Node.js 18+
- Python 3.11+
- PostgreSQL 15+
- Redis 7+

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Claude API
ANTHROPIC_API_KEY=your_claude_api_key

# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=contabilidade
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# Storage
S3_BUCKET=contabilidade-docs
S3_REGION=us-east-1
S3_ACCESS_KEY=your_access_key
S3_SECRET_KEY=your_secret_key

# API URLs
PYTHON_API_URL=http://localhost:8000
NODEJS_API_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000
```

### Iniciar com Docker

```bash
# Iniciar todos os serviços
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar serviços
docker-compose down
```

### Desenvolvimento Local

#### Backend Python
```bash
cd backend-python
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

#### Backend Node.js
```bash
cd backend-nodejs
npm install
npm run dev
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 📚 Documentação da API

### Endpoints Principais

#### Autenticação
- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Renovar token

#### Clientes
- `GET /api/clients` - Listar clientes
- `POST /api/clients` - Criar cliente
- `GET /api/clients/:id` - Detalhes do cliente
- `PUT /api/clients/:id` - Atualizar cliente

#### Documentos
- `POST /api/documents/upload` - Upload de documentos
- `GET /api/documents` - Listar documentos
- `GET /api/documents/:id` - Detalhes do documento
- `POST /api/documents/:id/process` - Processar documento

#### Impostos
- `POST /api/taxes/calculate` - Calcular impostos
- `GET /api/taxes/history/:clientId` - Histórico de impostos

#### Declarações
- `POST /api/declarations/generate` - Gerar declaração
- `GET /api/declarations/:id` - Baixar declaração
- `GET /api/declarations/client/:clientId` - Listar declarações

#### Agentes
- `GET /api/agents/status` - Status dos agentes
- `POST /api/agents/task` - Criar tarefa para agente
- `GET /api/agents/tasks/:id` - Status da tarefa

## 🔒 Segurança

- Autenticação JWT com refresh tokens
- Criptografia de dados sensíveis
- Rate limiting em todas as APIs
- Validação de entrada rigorosa
- Logs de auditoria
- Backup automático de dados
- HTTPS obrigatório em produção

## 🧪 Testes

```bash
# Backend Python
cd backend-python
pytest

# Backend Node.js
cd backend-nodejs
npm test

# Frontend
cd frontend
npm test
```

## 📊 Monitoramento

- Logs centralizados com ELK Stack
- Métricas com Prometheus + Grafana
- Alertas via Slack/Email
- Health checks automáticos

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto é proprietário e confidencial.

## 📧 Contato

Para dúvidas e suporte: contato@exemplo.com

---

Desenvolvido com ❤️ para revolucionar a contabilidade brasileira
