# Plano — Dados Históricos Iniciais para Sugestão de Orçamento

## Objetivo

Permitir que o usuário insira 20–30 tatuagens já realizadas no passado como base inicial
para o sistema de sugestão de preços. Esses dados se somam às sessões reais futuras
para aumentar o volume de referência do KNN.

---

## Análise do que já existe

| O que existe | Como funciona hoje |
|---|---|
| `GET /sessions/price-suggestion` | Busca apenas em `TattooSession` (sessões reais) |
| `MLTrainingData` | Tem os campos certos, mas `sessionId` é obrigatório e único — não aceita dados manuais |
| `MlService.predict()` | Consulta o model legado `Procedure` — não está integrado à sugestão atual |
| Página `/budget-suggestion` | Mostra min/avg/max + 10 sessões de referência — "Dados insuficientes" com menos de 3 |

**Problema central:** O sistema só aprende com sessões reais futuras. Usuário novo fica
sem sugestão até acumular dados, o que pode levar meses.

---

## Opção de Armazenamento (precisamos decidir)

### Opção A — Nova tabela `SeedTrainingData`
Tabela separada exclusiva para dados históricos manuais.

```prisma
model SeedTrainingData {
  id           String           @id @default(cuid())
  tenantId     String
  userId       String
  size         TattooSize
  complexity   TattooComplexity
  bodyLocation BodyLocation
  finalPrice   Int              // em centavos
  createdAt    DateTime         @default(now())

  tenant Tenant @relation(...)
  user   User   @relation(...)
}
```

**Vantagens:**
- Separação clara entre dado real (TattooSession) e dado histórico (SeedTrainingData)
- Sem impacto no schema existente
- Fácil de deletar/limpar todo o seed sem afetar dados reais

**Desvantagens:**
- A query de sugestão precisa combinar 2 tabelas (`TattooSession` UNION `SeedTrainingData`)
- Outra tabela no banco

---

### Opção B — Estender `MLTrainingData` (tornar `sessionId` opcional + add `source`)

Aproveitar a tabela que já existe para isso.

```prisma
model MLTrainingData {
  id           String           @id @default(cuid())
  tenantId     String           // adicionar
  userId       String
  sessionId    String?          @unique  // tornar opcional
  source       TrainingSource   @default(SESSION)  // novo campo
  size         TattooSize
  complexity   TattooComplexity
  bodyLocation BodyLocation
  duration     Int?             // tornar opcional
  finalPrice   Int
  createdAt    DateTime         @default(now())
}

enum TrainingSource {
  SESSION  // gerado automaticamente de uma sessão real
  MANUAL   // inserido manualmente pelo usuário
}
```

**Vantagens:**
- Uma única tabela como fonte de verdade para o ML
- Quando uma sessão real é criada, auto-gera um MLTrainingData(source=SESSION)
- Sugestão e KNN consultam só uma tabela

**Desvantagens:**
- Mudança no schema existente (migrations mais delicadas)
- Mistura dado real com dado manual na mesma tabela

---

### Recomendação

**Opção A** para MVP — mais segura, sem risco de quebrar o que já funciona.
**Opção B** faz mais sentido arquiteturalmente a longo prazo quando o KNN estiver rodando.

---

## O que muda — por camada

### Backend — Schema (Opção A)

**`backend/prisma/schema.prisma`**
- Adicionar model `SeedTrainingData` com: `tenantId`, `userId`, `size`, `complexity`, `bodyLocation`, `finalPrice`
- Sem relação com `TattooSession` (dado independente)
- `db push` para aplicar

---

### Backend — Módulo Novo (ou dentro de `sessions`)

**Criar: `backend/src/seed-training/`**
- `seed-training.controller.ts`
- `seed-training.service.ts`
- `seed-training.module.ts`
- `dto/create-seed-training.dto.ts`
- `dto/bulk-create-seed-training.dto.ts`

**Endpoints:**

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/seed-training` | Lista entradas do usuário atual |
| `POST` | `/seed-training/bulk` | Cria múltiplas entradas (array) |
| `DELETE` | `/seed-training/:id` | Remove uma entrada |

**Regras no service:**
```typescript
// Contar entradas existentes do userId antes de criar
const existingCount = await prisma.seedTrainingData.count({ where: { userId } })
if (existingCount + newEntries.length > 30) {
  throw new BadRequestException('Limite de 30 entradas históricas atingido')
}
```

---

### Backend — Atualizar `getPriceSuggestion`

**`backend/src/sessions/sessions.service.ts`**

Atual: só consulta `TattooSession`

Novo: combina `TattooSession` + `SeedTrainingData`:

```typescript
// Busca sessões reais
const realSessions = await prisma.tattooSession.findMany({ where: { tenantId, userId, size, complexity, bodyLocation } })

// Busca dados históricos do userId
const seedData = await prisma.seedTrainingData.findMany({ where: { userId, size, complexity, bodyLocation } })

// Combina preços
const allPrices = [
  ...realSessions.map(s => s.finalPrice),
  ...seedData.map(s => s.finalPrice),
]
// Calcula avg, min, max sobre allPrices
```

Obs: `seedData` filtra por `userId` (dado pessoal), `realSessions` filtra por `tenantId`.

---

### Frontend — UI

**Localização:** Tab ou seção dentro de `/budget-suggestion`

**Estrutura da página:**

```
[ Aba: Sugestão de Preço ] [ Aba: Dados Históricos ]
                                        ↑ nova aba
