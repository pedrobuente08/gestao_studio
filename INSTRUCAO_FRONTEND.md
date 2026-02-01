Leia o arquivo CLAUDE_CONTEXT.md na raiz do projeto antes de começar.

Sua tarefa é criar a estrutura de pastas e instalar as dependências do frontend. Não implemente nenhuma lógica ainda — apenas crie os arquivos vazios e instale os pacotes necessários.

---

## 1. Inicie o projeto Next.js dentro da pasta frontend/

```bash
cd frontend
npx create-next-app@latest . --typescript --tailwind --app-router --src-dir
```

Quando o comando perguntar sobre as opções, selecione:
- TypeScript: Yes
- Tailwind CSS: Yes
- App Router: Yes
- src/ directory: Yes
- import alias (@/*): Yes

---

## 2. Instale as dependências adicionais

```bash
npm install @tanstack/react-query axios
npm install zustand
npm install react-hook-form zod @hookform/resolvers
npm install recharts
npm install --save-dev @types/recharts
```

---

## 3. Crie a estrutura de pastas e arquivos vazios

O create-next-app já cria alguns arquivos por padrão (layout.tsx, page.tsx, globals.css). Não apague eles — apenas adicione os arquivos que faltam abaixo.

Cada arquivo deve estar vazio por enquanto, apenas com um comentário indicando qual módulo ele pertence.

```
frontend/src/
├── app/
│   ├── layout.tsx                          ← já existe (criado pelo create-next-app)
│   ├── page.tsx                            ← já existe, vai ser a página de redirecionamento
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   └── reset-password/
│   │       └── page.tsx
│   └── (dashboard)/
│       ├── layout.tsx
│       ├── dashboard/
│       │   └── page.tsx
│       ├── clients/
│       │   ├── page.tsx
│       │   └── [id]/
│       │       └── page.tsx
│       ├── procedures/
│       │   └── page.tsx
│       ├── calculator/
│       │   └── page.tsx
│       └── financial/
│           └── page.tsx
│
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── modal.tsx
│   │   └── table.tsx
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   └── main-nav.tsx
│   └── charts/
│       ├── line-chart.tsx
│       ├── donut-chart.tsx
│       └── bar-chart.tsx
│
├── hooks/
│   ├── use-auth.ts
│   ├── use-clients.ts
│   ├── use-procedures.ts
│   ├── use-sessions.ts
│   ├── use-financial.ts
│   └── use-calculator.ts
│
├── services/
│   ├── api.ts
│   ├── auth.service.ts
│   ├── clients.service.ts
│   ├── procedures.service.ts
│   ├── sessions.service.ts
│   ├── financial.service.ts
│   └── calculator.service.ts
│
├── types/
│   ├── auth.types.ts
│   ├── client.types.ts
│   ├── procedure.types.ts
│   ├── session.types.ts
│   ├── financial.types.ts
│   └── calculator.types.ts
│
└── utils/
    ├── format-currency.ts
    ├── format-date.ts
    └── constants.ts
```

---

## 4. Crie o arquivo .env.local dentro de frontend/

```
# URL do backend
NEXT_PUBLIC_API_URL=http://localhost:3000
```

---

Não implemente nenhuma lógica. Apenas crie a estrutura e instale os pacotes.