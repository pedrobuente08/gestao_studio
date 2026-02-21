# Plano de Melhorias — Gestão Studio

> Data: 2026-02-21
> Baseado na exploração completa do projeto (frontend + backend)

---

## Item 1 — Corrigir Login com Google

**Problema:** `Runtime TypeError: Load failed` ao tentar autenticar com Google.

### Causa Provável
O Better Auth usa um redirect OAuth que passa pelo frontend via `/oauth-callback`. O erro `Load failed` geralmente indica que o redirect URL retorna 4xx/5xx ou que o `auth-client.ts` tenta carregar algo que não existe antes do redirect concluir.

### Arquivos Envolvidos
- `frontend/src/lib/auth-client.ts` — instância do cliente Better Auth
- `frontend/src/app/(auth)/oauth-callback/page.tsx` — página de callback
- `backend/src/config/better-auth.config.ts` — configuração Google OAuth no backend

### O que fazer

**Backend (`better-auth.config.ts`):**
- Verificar se `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` estão nas variáveis de ambiente
- Verificar se `trustedOrigins` inclui a URL do frontend
- Confirmar que `callbackURL` do Google apontada no Google Cloud Console bate com a rota do Better Auth (`/api/auth/callback/google`)

**Frontend (`auth-client.ts`):**
- Garantir que `baseURL` usa `process.env.NEXT_PUBLIC_API_URL` corretamente
- Verificar se `socialProviders.google` está habilitado no cliente

**Fluxo pós-login Google (novo comportamento):**
- Se usuário fez login com Google **e não tem Tenant criado** (usuário novo via social login) → redirecionar para `/complete-registration`
- A página `/complete-registration` deve coletar: `tenantName` e `tenantType` (AUTONOMO | STUDIO) antes de criar o Tenant

**Nova página a criar:**
- `frontend/src/app/(auth)/complete-registration/page.tsx`
  - Form com: nome da empresa/studio + tipo de conta (AUTONOMO | STUDIO)
  - Ao submeter → `POST /auth/complete-social-registration` (novo endpoint)
  - Após sucesso → redirecionar para `/dashboard`

**Novo endpoint backend:**
- `POST /auth/complete-social-registration` — recebe `{ tenantName, tenantType }` e cria o Tenant para o usuário autenticado via Google (que não passou pelo fluxo de registro normal)

**Lógica do hook `databaseHooks.user.create` no better-auth.config:**
- Atualmente cria Tenant automaticamente na criação do usuário
- Para usuários do Google, o `user.create` é chamado sem `tenantName`
- Solução: no hook, verificar se é social login (ex: verificar se `provider !== 'credential'`) e, em vez de criar o Tenant, marcar o usuário com `status: PENDING_SETUP`
- O `AuthGuard` do backend e o `RouteGuard` do frontend devem checar esse status e redirecionar para `/complete-registration`

---

## Item 2 — Cadastro de Studio: Substituir "Nome" por "Nome da Empresa/Studio"

**Problema:** O form de cadastro pede "Nome" pessoal, mas quem se cadastra como Studio está registrando uma empresa.

### Arquivos Envolvidos
- `frontend/src/app/(auth)/register/page.tsx`
- `backend/src/auth/auth.service.ts` (RegisterDto)
- `backend/src/auth/dto/register.dto.ts` (se existir)

### O que fazer

**Frontend (`register/page.tsx`):**
- O campo `name` atual (nome pessoal do usuário) e `tenantName` (nome do studio) precisam ser redesenhados
- **Proposta de separação clara:**
  - Se tipo = `AUTONOMO`: campo "Seu nome" (nome do profissional)
  - Se tipo = `STUDIO`: campo "Nome da empresa / studio" (sem campo de nome pessoal, pois o owner é a empresa)
- Ajustar label e placeholder condicional ao `tenantType` selecionado
- O campo `name` do usuário (Better Auth) pode ser o mesmo que `tenantName` para STUDIO, ou pode ser "Administrador" por padrão

**Backend (`auth.service.ts`):**
- Atualizar `RegisterDto` para aceitar `studioName` (opcional) e usar no lugar de `name` quando `tenantType === STUDIO`
- Garantir que `tenantName` receba o nome da empresa, não o nome da pessoa

---

## Item 3 — Edição de Perfil do Studio (CNPJ, Endereço, etc.)

**Problema:** O modal de edição de perfil só permite editar nome, idade e gênero — sem campos da empresa.