```

**Aba "Dados Históricos":**

```
┌─────────────────────────────────────────────────────────────┐
│  Dados históricos iniciais                   15 / 30 ✓      │
│  Insira tatuagens que você já fez para melhorar as          │
│  sugestões de preço desde o início.                         │
├──────────┬──────────────┬────────────┬──────────┬──────────┤
│ Tamanho  │ Local        │ Complexid. │ Valor(R$)│          │
├──────────┼──────────────┼────────────┼──────────┼──────────┤
│ [select] │ [select]     │ [select]   │ [input]  │ [+ add]  │
├──────────┼──────────────┼────────────┼──────────┼──────────┤
│ Médio    │ Antebraço    │ Baixa      │ R$ 450   │ [x]      │
│ Grande   │ Costas sup.  │ Alta       │ R$ 720   │ [x]      │
│ XL       │ Costela      │ Muito Alta │ R$ 950   │ [x]      │
│ ...      │ ...          │ ...        │ ...      │          │
└──────────┴──────────────┴────────────┴──────────┴──────────┘

[Salvar todos]                     Mínimo recomendado: 20 entradas
```

**Comportamento:**
- Usuário preenche uma linha e clica "+ Adicionar" — linha vai para a lista abaixo
- Lista local (estado React) acumula até o usuário clicar "Salvar todos" — envia bulk
- Contador `X / 30` visível
- Ao atingir 30: desabilitar form com mensagem "Limite atingido"
- Linhas salvas mostram botão [x] para deletar (chama `DELETE /seed-training/:id`)
- Se já tem entradas salvas (recarregar página): carrega da API e mostra

**Arquivos frontend:**
- `frontend/src/app/(dashboard)/budget-suggestion/page.tsx` — adicionar aba + condicional
- `frontend/src/components/seed-training/seed-training-form.tsx` — novo componente
- `frontend/src/services/seed-training.service.ts` — novo serviço
- `frontend/src/hooks/use-seed-training.ts` — novo hook (TanStack Query)
- `frontend/src/types/seed-training.types.ts` — novos tipos

---

## Fluxo de uso

```
Usuário novo entra em "Sugestão de Orçamento"
      ↓
Vê mensagem: "Você não tem dados suficientes. Adicione tatuagens passadas."
      ↓
Clica em "Dados Históricos"
      ↓
Preenche 20–30 linhas (passadas)
      ↓
Clica "Salvar todos"
      ↓
Sistema confirma: "25 entradas salvas! Agora sua sugestão de preço está ativa."
      ↓
Volta para "Sugestão de Preço" — já funciona com os dados inseridos
      ↓
Cada sessão real futura somada automaticamente ao volume
```

---

## Pontos para discussão

### 1. O limite de 30 é por `userId` ou por `tenantId`?

- **Por `userId` (recomendado):** Cada tatuador insere o próprio histórico. Em um estúdio com 3 tatuadores, cada um insere os seus 30, totalizando 90 referências — mais rico.
- **Por `tenantId`:** Um pool compartilhado. Mais simples mas menos preciso para sugestões individuais.

### 2. Edição de linha ou só delete + re-add?

- **Só delete + re-add (recomendado para MVP):** Mais simples. O usuário deleta a linha errada e readiciona.
- **Edição inline:** Mais UX-friendly, mas mais código.

### 3. A sugestão usa só dados do userId ou do tenantId?

- Para usuário AUTONOMO: faz sentido usar só dele
- Para EMPLOYEE em estúdio: faz sentido usar só dele (cada artista tem seu estilo/preço)
- Para OWNER/STAFF: pode querer ver o agregado do estúdio inteiro

Sugestão: filtrar por `userId` por padrão, mas pode ser expandido depois.

### 4. Importação via CSV (fase 2)?

Se o usuário tiver uma planilha do passado, um botão "Importar CSV" seria mais rápido do que preencher linha a linha. Deixar como melhoria futura.

### 5. Mostrar separação na lista de referência?

Na aba "Sugestão de Preço", ao listar os 10 exemplos de referência, marcar visualmente quais vieram de dados históricos vs sessões reais? Ex: badge "Histórico" / "Sessão Real".

---

## Resumo de arquivos impactados

### Backend (novos)
- `backend/src/seed-training/seed-training.controller.ts`
- `backend/src/seed-training/seed-training.service.ts`
- `backend/src/seed-training/seed-training.module.ts`
- `backend/src/seed-training/dto/create-seed-training.dto.ts`
- `backend/src/seed-training/dto/bulk-create-seed-training.dto.ts`

### Backend (modificados)
- `backend/prisma/schema.prisma` — novo model `SeedTrainingData`
- `backend/src/app.module.ts` — registrar novo módulo
- `backend/src/sessions/sessions.service.ts` — combinar SeedTrainingData na sugestão

### Frontend (novos)
- `frontend/src/services/seed-training.service.ts`
- `frontend/src/hooks/use-seed-training.ts`
- `frontend/src/types/seed-training.types.ts`
- `frontend/src/components/seed-training/seed-training-form.tsx`

### Frontend (modificados)
- `frontend/src/app/(dashboard)/budget-suggestion/page.tsx` — nova aba

---

## Complexidade estimada

Média-alta. Os pontos mais delicados são:
1. O estado local do formulário de múltiplas linhas no frontend antes do bulk save
2. A combinação de duas queries na sugestão de preço
3. A UX do contador + disable ao atingir limite
