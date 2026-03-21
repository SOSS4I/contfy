# Backend Node.js - Contabilidade AI

Backend em Node.js/TypeScript com Express e Prisma ORM para o sistema de contabilidade.

## 🚀 Stack Tecnológica

- **Node.js** - Runtime JavaScript
- **TypeScript** - Tipagem estática
- **Express** - Framework web
- **Prisma ORM** - Database ORM
- **PostgreSQL (Supabase)** - Banco de dados
- **bcrypt** - Hash de senhas
- **CORS** - Segurança de requisições

## 📦 Instalação

```bash
npm install
```

## 🔧 Configuração

Crie um arquivo `.env` na raiz do projeto:

```env
PORT=8000
DATABASE_URL="postgresql://postgres:password@host:5432/database"
JWT_SECRET="seu-segredo-aqui"
NODE_ENV="development"
```

## 🗄️ Database

### Gerar Prisma Client
```bash
npx prisma generate
```

### Sincronizar schema com banco
```bash
npx prisma db push
```

### Visualizar banco de dados
```bash
npx prisma studio
```

## 🏃 Executar

### Desenvolvimento (com hot reload)
```bash
npm run dev
```

### Produção
```bash
npm run build
npm start
```

## 📡 Endpoints

### Health Check
- `GET /api/v1/health` - Status do servidor

### Clientes
- `GET /api/v1/clientes` - Listar clientes
  - Query params: `?page=1&limit=100&search=texto&email=email@example.com`
- `GET /api/v1/clientes/:id` - Buscar cliente por ID
- `POST /api/v1/clientes` - Criar cliente
- `PUT /api/v1/clientes/:id` - Atualizar cliente
- `DELETE /api/v1/clientes/:id` - Deletar cliente

### Contadores
- `POST /api/v1/contadores` - Criar contador (gera código único de 6 dígitos)
- `GET /api/v1/contadores/codigo/:codigo` - Buscar contador por código
- `POST /api/v1/contadores/vincular?client_id=123` - Vincular cliente ao contador

### Documentos
- `GET /api/v1/documentos` - Listar documentos
  - Query params: `?client_id=123&tipo=NFE&status=PROCESSED`
- `GET /api/v1/documentos/:id` - Buscar documento por ID
- `POST /api/v1/documentos` - Criar documento
- `DELETE /api/v1/documentos/:id` - Deletar documento

## 🧪 Testes

Executar suite de testes:
```bash
node test-completo.js
```

Testar integração com frontend:
```bash
node test-frontend-integration.js
```

## 📁 Estrutura do Projeto

```
backend-node/
├── prisma/
│   └── schema.prisma          # Schema do banco de dados
├── src/
│   ├── controllers/           # Lógica de negócio
│   │   ├── clientes.controller.ts
│   │   ├── contadores.controller.ts
│   │   └── documentos.controller.ts
│   ├── routes/                # Rotas da API
│   │   ├── clientes.routes.ts
│   │   ├── contadores.routes.ts
│   │   └── documentos.routes.ts
│   ├── utils/                 # Utilitários
│   │   ├── prisma.ts         # Cliente Prisma
│   │   └── auth.ts           # Funções de autenticação
│   └── index.ts              # Entrada da aplicação
├── .env                       # Variáveis de ambiente
├── package.json
├── tsconfig.json
└── README.md
```

## 🔐 Segurança

- Senhas hasheadas com bcrypt (salt rounds: 10)
- CORS configurado para localhost:3000 e localhost:3001
- Validação de dados nos endpoints
- Códigos únicos de contador (6 dígitos numéricos)

## 🎯 Funcionalidades Implementadas

- ✅ CRUD completo de clientes
- ✅ Registro de contadores com código único
- ✅ Vinculação cliente-contador via código
- ✅ Gerenciamento de documentos
- ✅ Filtros e busca avançada
- ✅ Paginação
- ✅ Integração com Supabase PostgreSQL
- ✅ Timestamps automáticos
- ✅ Relacionamentos entre entidades

## 📊 Status

✅ **100% FUNCIONAL** - Todos os 26 testes passando

- Health check: ✅
- Listar clientes: ✅
- Buscar por email (login): ✅
- Criar cliente: ✅
- Buscar por ID: ✅
- Criar contador: ✅
- Buscar contador por código: ✅
- Vincular cliente-contador: ✅
- Listar documentos: ✅

## 🔄 Migração do Python

Este backend substitui completamente o backend Python anterior, mantendo 100% de compatibilidade com o frontend existente.

## 📝 Licença

Proprietário - Contabilidade AI © 2024
