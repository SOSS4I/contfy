# Frontend - Contabilidade AI

Interface web moderna para a plataforma de contabilidade automatizada com IA.

## Tecnologias

- **Next.js 14** - Framework React com SSR
- **TypeScript** - Type safety
- **TailwindCSS** - Styling moderno
- **Recharts** - Gráficos e visualizações
- **React Icons** - Ícones
- **Axios** - HTTP client

## Instalação Rápida

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Abrir http://localhost:3000
```

## Estrutura

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx         # Layout principal
│   │   ├── page.tsx           # Dashboard
│   │   └── globals.css        # Estilos globais
│   │
│   ├── components/            # Componentes React
│   │   ├── Sidebar.tsx        # Menu lateral
│   │   ├── Header.tsx         # Cabeçalho
│   │   ├── StatsCard.tsx      # Card de estatísticas
│   │   ├── TaxChart.tsx       # Gráfico de impostos
│   │   ├── AgentStatus.tsx    # Status dos agentes
│   │   └── RecentDocuments.tsx # Documentos recentes
│   │
│   └── services/              # Serviços API (futuro)
│
├── public/                    # Assets estáticos
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── next.config.js
```

## Páginas Implementadas

### ✅ Dashboard (`/`)
- Estatísticas principais (clientes, documentos, impostos, declarações)
- Gráfico de evolução mensal
- Status dos agentes de IA em tempo real
- Tabela de documentos recentes

### ⏳ Clientes (`/clientes`) - Em breve
- Lista de clientes
- Cadastro e edição
- Detalhes do cliente
- Histórico de documentos e impostos

### ⏳ Documentos (`/documentos`) - Em breve
- Upload com drag-and-drop
- Visualização de documentos
- Status de processamento
- Filtros avançados

### ⏳ Impostos (`/impostos`) - Em breve
- Cálculos mensais
- Histórico de pagamentos
- Download de DAS
- Projeções

### ⏳ Declarações (`/declaracoes`) - Em breve
- Lista de declarações
- Download de XMLs
- Status de transmissão
- Histórico

### ⏳ Chat IA (`/chat`) - Em breve
- Interface de conversação
- Histórico de mensagens
- Sugestões inteligentes
- Upload de documentos via chat

### ⏳ Agentes (`/agentes`) - Em breve
- Dashboard de monitoramento
- Logs detalhados
- Métricas de performance
- Configurações

### ⏳ Configurações (`/configuracoes`) - Em breve
- Perfil do usuário
- Preferências
- Integrações
- Segurança

## Componentes

### Layout
- **Sidebar** - Menu de navegação lateral fixo
- **Header** - Barra superior com busca e notificações
- **Layout** - Container principal responsivo

### Dashboard
- **StatsCard** - Card de estatística com ícone, valor e trend
- **TaxChart** - Gráfico de linha (receita vs impostos)
- **AgentStatus** - Lista de agentes com status em tempo real
- **RecentDocuments** - Tabela de documentos recentes

## Customização

### Cores
Edite `tailwind.config.js`:
```js
colors: {
  primary: { ... },  // Cor principal
  success: { ... },  // Verde (sucesso)
  warning: { ... },  // Amarelo (atenção)
  danger: { ... },   // Vermelho (erro)
}
```

### Logo
1. Adicione `logo.png` em `public/`
2. Edite `Sidebar.tsx` para usar a imagem

### Textos
Todos os textos estão nos componentes em `src/components/`

## Scripts

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Iniciar produção
npm start

# Lint
npm run lint
```

## Integração com Backend

O frontend se comunica com o backend Python via API REST.

**URL da API**: `http://localhost:8000/api/v1`

### Configuração
Edite `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### Exemplo de chamada
```typescript
import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL
})

// Listar documentos
const documents = await api.get('/documents')
```

## Deploy

### Vercel (Recomendado)
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Docker
```bash
# Build
docker build -t contabilidade-frontend .

# Run
docker run -p 3000:3000 contabilidade-frontend
```

### Build manual
```bash
npm run build
npm start
```

## Performance

- Server-Side Rendering (SSR)
- Static Generation quando possível
- Image optimization automática
- Code splitting
- CSS purging (TailwindCSS)

## Acessibilidade

- Semantic HTML
- ARIA labels
- Keyboard navigation
- Screen reader friendly
- Color contrast WCAG AA

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Desenvolvimento

### Hot Reload
Salvando um arquivo, o browser recarrega automaticamente.

### TypeScript
Type checking em tempo real.

### Linting
ESLint configurado com regras Next.js.

## Contribuindo

1. Crie uma branch feature
2. Implemente as mudanças
3. Teste localmente
4. Abra um pull request

---

**Frontend criado com ❤️ usando Next.js e TailwindCSS**
