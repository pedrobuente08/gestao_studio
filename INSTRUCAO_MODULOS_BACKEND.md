Leia o arquivo CLAUDE_CONTEXT.md na raiz do projeto antes de começar.

Sua tarefa é implementar os módulos restantes do backend: Tenants, Clients, Procedures, Sessions, Financial e Calculator. Trabalhe dentro da pasta backend/src/.

---

## CONTROLE DE PERMISSÕES POR ROLE

Antes de implementar os módulos, implemente os guards de autorização:

### 1. Role Guard

Crie `src/common/guards/roles.guard.ts`:
- Guard que verifica se o usuário tem a role necessária para acessar a rota
- Usa um decorator @Roles(...roles) que você vai criar

Crie `src/common/decorators/roles.decorator.ts`:
- Decorator que marca quais roles podem acessar uma rota
- Exemplo: @Roles('OWNER', 'STAFF')

### Regras de permissão:

**OWNER:**
- Acesso total a tudo do seu tenant

**STAFF:**
- Acesso total exceto modificar configurações do tenant
- Cria/edita/deleta: clientes, procedimentos, sessões, transações financeiras

**EMPLOYEE:**
- Apenas leitura (GET)
- Vê apenas suas próprias sessões (where userId = ele mesmo)
- Vê apenas clientes relacionados às suas sessões
- Vê seus próprios ganhos no financeiro
- Acessa sugestão de orçamento (ML)
- NÃO pode criar/editar/deletar nada

---

## MÓDULO: TENANTS

### DTOs

`create-tenant.dto.ts`:
- type: TenantType (obrigatório)
- name: string (obrigatório)

`update-tenant.dto.ts`:
- name: string (opcional)

`tenant-response.dto.ts`:
- id, type, name, createdAt, updatedAt

### Service

`tenants.service.ts`:

`findOne(tenantId)`:
- Retorna os dados do tenant

`update(tenantId, updateDto)`:
- Atualiza o nome do tenant
- Apenas OWNER pode fazer isso

`getStudioConfig(tenantId)`:
- Se o tenant for STUDIO, retorna a configuração (percentual padrão, benefícios dos tatuadores)
- Se não existir, retorna null

`updateStudioConfig(tenantId, defaultPercentage)`:
- Atualiza ou cria a configuração do estúdio
- Apenas para tenants do tipo STUDIO
- Apenas OWNER pode fazer isso

`addTatuadorBenefit(tenantId, userId, percentage, reason?)`:
- Adiciona um benefício individual para um tatuador específico
- Apenas OWNER pode fazer isso

`removeTatuadorBenefit(benefitId)`:
- Remove um benefício individual
- Apenas OWNER pode fazer isso

### Controller

`tenants.controller.ts`:

```
GET    /tenants/me              → findOne() (todas as roles)
PATCH  /tenants/me              → update() (apenas OWNER)
GET    /tenants/studio-config   → getStudioConfig() (OWNER e STAFF)
PATCH  /tenants/studio-config   → updateStudioConfig() (apenas OWNER)
POST   /tenants/benefits         → addTatuadorBenefit() (apenas OWNER)
DELETE /tenants/benefits/:id    → removeTatuadorBenefit() (apenas OWNER)
```

Todas as rotas protegidas pelo AuthGuard e RolesGuard.

---

## MÓDULO: CLIENTS

### DTOs

`create-client.dto.ts`:
- name: string (obrigatório)
- email: string (opcional, formato email)
- phone: string (opcional)
- notes: string (opcional)

`update-client.dto.ts`:
- Todos os campos opcionais

`client-response.dto.ts`:
- id, tenantId, name, email, phone, notes, createdAt, updatedAt
- totalSessions: number (calculado)
- totalSpent: number (calculado, em centavos)
- lastVisit: Date (calculado)

### Service

`clients.service.ts`:

`create(tenantId, createDto)`:
- Cria um cliente vinculado ao tenant

`findAll(tenantId, userId?, role?)`:
- Se role = EMPLOYEE: retorna apenas clientes que têm sessões com esse userId
- Senão: retorna todos os clientes do tenant
- Inclui totalSessions, totalSpent e lastVisit calculados

`findOne(id, tenantId, userId?, role?)`:
- Retorna um cliente específico
- Se role = EMPLOYEE: verifica se o cliente tem sessões com esse userId
- Inclui o histórico completo de sessões

`update(id, tenantId, updateDto)`:
- Atualiza um cliente
- Valida que o cliente pertence ao tenant

`remove(id, tenantId)`:
- Deleta um cliente
- Valida que o cliente pertence ao tenant

### Controller

`clients.controller.ts`:

```
POST   /clients           → create() (OWNER, STAFF)
GET    /clients           → findAll() (todas as roles, filtrado por role)
GET    /clients/:id       → findOne() (todas as roles, filtrado por role)
PATCH  /clients/:id       → update() (OWNER, STAFF)
DELETE /clients/:id       → remove() (OWNER, STAFF)
```

