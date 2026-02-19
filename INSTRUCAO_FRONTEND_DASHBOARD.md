# InkStudio — Plano de Implementação do Frontend (Dashboard)

Leia o arquivo `CLAUDE_CONTEXT.md` antes de começar qualquer implementação.

---

## ESTADO ATUAL

**Já implementado:**
- Autenticação completa (login, register, reset-password, verify-email)
- Layout base: `sidebar.tsx`, `header.tsx`, `(dashboard)/layout.tsx` com drawer mobile
- UI: `button.tsx`, `input.tsx`
- Dashboard page (placeholder com valores zerados)
- Skeleton pages para clients, procedures, financial, calculator

**Arquivos placeholder (só têm comentário — precisam ser implementados):**
- `components/ui/card.tsx`, `modal.tsx`, `table.tsx`
- Todos os hooks: use-clients, use-procedures, use-sessions, use-financial, use-calculator
- Todos os services: clients, procedures, sessions, financial, calculator
- Todos os types: client, procedure, session, financial, calculator
- Todos os utils: format-currency, format-date, constants
- Todos os charts: line-chart, donut-chart, bar-chart
- Todas as páginas do dashboard

---

## CONVENÇÕES QUE DEVEM SER SEGUIDAS

- **Mobile-first:** estilos sem prefixo = mobile, `sm:` ≥640px, `md:` ≥768px, `lg:` ≥1024px
- **Dark mode:** `bg-zinc-950` (fundo geral), `bg-zinc-900` (cards), `border-zinc-800`
- **Cores primárias:** `rose-500`/`rose-600` para ações; `amber-400`/`amber-500` para valores monetários
- **Valores monetários:** backend envia em centavos (ex: 150000 = R$ 1.500,00) — sempre usar `formatCurrency()`
- **Datas:** backend envia ISO string — sempre usar `formatDate()`
- **Tabelas em mobile:** sempre `overflow-x-auto` no wrapper
- **Modais em mobile:** bottom sheet (desliza de baixo) em telas < `sm`, modal centralizado em `sm`+

---

## FASE 1 — FUNDAÇÃO (implementar primeiro, tudo depende disso)

---

### 1.1 Utils

**`utils/format-currency.ts`**
```typescript
export function formatCurrency(valueInCents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valueInCents / 100);
}

export function parseCurrency(formatted: string): number {
  // "R$ 1.500,00" → 150000
  const raw = formatted.replace(/[R$\s.]/g, '').replace(',', '.');
  return Math.round(parseFloat(raw) * 100);
}
```

**`utils/format-date.ts`**
```typescript
export function formatDate(isoString: string): string {
  // → "15/01/2025"
  return new Date(isoString).toLocaleDateString('pt-BR');
}

export function formatDateTime(isoString: string): string {
  // → "15/01/2025 às 14:30"
  return new Date(isoString).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export function formatRelativeDate(isoString: string): string {
  // → "há 3 dias" | "hoje" | "ontem"
  // Usar Intl.RelativeTimeFormat
}
```

**`utils/constants.ts`**
```typescript
export const TATTOO_SIZE_LABELS: Record<string, string> = {
  SMALL: 'Pequena (até 7cm)',
  MEDIUM: 'Média (7–10cm)',
  LARGE: 'Grande (10–15cm)',
  EXTRA_LARGE: 'Extra Grande (15–20cm)',
  XLARGE: 'XL (20–40cm)',
  FULL_BODY: 'Full Body (40cm+)',
};

export const TATTOO_COMPLEXITY_LABELS: Record<string, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
  VERY_HIGH: 'Muito Alta',
};

export const BODY_LOCATION_LABELS: Record<string, string> = {
  ARM: 'Braço', FOREARM: 'Antebraço', HAND: 'Mão', FINGER: 'Dedo',
  UPPER_BACK: 'Costas Superior', LOWER_BACK: 'Costas Inferior',
  FULL_BACK: 'Costas Inteiras', CHEST: 'Peito', ABDOMEN: 'Abdômen',
  SHOULDER: 'Ombro', NECK: 'Pescoço', FACE: 'Rosto', HEAD: 'Cabeça',
  THIGH: 'Coxa', CALF: 'Panturrilha', FOOT: 'Pé', RIB: 'Costela',
  INNER_ARM: 'Parte Interna do Braço', WRIST: 'Pulso',
  ANKLE: 'Tornozelo', OTHER: 'Outro',
};

export const TRANSACTION_CATEGORY_LABELS: Record<string, string> = {
  TATTOO: 'Tatuagem', MATERIAL: 'Material', FIXED: 'Fixo',
  MARKETING: 'Marketing', PRO_LABORE: 'Pró-labore',
  INVESTMENT: 'Investimento', OTHER: 'Outros',
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  PIX: 'PIX', CREDIT_CARD: 'Cartão de Crédito',
  DEBIT_CARD: 'Cartão de Débito', BOLETO: 'Boleto', CASH: 'Dinheiro',
};
```

