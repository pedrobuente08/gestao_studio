# Plano de Melhorias — InkStudio

## Como funciona o fluxo de orçamento (ML)

Antes de qualquer melhoria, é importante entender onde cada coisa vive hoje.

### Fluxo completo quando o usuário pede um orçamento

```
Usuário seleciona: tamanho + complexidade + local do corpo
        ↓
Frontend → POST /ml/predict
        ↓
Backend (AuthGuard valida JWT → extrai userId)
        ↓
ml.service.ts: verifica se existe MLModel ativo no banco (Supabase/PostgreSQL)
        ↓
    [NÃO TEM MODELO]              [TEM MODELO]
    Retorna: available: false      Chama Python ML Service
    "Você tem X de 15 sessões"     POST http://localhost:8001/predict
                                           ↓
                                   Python carrega arquivo do DISCO LOCAL
                                   ./models/{userId}/model.cbm
                                           ↓
                                   CatBoost faz a predição
                                           ↓
                                   Retorna predictedPrice (em centavos)
                                           ↓
                                   Backend salva em MLPrediction (banco)
                                           ↓
                                   Frontend exibe o valor sugerido
```

### Onde ficam os dados treinados hoje

| O que | Onde fica | Problema |
|-------|-----------|----------|
| Metadados do modelo (dataPointsUsed, trainedAt, isActive) | **Supabase (PostgreSQL)** — tabela `MLModel` | OK, seguro |
| O arquivo do modelo treinado (.cbm) | **Disco local** — `ml-service/models/{userId}/model.cbm` | CRÍTICO: perdido se o container reiniciar |
| Histórico de predições | **Supabase (PostgreSQL)** — tabela `MLPrediction` | OK, seguro |
| Dados de sessões para treino | **Supabase (PostgreSQL)** — tabela `TattooSession` + `SeedTrainingData` | OK, seguro |

**Resumo:** o banco Supabase está bem. O problema é o arquivo `.cbm` — o modelo treinado em si — que fica no disco da máquina que roda o ml-service. Localmente funciona, mas em produção com Docker isso significa que cada `docker restart` ou novo deploy apaga todos os modelos.

### O que acontece no treino (e por que não escala)

```
Cron: todo domingo às 3h
    ↓
Busca TODOS os usuários com sessões
    ↓
Para cada usuário (sequencial, um por vez):
    ↓
    Busca TODAS as sessões do usuário no banco
    Busca TODOS os seedData do usuário no banco
    Manda tudo via HTTP para o Python
    Python treina CatBoost do ZERO (300 iterações)
    Python salva modelo no disco
    Backend atualiza tabela MLModel
    ↓
Próximo usuário...
```

Com 10 usuários: ~5 segundos. Com 500 usuários: pode levar horas e travar.

---

## O que fazer com o ML agora (decisão imediata)

### Situação atual
Você está em desenvolvimento/MVP. Não vale complexidade prematura. A arquitetura está correta — o problema é só a persistência do arquivo `.cbm`.

### Recomendação para agora: salvar modelos no Supabase Storage

Você já usa Supabase. Ele tem um Storage (tipo S3). A solução é:

1. Criar um bucket privado no Supabase Storage chamado `ml-models`
2. Após treinar, o Python faz upload do `.cbm` para `ml-models/{userId}/model.cbm`
3. Antes de predizer, o Python baixa o arquivo se não estiver em cache local

Enquanto não implementa isso: **adicionar volume no Docker** para o diretório `./models` — assim o arquivo persiste entre reinicializações do container, mesmo que não seja ideal para produção.

```yaml
# docker-compose.yml — solução temporária
ml-service:
  volumes:
    - ml_models:/app/models

volumes:
  ml_models:
```

---

## Prioridades de melhoria

### Nível 1 — Crítico (fazer antes de ir para produção)

| # | Problema | Impacto se não corrigir |
|---|---------|------------------------|
| 1 | Modelos ML em disco sem persistência | Todos os modelos perdidos em cada deploy |
| 2 | Treinamento ML não é atômico | Usuário fica sem modelo ativo se o treino falhar |
| 3 | Sessão e Transaction criadas sem transação atômica | Sessão existe sem registro financeiro, dados inconsistentes |
| 4 | Race condition em despesas recorrentes | Duplicatas no financeiro |
| 5 | Senha do colaborador enviada em plain text no email | Falha de segurança grave |

### Nível 2 — Alto (primeiras 2 semanas em produção)

| # | Problema | Impacto se não corrigir |
|---|---------|------------------------|
| 6 | Zero paginação nas listagens | Crash do frontend com crescimento de dados |
| 7 | Sem rate limiting | Brute force em login, abuso do ML |
| 8 | Indexes faltando no banco | Queries lentas a partir de ~1.000 registros |
| 9 | Cron ML sequencial sem batching | Trava com mais de ~100 usuários |
| 10 | Port mismatch no Dockerfile do ML | Bug silencioso em produção com Docker |

### Nível 3 — Médio (roadmap)