---

## MÓDULO: PROCEDURES

### DTOs

`create-procedure.dto.ts`:
- name: string (obrigatório)
- description: string (opcional)
- size: TattooSize (obrigatório)
- complexity: TattooComplexity (obrigatório)
- bodyLocation: BodyLocation (obrigatório)
- finalPrice: number (obrigatório, em centavos)
- duration: number (obrigatório, em minutos)

`update-procedure.dto.ts`:
- Todos os campos opcionais

`procedure-response.dto.ts`:
- Todos os campos do modelo
- sessionCount: number (quantas sessões usaram esse procedimento)

### Service

`procedures.service.ts`:

`create(tenantId, userId, createDto)`:
- Cria um procedimento vinculado ao tenant e ao usuário que cadastrou

`findAll(tenantId, userId?, role?)`:
- Se role = EMPLOYEE: retorna apenas procedimentos criados por esse userId
- Senão: retorna todos os procedimentos do tenant
- Inclui sessionCount

`findOne(id, tenantId)`:
- Retorna um procedimento específico

`update(id, tenantId, updateDto)`:
- Atualiza um procedimento

`remove(id, tenantId)`:
- Deleta um procedimento

### Controller

`procedures.controller.ts`:

```
POST   /procedures        → create() (OWNER, STAFF)
GET    /procedures        → findAll() (todas as roles, filtrado por role)
GET    /procedures/:id    → findOne() (todas as roles)
PATCH  /procedures/:id    → update() (OWNER, STAFF)
DELETE /procedures/:id    → remove() (OWNER, STAFF)
```

---

## MÓDULO: SESSIONS

### DTOs

`create-session.dto.ts`:
- clientId: string (obrigatório)
- userId: string (obrigatório — o tatuador que realizou)
- procedureId: string (opcional — referência)
- size: TattooSize (obrigatório)
- complexity: TattooComplexity (obrigatório)
- bodyLocation: BodyLocation (obrigatório)
- description: string (opcional)
- finalPrice: number (obrigatório, em centavos)
- guestLocationId: string (opcional — se for guest)
- studioPercentage: number (opcional — percentual cobrado pelo estúdio)
- duration: number (opcional, em minutos)
- date: Date (obrigatório)

`update-session.dto.ts`:
- Todos os campos opcionais

`session-response.dto.ts`:
- Todos os campos do modelo
- client: objeto com dados do cliente
- user: objeto com dados do tatuador
- procedure: objeto com dados do procedimento (se houver)
- guestLocation: objeto com dados do local (se houver)

### Service

`sessions.service.ts`:

`create(tenantId, createDto)`:
- Cria uma sessão
- Se guestLocationId e studioPercentage estão preenchidos, calcula automaticamente:
  - studioFee = (finalPrice * studioPercentage) / 100
  - tatuadorRevenue = finalPrice - studioFee
- Cria automaticamente um Transaction com type=INCOME, category=TATTOO, vinculado à sessão

`findAll(tenantId, userId?, role?)`:
- Se role = EMPLOYEE: retorna apenas sessões onde userId = ele mesmo
- Senão: retorna todas as sessões do tenant
- Inclui dados de client, user, procedure e guestLocation

`findOne(id, tenantId, userId?, role?)`:
- Retorna uma sessão específica
- Se role = EMPLOYEE: valida que userId da sessão = ele mesmo

`update(id, tenantId, updateDto)`:
- Atualiza uma sessão
- Recalcula studioFee e tatuadorRevenue se necessário
- Atualiza o Transaction vinculado

`remove(id, tenantId)`:
- Deleta uma sessão
- Deleta também o Transaction vinculado

### Controller

`sessions.controller.ts`:

```
POST   /sessions         → create() (OWNER, STAFF)
GET    /sessions         → findAll() (todas as roles, filtrado por role)
GET    /sessions/:id     → findOne() (todas as roles, filtrado por role)
PATCH  /sessions/:id     → update() (OWNER, STAFF)
DELETE /sessions/:id     → remove() (OWNER, STAFF)
```

---

## MÓDULO: FINANCIAL

### DTOs

`create-transaction.dto.ts`:
- type: TransactionType (obrigatório)
- category: TransactionCategory (obrigatório)
- amount: number (obrigatório, em centavos)
- paymentMethod: PaymentMethod (opcional)
- clientId: string (opcional)
- description: string (opcional)
- date: Date (obrigatório)

`update-transaction.dto.ts`:
- Todos os campos opcionais

`transaction-response.dto.ts`:
- Todos os campos do modelo
- client: objeto com dados do cliente (se houver)

### Service

`financial.service.ts`:

`create(tenantId, createDto)`:
- Cria uma transação
- NÃO cria transações vinculadas a sessões (isso é feito automaticamente no SessionsService)

