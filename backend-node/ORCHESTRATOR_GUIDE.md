# 🎯 Monthly Processing Orchestrator - Guia Completo

## 📋 Visão Geral

O **Orchestrator** é o controlador central que coordena todos os 8 agentes de IA para realizar o processamento contábil mensal automatizado. Ele executa um fluxo completo desde a solicitação de documentos até a geração de relatórios finais.

## 🔄 Fluxo de Processamento

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUXO DO ORCHESTRATOR                        │
└─────────────────────────────────────────────────────────────────┘

1️⃣  Agent 1: Document Request
    └─> Determina quais documentos o cliente precisa enviar
    └─> Status: PENDING_DOCS

    ⏸️  PAUSA: Aguarda cliente fazer upload dos documentos

2️⃣  Agent 2: Document Validator
    └─> Valida se todos os documentos obrigatórios foram enviados
    └─> Verifica formato, tamanho e completude

3️⃣  Agent 3: NFe Extractor
    └─> Extrai dados fiscais dos XMLs de NFe
    └─> Salva dados estruturados no banco

4️⃣  Agent 4 ou 5: Tax Calculator
    └─> Calcula impostos (Simples Nacional ou Lucro Presumido)
    └─> Usa tabelas oficiais de 2025

5️⃣  Agent 6: DAS/DARF Generator
    └─> Gera guias de pagamento em PDF
    └─> Inclui código de barras e instruções

6️⃣  Agent 7: Accounting Journal
    └─> Gera lançamentos contábeis (débito/crédito)
    └─> Valida balanceamento

7️⃣  Agent 8: Report Generator
    └─> Gera DRE, indicadores e insights com IA
    └─> Usa Claude Opus 4.5 para análise

8️⃣  Final Validator
    └─> Double check de todos os resultados
    └─> Identifica inconsistências

✅  Status: COMPLETED
    └─> Notifica cliente
    └─> Salva todos os resultados
```

## 🚀 Como Usar

### 1. Via API (Recomendado para produção)

#### Iniciar Processamento

```bash
POST /api/v1/monthly-processing/start
Content-Type: application/json

{
  "client_id": "uuid-do-cliente",
  "reference_month": 11,
  "reference_year": 2025
}
```

**Resposta:**
```json
{
  "success": true,
  "cycle_id": "uuid-do-ciclo",
  "status": "PENDING_DOCS",
  "message": "Processamento iniciado. Aguardando upload de documentos pelo cliente.",
  "documents_requested": {
    "documents": [
      {
        "type": "nfe_emitida",
        "name": "Notas Fiscais Emitidas (XML)",
        "mandatory": true,
        "deadline": "2025-12-10"
      },
      ...
    ]
  }
}
```

#### Upload de Documento

```bash
POST /api/v1/monthly-processing/upload-document/:cycle_id
Content-Type: multipart/form-data

file: [arquivo]
document_type: "nfe_emitida"
```

**Resposta (quando todos os docs obrigatórios foram enviados):**
```json
{
  "success": true,
  "document": { ... },
  "message": "Documento enviado. Todos os documentos obrigatórios recebidos. Processamento iniciado!",
  "processing_started": true
}
```

#### Consultar Status

```bash
GET /api/v1/monthly-processing/status/:cycle_id
```

**Resposta:**
```json
{
  "cycle_id": "uuid",
  "client": { ... },
  "reference_month": 11,
  "reference_year": 2025,
  "status": "COMPLETED",
  "processing_log": "Processamento concluído com sucesso",
  "created_at": "2025-11-01T06:00:00Z",
  "updated_at": "2025-11-01T06:15:00Z",
  "data": {
    "documents_requested": { ... },
    "nfes_extracted": { ... },
    "tax_calculation": { ... },
    "das_file_path": "/path/to/das.pdf",
    "report": { ... }
  }
}
```

#### Listar Ciclos de um Cliente

```bash
GET /api/v1/monthly-processing/client/:client_id?year=2025
```

### 2. Via Código (Para scripts internos)

```typescript
import { MonthlyProcessingOrchestrator } from './services/monthly-processing-orchestrator'

const orchestrator = new MonthlyProcessingOrchestrator()

// Iniciar processamento
const result = await orchestrator.processMonthlyAccounting(
  'client-id',
  11, // mês
  2025 // ano
)

// Continuar após upload
const finalResult = await orchestrator.continueProcessingAfterUpload(
  result.cycle_id
)
```

### 3. Via CRON (Automático)

O CRON job roda automaticamente **dia 1 de cada mês às 06:00** (horário de Brasília).

```typescript
// Já está configurado no src/index.ts
import { startMonthlyCron } from './services/cron/monthly-processing.cron'

// Inicia o CRON
startMonthlyCron()
```

Para executar manualmente (desenvolvimento):
```typescript
import { runImmediately } from './services/cron/monthly-processing.cron'