| # | Problema |
|---|---------|
| 11 | Treinamento retreina tudo do zero (sem incremental learning) |
| 12 | KNN manual em memória nas sessões (O(n)) |
| 13 | XSS em templates de email |
| 14 | Validação incompleta de variáveis de ambiente |
| 15 | Sem Swagger/documentação da API |

---

## Nível 1 — Implementação detalhada

### Melhoria 1: Persistência dos modelos ML no Supabase Storage

**Arquivos a modificar:** `ml-service/main.py`

```python
# Instalar: pip install supabase
import os
from supabase import create_client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")  # service_role key, não anon
BUCKET = "ml-models"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def _upload_model(user_id: str, local_path: Path):
    with open(local_path, "rb") as f:
        supabase.storage.from_(BUCKET).upload(
            path=f"{user_id}/model.cbm",
            file=f,
            file_options={"upsert": "true"}
        )

def _download_model(user_id: str, local_path: Path) -> bool:
    try:
        data = supabase.storage.from_(BUCKET).download(f"{user_id}/model.cbm")
        local_path.parent.mkdir(parents=True, exist_ok=True)
        with open(local_path, "wb") as f:
            f.write(data)
        return True
    except:
        return False

# No endpoint /train: após model.save_model(), chamar _upload_model()
# No endpoint /predict: antes de load_model(), chamar _download_model() se arquivo não existir localmente
```

**No Supabase:** criar bucket `ml-models` como privado em Storage → New bucket.

---

### Melhoria 2: Treinamento ML atômico

**Arquivo:** `backend/src/ml/ml.service.ts`

```typescript
// ANTES (não atômico):
await this.prisma.mLModel.updateMany({ where: { userId, isActive: true }, data: { isActive: false } });
await this.prisma.mLModel.create({ data: { ..., isActive: true } });

// DEPOIS (atômico):
await this.prisma.$transaction([
  this.prisma.mLModel.updateMany({
    where: { userId, isActive: true },
    data: { isActive: false },
  }),
  this.prisma.mLModel.create({
    data: { userId, trainedAt: new Date(), dataPointsUsed: data.dataPointsUsed, modelPath: data.modelPath, isActive: true },
  }),
]);
```

---

### Melhoria 3: Sessão + Transaction atômicas

**Arquivo:** `backend/src/sessions/sessions.service.ts`

```typescript
// ANTES:
const session = await this.prisma.tattooSession.create({...});
await this.prisma.transaction.create({...}); // pode falhar

// DEPOIS:
const [session] = await this.prisma.$transaction([
  this.prisma.tattooSession.create({ data: sessionData, include: SESSION_INCLUDES }),
  this.prisma.transaction.create({ data: transactionData }),
]);
return session;
```

---

### Melhoria 4: Race condition em despesas recorrentes

**Arquivo:** `backend/prisma/schema.prisma` — adicionar constraint única:

```prisma
model Transaction {
  // ... campos existentes ...
  @@unique([tenantId, recurringExpenseId, yearMonth], name: "unique_recurring_per_month")
}
```

Adicionar campo `yearMonth` (string "2025-01") na Transaction para facilitar o unique constraint.

**Arquivo:** `backend/src/financial/financial.service.ts`:

```typescript
// Usar upsert em vez de findFirst + create
await this.prisma.transaction.upsert({
  where: { unique_recurring_per_month: { tenantId, recurringExpenseId: expense.id, yearMonth } },
  update: {},  // já existe, não faz nada
  create: { ...transactionData, yearMonth },
});
```

---

### Melhoria 5: Convite de colaborador via token (sem senha em email)

**Arquivo:** `backend/src/employees/employees.service.ts`

```typescript
// ANTES:
await this.emailService.sendEmployeeWelcomeEmail(dto.email, dto.name, dto.password);

// DEPOIS:
const inviteToken = crypto.randomBytes(32).toString('hex');
const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72h

await this.prisma.authCredential.update({
  where: { userId: newUser.id },
  data: { resetToken: inviteToken, resetTokenExpiresAt: expiresAt },
});

const inviteUrl = `${process.env.APP_URL}/auth/first-access?token=${inviteToken}`;
await this.emailService.sendEmployeeInviteEmail(dto.email, dto.name, inviteUrl);
// Email contém link, não senha
```

---

## Nível 2 — Implementação detalhada

### Melhoria 6: Paginação nas listagens

**Padrão a adotar em todos os services:**

```typescript
// DTO base de paginação (criar em src/common/dto/pagination.dto.ts)
export class PaginationDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number = 20;
}

// Nos services:
async findAll(tenantId: string, page = 1, limit = 20) {
  const [data, total] = await this.prisma.$transaction([
    this.prisma.client.findMany({
      where: { tenantId },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    this.prisma.client.count({ where: { tenantId } }),
  ]);
  return { data, total, page, limit, pages: Math.ceil(total / limit) };
}
```

**Arquivos a modificar:** `clients.service.ts`, `sessions.service.ts`, `financial.service.ts`

---

### Melhoria 7: Rate limiting

**Arquivo:** `backend/src/app.module.ts`

```typescript
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1_000, limit: 5 },    // 5 req/segundo
      { name: 'medium', ttl: 60_000, limit: 60 },  // 60 req/minuto
    ]),
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
```