---

### 1.2 Types

**`types/client.types.ts`**
```typescript
export interface Client {
  id: string;
  tenantId: string;
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Agregados retornados pela API
  sessionCount?: number;
  totalSpent?: number;   // em centavos
  lastVisit?: string;
}

export interface CreateClientData {
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export type UpdateClientData = Partial<CreateClientData>;
```

**`types/procedure.types.ts`**
```typescript
export type TattooSize = 'SMALL' | 'MEDIUM' | 'LARGE' | 'EXTRA_LARGE' | 'XLARGE' | 'FULL_BODY';
export type TattooComplexity = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
export type BodyLocation = 'ARM' | 'FOREARM' | 'HAND' | 'FINGER' | 'UPPER_BACK' |
  'LOWER_BACK' | 'FULL_BACK' | 'CHEST' | 'ABDOMEN' | 'SHOULDER' | 'NECK' |
  'FACE' | 'HEAD' | 'THIGH' | 'CALF' | 'FOOT' | 'RIB' | 'INNER_ARM' |
  'WRIST' | 'ANKLE' | 'OTHER';

export interface Procedure {
  id: string;
  tenantId: string;
  userId: string;
  name: string;
  description?: string;
  size: TattooSize;
  complexity: TattooComplexity;
  bodyLocation: BodyLocation;
  finalPrice: number;    // em centavos
  duration: number;      // em minutos
  createdAt: string;
  updatedAt: string;
  sessionCount?: number;
}

export interface CreateProcedureData {
  name: string;
  description?: string;
  size: TattooSize;
  complexity: TattooComplexity;
  bodyLocation: BodyLocation;
  finalPrice: number;    // em centavos
  duration: number;
}

export type UpdateProcedureData = Partial<CreateProcedureData>;
```

**`types/session.types.ts`**
```typescript
import { TattooSize, TattooComplexity, BodyLocation } from './procedure.types';

export interface TattooSession {
  id: string;
  tenantId: string;
  clientId: string;
  userId: string;
  procedureId?: string;
  size: TattooSize;
  complexity: TattooComplexity;
  bodyLocation: BodyLocation;
  description?: string;
  finalPrice: number;        // em centavos
  guestLocationId?: string;
  studioPercentage?: number;
  studioFee?: number;        // em centavos
  tatuadorRevenue?: number;  // em centavos
  duration?: number;         // em minutos
  date: string;
  createdAt: string;
  updatedAt: string;
  // Relações incluídas
  client?: { id: string; name: string };
  user?: { id: string; name: string };
  procedure?: { id: string; name: string };
}

export interface CreateSessionData {
  clientId: string;
  userId: string;
  procedureId?: string;
  size: TattooSize;
  complexity: TattooComplexity;
  bodyLocation: BodyLocation;
  description?: string;
  finalPrice: number;
  guestLocationId?: string;
  studioPercentage?: number;
  duration?: number;
  date: string;
}

export type UpdateSessionData = Partial<CreateSessionData>;
```

**`types/financial.types.ts`**
```typescript
export type TransactionType = 'INCOME' | 'EXPENSE';
export type TransactionCategory = 'TATTOO' | 'MATERIAL' | 'FIXED' | 'MARKETING' | 'PRO_LABORE' | 'INVESTMENT' | 'OTHER';
export type PaymentMethod = 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'BOLETO' | 'CASH';

export interface Transaction {
  id: string;
  tenantId: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;          // em centavos
  paymentMethod?: PaymentMethod;
  clientId?: string;
  sessionId?: string;
  description?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
  client?: { id: string; name: string };
}

export interface FinancialSummary {
  totalIncome: number;   // em centavos
  totalExpense: number;  // em centavos
  balance: number;       // em centavos
}

export interface CreateTransactionData {
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  paymentMethod?: PaymentMethod;
  clientId?: string;
  description?: string;
  date: string;
}

export type UpdateTransactionData = Partial<CreateTransactionData>;
```

