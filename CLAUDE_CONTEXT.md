# InkStudio — Contexto para Claude Code

Este documento contém todo o contexto necessário para o desenvolvimento do projeto InkStudio. Leia todo o documento antes de começar a implementar qualquer coisa.

---

## 1. O QUE É O PROJETO

Sistema de gestão para tatuadores e estúdios de tatuagem. Permite gerenciar clientes, procedimentos, sessões, financeiro e calculadora de custos. Também possui um sistema de sugestão de valores usando similaridade e um modelo ML (CatBoost) por tatuador.

Dois planos futuros:
- **Autônomo** — um único usuário por conta (foco inicial do MVP)
- **Estúdio** — múltiplos usuários por conta com roles

Fase atual: MVP voltado para o plano Autônomo, com 20 tatuadores testando gratuitamente.

---

## 2. STACK COMPLETA

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 14+ com App Router + TypeScript |
| Backend | NestJS + TypeScript |
| Banco de Dados | PostgreSQL |
| ORM | Prisma |
| Autenticação | Better-Auth |
| Estado do servidor | React Query (TanStack Query) |
| Estado global (UI) | Zustand |
| Formulários | React Hook Form |
| Validação | Zod |
| Estilo | Tailwind CSS |
| Hospedagem | VPS Hostinger KVM 2 (Ubuntu 22.04 LTS) |
| Infraestrutura | Docker + Docker Compose |
| Reverse Proxy | Nginx |
| Deploy | GitHub Actions |
| Email | Resend (futuro) |
| Gerenciador de pacotes | npm |

---

## 3. ARQUITETURA

### 3.1 Multi-Tenant

Cada usuário ou estúdio possui um `tenant_id` único. Todos os dados são isolados por esse ID. Nenhum tenant consegue ver os dados de outro.

### 3.2 Modelo de Negócio

- **Autônomo com espaço próprio:** Paga aluguel e custos gerais do espaço
- **Autônomo guest:** Trabalha em estúdios de terceiros, pagando um percentual do valor da tatuagem para o dono do local. Pode trabalhar em múltiplos estúdios. Os estúdios onde ele trabalha podem ou não estar cadastrados na plataforma.
- **Estúdio (futuro):** Tem um dono, funcionários (tatuadores) e staff (pessoa que faz orçamentos e atendimento). Cobra um percentual padrão de todos os tatuadores, mas pode haver benefícios individuais que sobrescrevem esse percentual.

### 3.3 Autenticação

- Login com email/senha ou OAuth com Google
- Validação de email obrigatória para login com senha
- Reset de senha via email
- No plano Autônomo: um usuário por tenant
- No plano Estúdio (futuro): múltiplos usuários por tenant com roles

### 3.4 Sistema de Sugestão de Valores

Duas formas de sugerir valores para orçamentos:

1. **Por similaridade:** Busca no banco de dados procedimentos cadastrados anteriormente com parâmetros parecidos (tamanho, complexidade, local do corpo) e sugere um valor baseado nessa similaridade.
2. **Por modelo ML (CatBoost):** Cada tatuador tem seu próprio modelo, treinado automaticamente uma vez por semana usando os dados históricos de suas sessões.

Os parâmetros usados são:
- Tamanho da tatuagem
- Complexidade
- Local do corpo

---

## 4. CONVENÇÕES

- **Idioma do código:** Inglês para nomes de funções, métodos, variáveis e estrutura
- **Idioma do domínio:** Português para comentários e labels voltados ao usuário
- **Valores monetários:** Salvos em centavos (número inteiro) no banco. Exemplo: R$ 1.500,00 = 150000
- **Formato de moeda na UI:** R$ 1.500,00
- **Formato de datas na UI:** DD/MM/YYYY
- **Tema visual:** Dark mode (padrão)
- **Cores primárias:** Vermelho/rosa para ações e destaques, amarelo/laranja para valores e highlights

---

## 5. ESTRUTURA DO BACKEND