### Arquivos Envolvidos
- `frontend/src/components/modals/profile-modal.tsx`
- `backend/src/auth/auth.controller.ts`
- `backend/src/auth/auth.service.ts`
- `backend/src/tenants/` (possivelmente inexistente como módulo separado)
- `backend/prisma/schema.prisma` (model Tenant)

### O que fazer

**Schema Prisma (Tenant):**
- Adicionar campos ao model `Tenant`:
  ```
  cnpj        String?
  address     String?
  city        String?
  state       String?
  zipCode     String?
  phone       String?
  website     String?
  ```
- Gerar e rodar migration: `npx prisma migrate dev`

**Backend:**
- Criar ou usar o módulo existente de tenants
- Novo endpoint: `PATCH /auth/tenant` — atualiza dados do Tenant do usuário autenticado
- Validar CNPJ (formato `XX.XXX.XXX/XXXX-XX`)
- Validar CEP (8 dígitos)

**Frontend (`profile-modal.tsx`):**
- Detectar se o usuário é de um tenant do tipo `STUDIO`
- Se for STUDIO, exibir aba/seção adicional "Dados da Empresa" com campos:
  - CNPJ (máscara `XX.XXX.XXX/XXXX-XX`)
  - Endereço (logradouro)
  - Cidade
  - Estado (dropdown com UFs)
  - CEP (máscara `XXXXX-XXX`)
  - Telefone do studio (opcional)
  - Website (opcional)
- Ao salvar, chamar o novo endpoint `PATCH /auth/tenant`
- Usar `useMutation` com invalidação do query `['user']` ou `['tenant']`

---

## Item 4 — Botão de Editar e Excluir Procedimento (Sessions)

**Problema:** Não há botão de editar na tabela de sessões (ou não está funcionando).

### Arquivos Envolvidos
- `frontend/src/app/(dashboard)/sessions/page.tsx`
- `frontend/src/components/modals/session-modal.tsx`
- `frontend/src/hooks/use-sessions.ts`

### O que fazer

**`sessions/page.tsx`:**
- Confirmar/adicionar coluna "Ações" com botões:
  - **Editar** (ícone de lápis): abre `SessionModal` com os dados da sessão preenchidos
  - **Excluir** (ícone de lixeira): abre dialog de confirmação antes de deletar
- Passar `session` como prop ao `SessionModal` para modo de edição

**`session-modal.tsx`:**
- Garantir que o modal aceita prop `initialData?: Session`
- Se `initialData` existir, fazer `reset(initialData)` no useForm e chamar `updateMutation` em vez de `createMutation`
- Preencher corretamente campos condicionais (size, complexity, bodyLocation) para Tatuagem

**`use-sessions.ts`:**
- Confirmar que `updateMutation` e `removeMutation` existem e invalidam corretamente
- `removeMutation.onSuccess` → invalidar `['sessions', 'clients', 'financial-summary', 'transactions']`

**Dialog de Confirmação de Exclusão:**
- Usar componente de modal de confirmação genérico (criar se não existir)
- Texto: "Tem certeza que deseja excluir esta sessão? Esta ação não pode ser desfeita."
- Botões: "Cancelar" e "Excluir" (vermelho)

---

## Item 5 — Botão de Editar e Excluir Cliente

**Problema:** Mesmo padrão do item 4, agora na aba de Clientes.

### Arquivos Envolvidos
- `frontend/src/app/(dashboard)/clients/page.tsx`
- `frontend/src/components/modals/client-modal.tsx`
- `frontend/src/hooks/use-clients.ts`

### O que fazer

**`clients/page.tsx`:**
- Adicionar/confirmar coluna "Ações" com botões Editar e Excluir
- Editar: abre `ClientModal` com dados do cliente preenchidos
- Excluir: dialog de confirmação antes de deletar

**`client-modal.tsx`:**
- Aceitar prop `initialData?: Client`
- Se `initialData` existir, preencher o form e chamar `updateMutation`

**`use-clients.ts`:**
- `removeMutation.onSuccess` → invalidar `['clients', 'sessions']` (pois sessionCount do dashboard pode mudar)

---

## Item 6 — Melhorar Estados de Carregamento (Loading States)

**Problema:** Ao trocar modo na calculadora (AUTONOMOUS ↔ STUDIO_PERCENTAGE), nada indica que está carregando. Campos aparecem antes dos dados chegarem. Em geral, a UX de carregamento é ruim.