**`types/calculator.types.ts`**
```typescript
export type CostType = 'fixed' | 'variable';

export interface Cost {
  id: string;
  name: string;
  amount: number;  // em centavos
}

export interface CalculatorResult {
  fixedCosts: Cost[];
  variableCosts: Cost[];
  totalFixedCosts: number;
  totalVariableCosts: number;
  totalCosts: number;
  hoursPerMonth: number;
  profitMargin: number;
  costPerHour: number;
  minimumPricePerHour: number;
  quickReference: { hours: number; minimumPrice: number }[];
}

export interface CreateCostData {
  name: string;
  amount: number;
  type: CostType;
}

export interface WorkSettingsData {
  hoursPerMonth: number;
  profitMargin: number;
}
```

---

### 1.3 Services

**`services/clients.service.ts`**
```typescript
import api from './api';
import { Client, CreateClientData, UpdateClientData } from '@/types/client.types';

export const clientsService = {
  async getAll(): Promise<Client[]> {
    const res = await api.get<Client[]>('/clients');
    return res.data;
  },
  async getById(id: string): Promise<Client> {
    const res = await api.get<Client>(`/clients/${id}`);
    return res.data;
  },
  async create(data: CreateClientData): Promise<Client> {
    const res = await api.post<Client>('/clients', data);
    return res.data;
  },
  async update(id: string, data: UpdateClientData): Promise<Client> {
    const res = await api.patch<Client>(`/clients/${id}`, data);
    return res.data;
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/clients/${id}`);
  },
};
```

**`services/procedures.service.ts`** — mesmo padrão, rota `/procedures`

**`services/sessions.service.ts`** — mesmo padrão, rota `/sessions`

**`services/financial.service.ts`**
```typescript
// Métodos adicionais além do CRUD:
async getSummary(): Promise<FinancialSummary>  // GET /financial/summary
async getAll(params?: { type?, category?, startDate?, endDate? })
```

**`services/calculator.service.ts`**
```typescript
async calculate(): Promise<CalculatorResult>          // GET /calculator
async addCost(data, type): Promise<Cost>              // POST /calculator/costs?type=fixed|variable
async updateCost(id, data, type): Promise<Cost>       // PATCH /calculator/costs/:id?type=...
async removeCost(id, type): Promise<void>             // DELETE /calculator/costs/:id?type=...
async setWorkSettings(data): Promise<void>            // POST /calculator/settings
```

---

### 1.4 Hooks

Padrão de todos os hooks:
```typescript
'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsService } from '@/services/clients.service';