```
backend/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── app.controller.ts
│   ├── app.service.ts
│   │
│   ├── common/
│   │   ├── decorators/
│   │   └── guards/
│   │
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   │
│   ├── auth/
│   │   ├── dto/
│   │   │   ├── register.dto.ts
│   │   │   ├── login.dto.ts
│   │   │   ├── reset-password.dto.ts
│   │   │   └── auth-response.dto.ts
│   │   ├── strategies/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   └── auth.service.ts
│   │
│   ├── tenants/
│   │   ├── dto/
│   │   │   ├── create-tenant.dto.ts
│   │   │   ├── update-tenant.dto.ts
│   │   │   └── tenant-response.dto.ts
│   │   ├── tenants.module.ts
│   │   ├── tenants.controller.ts
│   │   └── tenants.service.ts
│   │
│   ├── clients/
│   │   ├── dto/
│   │   │   ├── create-client.dto.ts
│   │   │   ├── update-client.dto.ts
│   │   │   └── client-response.dto.ts
│   │   ├── clients.module.ts
│   │   ├── clients.controller.ts
│   │   └── clients.service.ts
│   │
│   ├── procedures/
│   │   ├── dto/
│   │   │   ├── create-procedure.dto.ts
│   │   │   ├── update-procedure.dto.ts
│   │   │   └── procedure-response.dto.ts
│   │   ├── procedures.module.ts
│   │   ├── procedures.controller.ts
│   │   └── procedures.service.ts
│   │
│   ├── sessions/
│   │   ├── dto/
│   │   │   ├── create-session.dto.ts
│   │   │   ├── update-session.dto.ts
│   │   │   └── session-response.dto.ts
│   │   ├── sessions.module.ts
│   │   ├── sessions.controller.ts
│   │   └── sessions.service.ts
│   │
│   ├── financial/
│   │   ├── dto/
│   │   │   ├── create-transaction.dto.ts
│   │   │   ├── update-transaction.dto.ts
│   │   │   └── transaction-response.dto.ts
│   │   ├── financial.module.ts
│   │   ├── financial.controller.ts
│   │   └── financial.service.ts
│   │
│   ├── calculator/
│   │   ├── dto/
│   │   │   ├── create-cost.dto.ts
│   │   │   ├── update-cost.dto.ts
│   │   │   └── calculator-response.dto.ts
│   │   ├── calculator.module.ts
│   │   ├── calculator.controller.ts
│   │   └── calculator.service.ts
│   │
│   └── ml/
│       ├── dto/
│       │   ├── predict.dto.ts
│       │   └── prediction-response.dto.ts
│       ├── ml.module.ts
│       ├── ml.controller.ts
│       └── ml.service.ts
│
├── prisma.config.ts
├── package.json
└── package-lock.json
```

### Padrão de cada módulo