`findAll(tenantId, userId?, role?)`:
- Se role = EMPLOYEE: retorna apenas transações de sessões onde userId = ele mesmo
- Senão: retorna todas as transações do tenant
- Permite filtros opcionais por: type, category, startDate, endDate

`getSummary(tenantId, userId?, role?)`:
- Retorna resumo financeiro:
  - totalIncome: soma de todas as entradas
  - totalExpense: soma de todas as saídas
  - balance: totalIncome - totalExpense
- Se role = EMPLOYEE: calcula apenas para suas sessões

`findOne(id, tenantId)`:
- Retorna uma transação específica

`update(id, tenantId, updateDto)`:
- Atualiza uma transação
- NÃO permite atualizar transações vinculadas a sessões (sessionId !== null)

`remove(id, tenantId)`:
- Deleta uma transação
- NÃO permite deletar transações vinculadas a sessões

### Controller

`financial.controller.ts`:

```
POST   /financial              → create() (OWNER, STAFF)
GET    /financial              → findAll() (todas as roles, filtrado por role)
GET    /financial/summary      → getSummary() (todas as roles, filtrado por role)
GET    /financial/:id          → findOne() (todas as roles)
PATCH  /financial/:id          → update() (OWNER, STAFF)
DELETE /financial/:id          → remove() (OWNER, STAFF)
```

---

## MÓDULO: CALCULATOR

### DTOs

`create-cost.dto.ts`:
- name: string (obrigatório)
- amount: number (obrigatório, em centavos)
- type: 'fixed' | 'variable' (obrigatório)

`update-cost.dto.ts`:
- name: string (opcional)
- amount: number (opcional)

`calculator-response.dto.ts`:
- fixedCosts: array de custos fixos
- variableCosts: array de custos variáveis
- totalFixed: number (soma, em centavos)
- totalVariable: number (soma, em centavos)
- totalCosts: number (totalFixed + totalVariable)
- hoursPerMonth: number
- profitMargin: number (em %)
- costPerHour: number (totalCosts / hoursPerMonth, em centavos)
- minimumPricePerHour: number (costPerHour + margem de lucro, em centavos)
- quickReference: objeto com preços sugeridos para 1h, 2h, 3h, 5h

### Service

`calculator.service.ts`:

`addCost(tenantId, createDto)`:
- Cria um custo fixo ou variável

`removeCost(id, tenantId, type)`:
- Remove um custo (fixo ou variável)

`updateCost(id, tenantId, type, updateDto)`:
- Atualiza um custo

`setWorkSettings(tenantId, hoursPerMonth, profitMargin)`:
- Cria ou atualiza as configurações de trabalho

`calculate(tenantId)`:
- Busca todos os custos fixos e variáveis
- Busca as configurações de trabalho
- Calcula e retorna o CalculatorResponse completo

### Controller

`calculator.controller.ts`:

```
POST   /calculator/costs         → addCost() (OWNER, STAFF)
DELETE /calculator/costs/:id     → removeCost() (OWNER, STAFF)
PATCH  /calculator/costs/:id     → updateCost() (OWNER, STAFF)
POST   /calculator/settings      → setWorkSettings() (OWNER, STAFF)
GET    /calculator               → calculate() (todas as roles)
```

---

## MÓDULO: ML (apenas estrutura básica por enquanto)

### DTOs

`predict.dto.ts`:
- size: TattooSize (obrigatório)
- complexity: TattooComplexity (obrigatório)
- bodyLocation: BodyLocation (obrigatório)

`prediction-response.dto.ts`:
- predictedPrice: number (em centavos)
- similarProcedures: array com até 5 procedimentos similares do banco

### Service

`ml.service.ts`:

`predict(tenantId, userId, predictDto)`:
- Por enquanto, apenas busca procedimentos similares no banco:
  - Mesma size, complexity e bodyLocation
  - Do mesmo tatuador (userId)
- Calcula a média dos preços dos procedimentos encontrados
- Retorna o preço sugerido e a lista de procedimentos similares
- NOTA: O modelo CatBoost será implementado depois

### Controller

`ml.controller.ts`:

```
POST   /ml/predict      → predict() (todas as roles)
```

---

## REGRAS IMPORTANTES

- Sempre use tenantId para isolamento de dados em TODAS as queries
- Sempre valide que os recursos pertencem ao tenant antes de modificá-los
- Valores monetários sempre em centavos
- Para role EMPLOYEE, sempre filtre por userId nas queries
- Use o decorator @CurrentTenant() para extrair o tenantId do usuário autenticado
- Use o decorator @Roles(...) para controlar acesso às rotas
- Sempre aplique AuthGuard e RolesGuard nas rotas protegidas
- Use class-validator e class-transformer nos DTOs
- Sempre retorne DTOs de resposta, nunca entidades do Prisma diretamente
- Trate erros com as exceções do NestJS (BadRequestException, NotFoundException, etc)