export function useClients() {
  const queryClient = useQueryClient();

  const { data: clients = [], isLoading, error } = useQuery({
    queryKey: ['clients'],
    queryFn: clientsService.getAll,
  });

  const createMutation = useMutation({
    mutationFn: clientsService.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => clientsService.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });

  const removeMutation = useMutation({
    mutationFn: clientsService.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });

  return {
    clients, isLoading, error,
    createClient: createMutation.mutate,
    updateClient: updateMutation.mutate,
    removeClient: removeMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isRemoving: removeMutation.isPending,
  };
}
```

**`hooks/use-clients.ts`** — queryKey: `['clients']`, `['clients', id]`
**`hooks/use-procedures.ts`** — queryKey: `['procedures']`, `['procedures', id]`
**`hooks/use-sessions.ts`** — queryKey: `['sessions']`, `['sessions', id]`
**`hooks/use-financial.ts`** — queryKeys: `['transactions']`, `['financial-summary']`
**`hooks/use-calculator.ts`** — queryKey: `['calculator']`

---

### 1.5 Componentes UI Base

**`components/ui/card.tsx`**
```typescript
// Variantes: default (zinc-900, borda zinc-800) e highlight (com borda rose)
// Props: title?, value?, description?, icon?, trend?, children?
// Usado nos cards de métricas do dashboard
interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}
// Também exportar StatCard para métricas numéricas com ícone e variação %
```

**`components/ui/modal.tsx`**
```typescript
// Mobile: bottom sheet com animação slide-up (translate-y)
// Desktop: modal centralizado com backdrop
// Props: isOpen, onClose, title, children, footer?
// Usar createPortal para renderizar fora da árvore DOM
// Fechar ao pressionar Escape
// Tamanhos: sm (480px), md (640px, padrão), lg (800px)
```

**`components/ui/table.tsx`**
```typescript
// Wrapper com overflow-x-auto
// Componentes: Table, TableHead, TableBody, TableRow, TableCell, TableHeader
// Suporte a coluna de ações (última coluna)
// Estado vazio: slot "empty" com ícone e mensagem
// Estado loading: skeleton rows
```

**`components/ui/select.tsx`** ← CRIAR (não existe, mas é necessário para formulários)
```typescript
// Select customizado com estilo dark
// Props: label, error, options: {value, label}[], ...SelectHTMLAttributes
```

**`components/ui/textarea.tsx`** ← CRIAR (necessário para notas/descrição)
```typescript
// Mesmo estilo do Input mas <textarea>
// Props: label, error, rows?
```

---

## FASE 2 — COMPONENTES UI BASE (implementar antes das páginas)

---

### 2.1 Charts

Usar **Recharts** (já instalado: `"recharts": "^3.7.0"`).

**`components/charts/line-chart.tsx`**
```typescript
// Props: data: { month: string; value: number }[], height?: number
// Eixo Y em reais (formatCurrency)
// Cores: linha rose-500, grid zinc-800, tooltip bg-zinc-900
// ResponsiveContainer para adaptar ao container pai
```

**`components/charts/donut-chart.tsx`**
```typescript
// Props: data: { name: string; value: number; color: string }[]
// Legenda abaixo do gráfico em mobile, ao lado em desktop
// Tooltip com valor em reais
```

**`components/charts/bar-chart.tsx`**
```typescript
// Props: data: { name: string; value: number }[], horizontal?: boolean
// Barras horizontais para ranking de procedimentos
// Barras verticais para comparações mensais
```

---

## FASE 3 — PÁGINAS (implementar módulo por módulo)

---

### 3.1 Dashboard (`app/(dashboard)/dashboard/page.tsx`)

**Layout mobile-first:**
```
[Card Faturamento] [Card Clientes]    ← 1 coluna mobile, 2 sm, 4 lg
[Card Sessões]     [Card Ticket Médio]

[Gráfico Faturamento Mensal]          ← col-span completo
[Últimas Sessões]                     ← tabela com scroll horizontal
```

**Dados necessários:**
- `GET /financial/summary` → faturamento, balanço
- `GET /sessions` → últimas 5 sessões, contagem
- `GET /clients` → total de clientes

**Implementação:**
- Cards de métricas com `StatCard` component
- Gráfico de linha com faturamento dos últimos 6 meses
- Tabela de últimas 5 sessões (cliente, valor, data)
- Loading skeletons enquanto carrega

---

### 3.2 Clientes (`app/(dashboard)/clients/page.tsx`)

**Layout:**
```
[Busca] [+ Novo Cliente]              ← sticky no mobile

[Card Cliente 1]                      ← 1 coluna mobile
[Card Cliente 2]                      ← 2 colunas sm
[Card Cliente 3]                      ← 3 colunas lg
```

**Cards de cliente mostram:**
- Nome + iniciais (avatar gerado)
- Email e telefone (se houver)
- Total de sessões | Última visita | Total gasto

**Funcionalidades:**
- Busca local por nome/email
- Botão "+ Novo Cliente" abre modal
- Clicar no card navega para `/clients/[id]`
- Ações inline: editar (ícone) e deletar (ícone com confirmação)

**Modal de criação/edição:**
- Campos: Nome (obrigatório), Email, Telefone, Notas
- Validação com Zod + React Hook Form
- Submit chama `createClient` ou `updateClient`

---

### 3.3 Detalhe do Cliente (`app/(dashboard)/clients/[id]/page.tsx`)

**Layout:**
```
[← Voltar] [Nome do Cliente] [Editar]

[Card Info]     [Card Estatísticas]   ← 1 col mobile, 2 col md+
  - Email         - Total de sessões
  - Telefone      - Total gasto
  - Desde         - Ticket médio
  - Notas         - Última visita

[Histórico de Sessões]                ← tabela completa
```

**Dados:**
- `GET /clients/:id` → dados do cliente + sessões

---

### 3.4 Procedimentos (`app/(dashboard)/procedures/page.tsx`)

**Layout:**
```
[Busca] [+ Novo Procedimento]