### Arquivos Envolvidos
- `frontend/src/app/(dashboard)/calculator/page.tsx`
- `frontend/src/hooks/use-calculator.ts`
- `frontend/src/app/providers.tsx`
- Todos os hooks de dados (`use-sessions`, `use-clients`, `use-financial`)
- `frontend/src/components/ui/` (criar componente Skeleton/Spinner global)

### O que fazer

**Criar componente `Skeleton` genérico (`components/ui/skeleton.tsx`):**
```tsx
// Variantes: text, card, table-row, avatar
// Animação: pulse com tailwind (animate-pulse bg-zinc-800)
```

**Criar componente `PageLoader` (`components/ui/page-loader.tsx`):**
- Spinner centralizado na tela para navegação entre páginas
- Usar em conjunto com `Suspense` do Next.js ou manualmente via state

**Calculadora (`calculator/page.tsx`):**
- Enquanto `isLoading` do `useCalculator()`, renderizar Skeletons nos cards de custo e configuração
- Ao trocar modo (setWorkSettingsMutation), mostrar spinner sobreposto (overlay) durante a mutação
- Desabilitar o toggle até que a mutação complete (`isPending`)
- **Não renderizar** campos do modo anterior enquanto troca (usar estado local de `optimisticMode` só após confirmação do servidor)

**Padrão global de loading para todas as páginas:**
- Páginas com tabelas: mostrar `TableSkeleton` (N linhas de skeleton) em vez de tabela vazia
- `isLoading` → skeleton | `isFetching && !isLoading` → spinner sutil no canto (indicando refresh)
- Implementar em: `sessions/page.tsx`, `clients/page.tsx`, `financial/page.tsx`, `dashboard/page.tsx`

**Providers (`providers.tsx`):**
- Corrigir o `useEffect` de restauração de sessão — atualmente o `catch` não finaliza o loading, deixando a tela em branco

---

## Item 7 — Coluna "Sessões" na Aba Procedimentos Não Atualiza

**Problema:** A contagem de sessões na tabela de clientes/procedimentos não reflete os dados mais recentes após inserções.

### Causa Provável
Após criar uma sessão, a invalidação de `['clients']` ocorre, mas o campo `sessionCount` no response de `/clients` é calculado via `_count` do Prisma — se o include não estiver correto ou o cache do TanStack Query estiver stale, o valor antigo é exibido.

### Arquivos Envolvidos
- `frontend/src/hooks/use-sessions.ts` (invalidação no createMutation)
- `backend/src/clients/clients.service.ts` (cálculo do sessionCount)
- `frontend/src/app/(dashboard)/sessions/page.tsx` (se exibe sessionCount por cliente)

### O que fazer

**`use-sessions.ts`:**
- Garantir que `createMutation.onSuccess` invalida `['clients']` E `['sessions']`
- Usar `queryClient.invalidateQueries({ exact: false })` para invalidar todas as variantes do key

**`clients.service.ts` (backend):**
- Confirmar que o `getAll()` faz include correto:
  ```typescript
  _count: { select: { sessions: true } }
  ```
- Retornar `sessionCount` calculado no response

**`sessions/page.tsx`:**
- Se a coluna "Sessões" mostra count por cliente, verificar se busca os dados de `clients` (que inclui sessionCount) ou calcula na hora
- Trocar para usar o campo `_count.sessions` que vem do backend

**Stale Time:**
- Reduzir `staleTime` para 0 nos queries de `clients` e `sessions` para garantir refetch após invalidação
- Ou usar `refetchOnMount: 'always'` nestes hooks específicos

---

## Item 8 — Garantir Dados Atualizados Antes de Renderizar (Sem Flash de Dado Antigo)

**Problema:** Após inserção/edição, o componente renderiza o valor antigo (cache) e depois atualiza para o novo — experiência ruim (flash).

### Causa Raiz
O `staleTime: 60 * 1000` em `providers.tsx` faz com que dados cacheados sejam exibidos imediatamente enquanto o refetch ocorre em background.

### Arquivos Envolvidos
- `frontend/src/app/providers.tsx` (QueryClient config)
- Todos os hooks que fazem mutações

### O que fazer

**Opção A — Optimistic Updates (recomendado para melhor UX):**
- Nas mutações de create/update/delete, usar `onMutate` para atualizar o cache otimisticamente
- Se o servidor retornar erro, usar `onError` para reverter
- Implementar em: `use-sessions.ts`, `use-clients.ts`, `use-financial.ts`