runImmediately()
```

## 📊 Status dos Ciclos

| Status | Descrição |
|--------|-----------|
| `PENDING_DOCS` | Aguardando cliente fazer upload dos documentos |
| `PROCESSING` | Processamento em andamento (agents 2-8) |
| `COMPLETED` | Processamento concluído com sucesso |
| `ERROR` | Erro durante o processamento |
| `CANCELLED` | Cancelado pelo usuário |

## 🗄️ Tabelas do Banco de Dados

### `monthly_accounting_cycles`

Armazena os ciclos de processamento mensal.

```sql
id: UUID (PK)
client_id: UUID (FK)
reference_month: INTEGER (1-12)
reference_year: INTEGER
status: VARCHAR (PENDING_DOCS, PROCESSING, COMPLETED, ERROR)
processing_log: TEXT
data: JSONB (todos os resultados dos agentes)
created_at: TIMESTAMP
updated_at: TIMESTAMP
```

### `client_monthly_documents`

Documentos enviados pelo cliente.

```sql
id: UUID (PK)
client_id: UUID (FK)
reference_month: INTEGER
reference_year: INTEGER
document_type: VARCHAR (nfe_emitida, nfe_recebida, folha_pagamento, etc)
file_name: VARCHAR
file_path: VARCHAR
file_size: INTEGER
status: VARCHAR (UPLOADED, VALIDATED, ERROR)
uploaded_at: TIMESTAMP
```

### `client_nfe_data`

Dados extraídos das NFes.

```sql
id: UUID (PK)
client_id: UUID (FK)
reference_month: INTEGER
reference_year: INTEGER
nfe_type: VARCHAR (EMITIDA, RECEBIDA)
nfe_key: VARCHAR(44)
nfe_number: VARCHAR
nfe_date: DATE
partner_name: VARCHAR
partner_cnpj: VARCHAR(14)
total_value: DECIMAL
valor_icms: DECIMAL
valor_pis: DECIMAL
valor_cofins: DECIMAL
cfop: VARCHAR
created_at: TIMESTAMP
```

## 🧪 Testando o Orchestrator

Execute o script de teste completo:

```bash
cd backend-node
npx ts-node scripts/test-orchestrator.ts
```

Este script:
1. ✅ Cria cliente de teste (Sorveteria com 8 funcionários)
2. ✅ Cria configuração contábil (Simples Nacional - Anexo III)
3. ✅ Inicia processamento mensal
4. ✅ Simula upload de 3 NFes emitidas + 2 recebidas + folha de pagamento
5. ✅ Executa todos os 8 agentes
6. ✅ Mostra resultados detalhados

## ⚠️ Requisitos Importantes

### 1. Configuração do Cliente

Antes de processar, o cliente DEVE ter:
- ✅ Cadastro completo na tabela `clients`
- ✅ Configuração contábil aprovada em `client_accounting_config`
- ✅ Status `APPROVED` pelo contador

### 2. Variáveis de Ambiente

```env
# API Key da Anthropic (Claude)
ANTHROPIC_API_KEY=sk-ant-...

# Banco de dados
DATABASE_URL=postgresql://...
```

### 3. Dependências

```bash
npm install xml2js pdfkit multer node-cron
npm install @types/xml2js @types/pdfkit @types/multer @types/node-cron
```

## 🔧 Troubleshooting

### Problema: "Cliente não possui configuração contábil"

**Solução:** Contador precisa aprovar a configuração primeiro na página `/contador/notificacoes/:id`

### Problema: "Documentos incompletos"

**Solução:** Cliente precisa enviar TODOS os documentos obrigatórios marcados como `mandatory: true`

### Problema: "Lançamentos contábeis não balanceados"

**Solução:** Bug no Agent 7 (Accounting Journal). Revisar lógica de débitos/créditos.

### Problema: "NFe XML inválido"

**Solução:** Verificar se o XML está bem formado e segue o padrão NFe 4.0.

## 📈 Métricas e Logs

O Orchestrator loga todas as etapas no console:

```
===============================================================================
🎯 INICIANDO PROCESSAMENTO MENSAL
Cliente: uuid-123
Período: 11/2025
===============================================================================

📋 STEP 1: Buscando configuração do cliente...
✅ Configuração encontrada: Regime SIMPLES_NACIONAL

📋 STEP 2: Solicitando documentos necessários...
✅ 6 tipos de documentos solicitados

... (continua para todos os steps)

===============================================================================
✅ PROCESSAMENTO CONCLUÍDO COM SUCESSO!
===============================================================================
```

## 🚨 Zero-Error Principle

O sistema foi projetado para **ZERO ERROS** em cálculos fiscais. Para garantir isso:

1. ✅ Tabelas de impostos hardcoded (não são geradas por IA)
2. ✅ Validação dupla com Final Validator
3. ✅ Lançamentos contábeis balanceados
4. ✅ Conferência de totais (NFes vs Impostos)
5. ✅ Logs detalhados de cada etapa

## 📞 Suporte

Em caso de dúvidas ou problemas:
1. Verificar logs do console
2. Consultar tabela `monthly_accounting_cycles` no banco
3. Revisar documentação dos agentes em `/src/services/agents/monthly/`

---

**Versão:** 1.0.0
**Última atualização:** Dezembro 2025
**Autor:** Sistema Contabilidade AI