[Tabela de Procedimentos]             ← scroll horizontal no mobile
Colunas: Nome | Tamanho | Complexidade | Local | Preço | Sessões | Ações
```

**Modal de criação/edição:**
- Nome, Descrição (opcional)
- Select: Tamanho, Complexidade, Local do Corpo
- Preço (input com máscara de moeda R$)
- Duração (em minutos)

**Observação importante:** valores monetários são enviados em centavos para a API.
Na UI mostrar R$ e converter antes de enviar: `parseCurrency(value)`.

---

### 3.5 Sessões — CRIAR PÁGINA (`app/(dashboard)/sessions/page.tsx`)

Esta página não existe ainda na estrutura, precisa ser criada.

**Layout:**
```
[Filtros: Mês/Período] [+ Nova Sessão]

[Tabela de Sessões]
Colunas: Data | Cliente | Procedimento | Tamanho | Valor | Ações
```

**Modal de nova sessão:**
- Select: Cliente (busca dos clientes cadastrados)
- Select: Procedimento (opcional — preenche campos automaticamente)
- Select: Tamanho, Complexidade, Local do Corpo
- Data
- Valor final (R$)
- Duração (opcional)
- Descrição (opcional)
- Campos de guest: Local + Percentual do estúdio (opcional)

**Comportamento:** ao selecionar um procedimento, preencher automaticamente
tamanho, complexidade, local e sugerir o preço do procedimento.

---

### 3.6 Financeiro (`app/(dashboard)/financial/page.tsx`)

**Layout:**
```
[Cards Resumo: Entradas | Saídas | Saldo]  ← 1 col, 3 sm+

[Filtros: Período | Tipo | Categoria]

[Tabela de Lançamentos]                    ← scroll horizontal
Colunas: Data | Descrição | Categoria | Forma Pgto | Tipo | Valor | Ações

[+ Novo Lançamento]                        ← botão fixo bottom-right no mobile
```

**Cards de resumo:**
- Entradas: valor em verde (`emerald-500`)
- Saídas: valor em vermelho (`red-500`)
- Saldo: valor em amber (`amber-400`) ou rose se negativo

**Filtros:**
- Período: Este mês (padrão), Mês passado, Últimos 3 meses, Personalizado
- Tipo: Todos, Entrada, Saída
- Categoria: dropdown com todas as categorias

**Modal de novo lançamento:**
- Tipo: radio Entrada/Saída
- Categoria: Select (muda opções conforme tipo)
- Valor (R$)
- Forma de pagamento: Select
- Data
- Descrição (opcional)
- Observação: lançamentos gerados por sessões NÃO podem ser editados/deletados (mostrar badge "Automático")

---

### 3.7 Calculadora (`app/(dashboard)/calculator/page.tsx`)

**Layout:**
```
[Configurações de Trabalho]            ← card com horas/mês e margem de lucro

[Custos Fixos]    [Custos Variáveis]   ← 1 col mobile, 2 col md+
  Lista + Total     Lista + Total
  [+ Adicionar]     [+ Adicionar]

[Resultado do Cálculo]                 ← card destacado
  Custo/hora: R$ XX
  Mínimo/hora (com margem): R$ XX
  Tabela de referência rápida:
    1h → R$ XX | 2h → R$ XX | 3h → R$ XX | 5h → R$ XX
```

**Funcionalidades:**
- Editar horas/mês e margem de lucro inline (sem modal)
- Adicionar/editar/remover custos fixos e variáveis
- Cálculo atualizado automaticamente ao salvar qualquer dado
- Botão "Salvar configurações" — chama `POST /calculator/settings`

---

## FASE 4 — RESPONSIVIDADE MOBILE-FIRST (verificar em cada página)

### Checklist por página:

**Geral:**
- [ ] Padding: `p-4` mobile, `sm:p-6`, `lg:p-8`
- [ ] Títulos de página: `text-xl` mobile, `sm:text-2xl`
- [ ] Botão de ação principal: `w-full` mobile, `sm:w-auto`

**Tabelas:**
- [ ] Wrapper com `overflow-x-auto`
- [ ] Em mobile, considerar ocultar colunas menos importantes (`hidden sm:table-cell`)

**Modais:**
- [ ] Usar classes `fixed inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center`
- [ ] Borda arredondada apenas no topo em mobile: `rounded-t-2xl sm:rounded-xl`
- [ ] Altura máxima em mobile: `max-h-[85vh] overflow-y-auto`

**Formulários em modal:**
- [ ] Campos empilhados (sempre `flex-col` em mobile)
- [ ] Grid de 2 colunas apenas em `sm:` ou maior

**Cards de métricas:**
- [ ] Grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`