Exemplo de padrão:
```typescript
onMutate: async (newSession) => {
  await queryClient.cancelQueries({ queryKey: ['sessions'] });
  const previousSessions = queryClient.getQueryData(['sessions']);
  queryClient.setQueryData(['sessions'], (old) => [...old, { ...newSession, id: 'temp' }]);
  return { previousSessions };
},
onError: (err, newSession, context) => {
  queryClient.setQueryData(['sessions'], context.previousSessions);
},
onSettled: () => {
  queryClient.invalidateQueries({ queryKey: ['sessions'] });
}
```

**Opção B — Remover staleTime nos dados críticos:**
- Queries de listagem (`sessions`, `clients`, `transactions`) → `staleTime: 0`
- Isso força sempre um refetch ao montar o componente

**Recomendado:** combinar as duas — optimistic updates para criação/edição, e `staleTime: 0` com `refetchOnMount: true` para listas.

**Invalidação cruzada (garantir completude):**
```typescript
// Ao criar sessão, invalidar TUDO que pode ser afetado:
['sessions']
['clients']          // sessionCount muda
['financial-summary'] // novo income
['transactions']      // auto-transaction criada
['dashboard']         // se existir query separada
```

---

## Item 9 — Dashboard com Dados Reais (Remover Mocks)

**Problema:** O gráfico de linha no dashboard usa dados hardcoded para meses anteriores (Set-Jan) e apenas o mês atual é real. O badge "12% crescimento" é sempre fixo.

### Arquivos Envolvidos
- `frontend/src/app/(dashboard)/dashboard/page.tsx`
- `backend/src/financial/financial.service.ts` ou `sessions.service.ts`
- `frontend/src/hooks/use-financial.ts` ou criar `use-dashboard.ts`
- `frontend/src/services/financial.service.ts`

### O que fazer

**Novo endpoint backend — Histórico Mensal:**
- `GET /financial/monthly-summary?months=6` (ou `months=12`)
- Retorna array de `{ month: 'Set', year: 2025, totalIncome, sessionCount }` dos últimos N meses
- Agrupar transactions por mês usando Prisma `groupBy` com `createdAt`

**Frontend — Novo hook `useDashboard` (ou extender `useFinancial`):**
```typescript
useMonthlySummary(months = 6) {
  queryKey: ['monthly-summary', months]
  queryFn: () => financialService.getMonthlySummary(months)
}
```

**`dashboard/page.tsx`:**
- Substituir o array hardcoded `chartData` pelos dados reais do hook
- Formatar `{ label: 'Set', value: totalIncome }` a partir da resposta
- Mostrar skeleton no gráfico enquanto `isLoading`

**Badge de crescimento:**
- Calcular dinamicamente: `((mesAtual - mesAnterior) / mesAnterior) * 100`
- Se cresceu → verde com "▲ X%", se caiu → vermelho com "▼ X%", se igual → cinza "= Estável"
- Se não houver dados suficientes (menos de 2 meses) → não mostrar badge

**Cards de estatísticas:**
- Confirmar que `Faturamento Mensal` usa dados reais (`summary?.totalIncome`) — já está, mas verificar
- `Clientes Ativos` → filtrar clientes com pelo menos 1 sessão no mês atual (em vez de total de clientes)
- `Sessões Realizadas` → filtrar pelo mês atual via query param `?month=YYYY-MM`
- `Ticket Médio` → calculado corretamente

---

## Ordem de Implementação Sugerida

| # | Item | Prioridade | Complexidade |
|---|------|-----------|--------------|
| 1 | Google Login (fix + complete-registration) | Alta | Alta |
| 8 | Dados atualizados / sem flash (optimistic updates) | Alta | Média |
| 6 | Loading states (Skeleton + Spinner) | Alta | Média |
| 7 | Coluna sessões não atualiza | Alta | Baixa |
| 4 | Editar/Excluir Procedimentos | Média | Baixa |
| 5 | Editar/Excluir Clientes | Média | Baixa |
| 9 | Dashboard com dados reais | Média | Média |
| 2 | Cadastro Studio (nome da empresa) | Baixa | Baixa |
| 3 | Edição perfil Studio (CNPJ, endereço) | Baixa | Alta |

---

## Notas Técnicas Gerais

- **Migrations Prisma:** Item 3 requer `npx prisma migrate dev` após alterar o schema
- **Variáveis de Ambiente:** Item 1 requer `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` e `BETTER_AUTH_URL` corretos
- **Testes:** Após cada item, testar o fluxo completo no browser antes de passar ao próximo
- **Cache invalidation:** Sempre preferir `queryClient.invalidateQueries` com `{ queryKey: [...] }` em vez de reset total