**Nos endpoints sensíveis (auth):**

```typescript
@Throttle({ short: { ttl: 60_000, limit: 5 } })  // 5 tentativas por minuto
@Post('login')
```

**Instalar:** `npm install --save @nestjs/throttler`

---

### Melhoria 8: Indexes no banco

**Arquivo:** `backend/prisma/schema.prisma`

```prisma
model TattooSession {
  // Adicionar:
  @@index([tenantId, userId])
  @@index([tenantId, date])
  @@index([userId, size, complexity, bodyLocation])
}

model Transaction {
  // Adicionar:
  @@index([tenantId, date])
  @@index([tenantId, type])
  @@index([tenantId, recurringExpenseId])
}

model Client {
  // Adicionar:
  @@index([tenantId, createdAt])
}
```

Após editar: `npx prisma migrate dev --name add_performance_indexes`

---

### Melhoria 9: Cron ML com batching e tolerância a falhas

**Arquivo:** `backend/src/ml/ml.service.ts`

```typescript
@Cron('0 3 * * 0')
async weeklyTrainingJob() {
  this.logger.log('Iniciando treino semanal...');
  const users = await this.prisma.user.findMany({ where: {...}, select: { id: true, tenantId: true } });

  const BATCH_SIZE = 5; // treina 5 usuários em paralelo por vez
  let trained = 0, skipped = 0, failed = 0;

  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batch = users.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch
        .filter(u => u.tenantId)
        .map(u => this.trainUserModel(u.id, u.tenantId!))
    );

    for (const result of results) {
      if (result.status === 'rejected') { failed++; this.logger.error(result.reason); }
      else if (result.value.trained) trained++;
      else skipped++;
    }
  }

  this.logger.log(`Treino semanal: ${trained} treinados, ${skipped} pulados, ${failed} com erro.`);
}
```

---

### Melhoria 10: Corrigir port mismatch no Dockerfile do ML

**Arquivo:** `ml-service/Dockerfile`

```dockerfile
# Trocar:
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

# Por:
EXPOSE 8001
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
```

---

## Nível 3 — Roadmap futuro

### Treino incremental (ML não retreina do zero)

Quando implementar: ao atingir ~200 usuários ativos.

```python
# main.py — /train com suporte incremental
@app.post("/train")
def train(req: TrainRequest):
    mp = _model_path(req.userId)
    init_model = None

    # Se já existe modelo, usa como ponto de partida
    if mp.exists():
        init_model = CatBoostRegressor()
        init_model.load_model(str(mp))
        iterations = 100  # menos iterações para ajuste fino
    else:
        iterations = 300  # treino completo para modelo novo

    model = CatBoostRegressor(iterations=iterations, ...)
    model.fit(pool, init_model=init_model)  # continua de onde parou
```

### Threshold de retreino (não retreina se não melhorou)

```typescript
// ml.service.ts
async trainUserModel(...) {
  const currentModel = await this.prisma.mLModel.findFirst({
    where: { userId, isActive: true }
  });

  // Só retreina se ganhou 5+ novas sessões desde o último treino
  const newSessionsCount = await this.prisma.tattooSession.count({
    where: { userId, createdAt: { gt: currentModel?.trainedAt ?? new Date(0) } }
  });

  if (currentModel && newSessionsCount < 5) {
    return { trained: false, reason: 'Menos de 5 sessões novas desde o último treino' };
  }
  // ... continua com treino
}
```

### Substituir KNN manual pelo ML

O `sessions.service.ts` tem um KNN manual em memória para sugerir preços em sessões. Quando o modelo ML estiver estável, esse KNN pode ser removido — o endpoint `/ml/predict` já faz isso de forma mais precisa e sem carregar tudo na memória.

---

## Checklist de execução

### Antes de ir para produção (Nível 1)

- [ ] Criar bucket `ml-models` no Supabase Storage (privado)
- [ ] Implementar upload/download de modelos para Supabase Storage no `ml-service/main.py`
- [ ] Adicionar variáveis `SUPABASE_URL` e `SUPABASE_SERVICE_KEY` no `.env` do ml-service
- [ ] Tornar treinamento ML atômico com `prisma.$transaction`
- [ ] Tornar criação de Sessão + Transaction atômica
- [ ] Corrigir race condition de despesas recorrentes
- [ ] Trocar envio de senha por link de convite nos colaboradores
- [ ] Corrigir port no Dockerfile do ML (8000 → 8001)

### Primeiras semanas em produção (Nível 2)

- [ ] Adicionar paginação em clients, sessions e financial
- [ ] Instalar e configurar `@nestjs/throttler`
- [ ] Adicionar indexes no schema e rodar migration
- [ ] Refatorar cron ML para usar batching com `Promise.allSettled`

### Roadmap (Nível 3)

- [ ] Treino incremental com `init_model` no CatBoost
- [ ] Threshold de retreino (mínimo de sessões novas)
- [ ] Remover KNN manual e usar somente o endpoint ML
- [ ] Swagger/OpenAPI com `@nestjs/swagger`
- [ ] Audit log para operações sensíveis (mudança de senha, config do tenant)