Cada módulo segue a mesma estrutura:
- **module.ts** — declara o módulo, importações e dependências
- **controller.ts** — recebe as requisições HTTP, define as rotas
- **service.ts** — contém a lógica de negócio e interagência com o Prisma
- **dto/** — define o que entra e o que sai da API

Exceções:
- `auth` não tem update DTO porque o fluxo dele é diferente (register, login, reset)
- `ml` só tem predict DTO porque os dados de treino são extraídos automaticamente das sessões

---

## 6. ESTRUTURA DO FRONTEND

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   └── reset-password/
│   │   │       └── page.tsx
│   │   └── (dashboard)/
│   │       ├── layout.tsx
│   │       ├── dashboard/
│   │       │   └── page.tsx
│   │       ├── clients/
│   │       │   ├── page.tsx
│   │       │   └── [id]/
│   │       │       └── page.tsx
│   │       ├── procedures/
│   │       │   └── page.tsx
│   │       ├── calculator/
│   │       │   └── page.tsx
│   │       └── financial/
│   │           └── page.tsx
│   │
│   ├── components/
│   │   ├── ui/
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── modal.tsx
│   │   │   └── table.tsx
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   └── main-nav.tsx
│   │   └── charts/
│   │       ├── line-chart.tsx
│   │       ├── donut-chart.tsx
│   │       └── bar-chart.tsx
│   │
│   ├── hooks/
│   │   ├── use-auth.ts
│   │   ├── use-clients.ts
│   │   ├── use-procedures.ts
│   │   ├── use-sessions.ts
│   │   ├── use-financial.ts
│   │   └── use-calculator.ts
│   │
│   ├── services/
│   │   ├── api.ts
│   │   ├── auth.service.ts
│   │   ├── clients.service.ts
│   │   ├── procedures.service.ts
│   │   ├── sessions.service.ts
│   │   ├── financial.service.ts
│   │   └── calculator.service.ts
│   │
│   ├── types/
│   │   ├── auth.types.ts
│   │   ├── client.types.ts
│   │   ├── procedure.types.ts
│   │   ├── session.types.ts
│   │   ├── financial.types.ts
│   │   └── calculator.types.ts
│   │
│   └── utils/
│       ├── format-currency.ts
│       ├── format-date.ts
│       └── constants.ts
│
├── public/
│   └── icons/
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── package.json
└── package-lock.json
```

### Como as camadas se comunicam

```
Page (page.tsx)
  └── usa Hook (use-clients.ts)
        ├── gerencia estado do servidor com React Query
        ├── gerencia estado global com Zustand (usuário logado, tema)
        ├── valida formulários com React Hook Form + Zod
        └── chama Service (clients.service.ts)
              └── faz chamada HTTP para o Backend (NestJS)
```

### Route Groups explicados

- `(auth)` — rotas de autenticação sem layout do dashboard (login, registro, reset)
- `(dashboard)` — rotas protegidas com layout completo (sidebar + header)

Os parênteses não criam URL, são apenas para organizar layouts diferentes.

---

## 7. SCHEMA DO PRISMA

O schema completo está no arquivo `backend/prisma/schema.prisma`. Resumo dos modelos:

| Modelo | Responsabilidade |
|---|---|
| Tenant | Conta principal (autônomo ou estúdio) |
| User | Usuário do sistema |
| AuthCredential | Credenciais (senha ou OAuth) |
| AuthSession | Sessões de autenticação |
| StudioConfig | Configurações do estúdio (percentual padrão) |
| TatuadorBenefit | Benefícios individuais de tatuadores |
| GuestLocation | Estúdios onde o autônomo faz guest |
| Client | Cliente da tatuagem |
| Procedure | Tipo de tatuagem cadastrado |
| TattooSession | Sessão de tatuagem realizada |
| Transaction | Lançamento financeiro |
| FixedCost | Custos fixos mensais |
| VariableCost | Custos variáveis mensais |
| WorkSettings | Horas trabalhadas e margem de lucro |
| MLTrainingData | Dados de treino do modelo |
| MLModel | Modelo CatBoost por tatuador |
| MLPrediction | Histórico de predições |

Convenção importante: todos os valores monetários são salvos em centavos (Int). Exemplo: R$ 1.500,00 = 150000.

---

## 8. MÓDULOS DO SISTEMA

### Dashboard
- Faturamento mensal (gráfico de linha)
- Clientes ativos, procedimentos realizados, ticket médio
- Estilos populares (gráfico donut)
- Procedimentos por tipo (gráfico de barras horizontais)
- Últimos atendimentos

### Clientes
- Listagem com busca e filtros
- Cards com dados de contato
- Sessões realizadas, última visita, total gasto
- Perfil individual do cliente

### Procedimentos
- Tipos de tatuagem cadastrados
- Estatísticas: sessões, receita, tempo médio, preço médio, popularidade
- Ranking dos mais realizados do mês

### Calculadora de Custos
- Custos fixos e variáveis mensais
- Horas trabalhadas e margem de lucro
- Cálculo automático de preço mínimo por hora
- Referência rápida por duração de sessão

### Financeiro
- Resumo: entradas, saídas, saldo, pró-labore, investimento, fluxo final
- Planilha de lançamentos
- Categorias: Tattoo, Material, Fixo, Marketing, Pró-labore, Investimento
- Formas de pagamento: PIX, Cartão de Crédito, Cartão de Débito, Boleto, Dinheiro, Débito Auto

---

## 9. ENUMS IMPORTANTES

### TattooSize
```
SMALL       — até 7cm
MEDIUM      — 7cm a 10cm
LARGE       — 10cm a 15cm
EXTRA_LARGE — 15cm a 20cm
XLARGE      — 20cm a 40cm
FULL_BODY   — mais de 40cm
```

### TattooComplexity
```
LOW       — Baixa
MEDIUM    — Média
HIGH      — Alta
VERY_HIGH — Muito alta
```

### UserRole
```
OWNER    — Dono do estúdio ou o próprio autônomo
STAFF    — Funcionário geral (orçamentos, atendimento)
EMPLOYEE — Tatuador funcionário do estúdio
```

---

## 10. INSTRUÇÕES PARA O CLAUDE CODE

- Nunca modifique o schema.prisma sem antes consultar o contexto completo deste documento
- Valores monetários sempre em centavos no banco
- Sempre use tenant_id para isolamento de dados em todas as queries
- Os hooks do frontend sempre usam React Query para dados da API
- Validação de formulários sempre com React Hook Form + Zod
- Estado global (usuário logado, tema) usa Zustand
- Componentes de UI seguem tema dark mode
- Labels e textos voltados ao usuário em Português
- Código e nomes de funções em Inglês