**Ações em tabela:**
- [ ] Ícones em vez de texto nos botões de ação
- [ ] Tooltip com `title` attribute nos ícones

---

## FASE 5 — PÁGINA VERIFY-EMAIL (faltando no frontend)

Criar `app/(auth)/verify-email/page.tsx`:

**Estado A — sem token na URL** (após registro):
- Ícone de envelope
- Título: "Verifique seu email"
- Mensagem: "Enviamos um link para {email}. Verifique sua caixa de entrada e spam."
- Botão "Reenviar email" (com cooldown de 60s para evitar spam)
- Link "Voltar para o login"

**Estado B — com token na URL** (clicou no link do email):
- Spinner enquanto valida (`POST /auth/email/verify`)
- Sucesso: salva token no store + redireciona para `/dashboard`
- Erro: mensagem + link "Solicitar novo link"

**Ajuste no `register/page.tsx`:**
- Após registro bem-sucedido, redirecionar para `/verify-email?email={email}` (não para `/dashboard`)

**Ajuste no `login/page.tsx`:**
- Detectar erro 401 com mensagem "Email não verificado"
- Mostrar link "Reenviar email de verificação" abaixo do erro

---

## ORDEM DE IMPLEMENTAÇÃO SUGERIDA

```
Fase 1: Fundação
  1. utils/format-currency.ts
  2. utils/format-date.ts
  3. utils/constants.ts
  4. Todos os types (client, procedure, session, financial, calculator)
  5. Todos os services (clients, procedures, sessions, financial, calculator)
  6. Todos os hooks (use-clients, use-procedures, use-sessions, use-financial, use-calculator)

Fase 2: Componentes UI
  7. components/ui/select.tsx (novo)
  8. components/ui/textarea.tsx (novo)
  9. components/ui/card.tsx
  10. components/ui/table.tsx
  11. components/ui/modal.tsx
  12. components/charts/line-chart.tsx
  13. components/charts/donut-chart.tsx
  14. components/charts/bar-chart.tsx

Fase 3: Autenticação — ajuste pendente
  15. app/(auth)/verify-email/page.tsx (novo)
  16. Ajuste em register/page.tsx (redirect)
  17. Ajuste em login/page.tsx (erro de email não verificado)

Fase 4: Páginas do dashboard (nesta ordem recomendada)
  18. app/(dashboard)/dashboard/page.tsx
  19. app/(dashboard)/clients/page.tsx
  20. app/(dashboard)/clients/[id]/page.tsx
  21. app/(dashboard)/procedures/page.tsx
  22. app/(dashboard)/sessions/page.tsx (nova — criar pasta e arquivo)
  23. app/(dashboard)/financial/page.tsx
  24. app/(dashboard)/calculator/page.tsx
```

---

## DEPENDÊNCIAS JÁ INSTALADAS

```json
"@hookform/resolvers": "^5.2.2",
"@tanstack/react-query": "^5.90.20",
"axios": "^1.13.4",
"next": "16.1.6",
"react-hook-form": "^7.71.1",
"recharts": "^3.7.0",
"zod": "^4.3.6",
"zustand": "^5.0.11"
```

**Instalar antes de começar:**
```bash
npm install lucide-react
```
(já usado em sidebar.tsx mas pode não estar no package.json)

---

## OBSERVAÇÕES FINAIS

- **Sessões** não têm página criada — criar a pasta `app/(dashboard)/sessions/` e o arquivo `page.tsx`
- **Valores monetários:** ao exibir, usar `formatCurrency(valueInCents)`; ao enviar para API, converter de R$ para centavos
- **Lançamentos automáticos:** transações com `sessionId` não devem ter botão de editar/deletar — mostrar badge "Gerado automaticamente"
- **Feedback:** toda mutation deve ter toast/alerta de sucesso e erro — pode usar `alert()` temporariamente e substituir por um sistema de toast depois
- **Query invalidation:** ao criar/editar/deletar qualquer item, invalidar as queries correspondentes para o React Query buscar dados frescos
