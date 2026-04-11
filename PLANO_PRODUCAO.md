# Plano de Produção — Gestão Studio

> Foco: tatuadores autônomos. Um plano por usuário, cobrança mensal via Stripe.

---

## Visão geral da infraestrutura

O projeto tem três serviços independentes. Cada um vai para uma plataforma diferente:

| Serviço | Tecnologia | Plataforma |
|---------|-----------|------------|
| Frontend | Next.js 14 | **Vercel** |
| Backend | NestJS | **Railway** |
| ML Service | Python FastAPI | **Railway** |
| Banco de dados | PostgreSQL | **Supabase** (já existe) |
| Storage | Arquivos/fotos | **Supabase Storage** (já existe) |
| Email transacional | — | **Resend** (já existe) |
| Pagamentos | — | **Stripe** |

> **Por que não tudo na Vercel?** A Vercel roda funções serverless — sem estado, sem processo contínuo. O NestJS precisa de um servidor persistente (sessões, cron jobs, conexão com banco). O Railway resolve isso com simplicidade parecida com a Vercel.

---

## Etapa 1 — Domínio e DNS

**Ação:** Comprar o domínio (ex: `gestaostudio.com.br`) no Registro.br ou Hostinger.

**Subdividir os serviços:**
```
app.gestaostudio.com.br     → Frontend (Vercel)
api.gestaostudio.com.br     → Backend (Railway)
ml.gestaostudio.com.br      → ML Service (Railway) — interno, mas útil ter
```

---

## Etapa 2 — Supabase (banco de dados)

O banco já existe. Antes de ir para produção:

- [ ] Criar um **novo projeto Supabase para produção** separado do dev (evita misturar dados reais com testes)
- [ ] Rodar `npx prisma migrate deploy` apontando para a URL do projeto de produção
- [ ] Criar bucket `ml-models` em **Storage → New bucket** como **privado**
- [ ] Em **Settings → API**, copiar:
  - `DATABASE_URL` (connection pooling — porta 6543)
  - `DIRECT_URL` (conexão direta — porta 5432, para migrations)
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY` (para o ML service fazer upload dos modelos)

---

## Etapa 3 — Railway (Backend NestJS)

### 3.1 Criar conta e projeto

1. Acessar [railway.app](https://railway.app) → **New Project → Deploy from GitHub repo**
2. Selecionar o repositório, apontar para a pasta `backend/`
3. Railway detecta Node.js automaticamente

### 3.2 Configurar o build

Criar `backend/Dockerfile` (Railway aceita Dockerfile ou buildpack):

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
EXPOSE 3001
CMD ["node", "dist/main.js"]
```

Ou simplesmente configurar no Railway:
- **Build command:** `npm run build`
- **Start command:** `node dist/main.js`
- **Root directory:** `backend`

### 3.3 Variáveis de ambiente do backend

```env
NODE_ENV=production
PORT=3001

# Banco
DATABASE_URL=postgresql://...pooler...
DIRECT_URL=postgresql://...direct...

# Auth
BETTER_AUTH_SECRET=<openssl rand -hex 32>
BETTER_AUTH_URL=https://api.gestaostudio.com.br
APP_URL=https://app.gestaostudio.com.br
EXTRA_TRUSTED_ORIGINS=https://app.gestaostudio.com.br

# Email
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@gestaostudio.com.br

# Google OAuth (se for usar)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# ML Service (URL interna do Railway ou pública)
ML_SERVICE_URL=https://ml.gestaostudio.com.br

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Supabase Storage
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
```

### 3.4 Domínio customizado

No Railway: **Settings → Domains → Add custom domain** → `api.gestaostudio.com.br`

---

## Etapa 4 — Railway (ML Service Python)

### 4.1 Criar segundo serviço no mesmo projeto Railway

**New Service → GitHub repo → Root directory:** `ml-service`

### 4.2 Dockerfile do ML service

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8001
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
```

### 4.3 Variáveis de ambiente do ML service

```env
PORT=8001
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
```

### 4.4 Persistência dos modelos

O ML service precisa salvar modelos no Supabase Storage (não no disco). Enquanto não implementa o upload/download, adicionar **volume persistente** no Railway:

**Railway → Service → Volumes → Add Volume → Mount path:** `/app/models`

---

## Etapa 5 — Vercel (Frontend Next.js)

### 5.1 Deploy

1. Acessar [vercel.com](https://vercel.com) → **New Project → Import Git Repository**
2. Selecionar o repositório
3. **Root directory:** `frontend`
4. Vercel detecta Next.js automaticamente

### 5.2 Variáveis de ambiente do frontend

```env
NEXT_PUBLIC_API_URL=https://api.gestaostudio.com.br
NEXT_PUBLIC_APP_URL=https://app.gestaostudio.com.br
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### 5.3 Domínio customizado

**Vercel → Project → Settings → Domains** → adicionar `app.gestaostudio.com.br`

---

## Etapa 6 — Cobrança por assinatura (Stripe)

Esta é a parte que exige mais implementação nova no código.

### 6.1 Criar conta Stripe

- Acessar [stripe.com](https://stripe.com) → criar conta brasileira
- Ativar conta com CNPJ (mesmo que MEI do tatuador — é o seu CNPJ, não o deles)
- Em **Products → Add product**: criar plano mensal (ex: R$ 49,90/mês)
- Copiar o `Price ID` (ex: `price_1Abc...`)

### 6.2 O que precisa ser implementado no backend

```
backend/src/billing/
  billing.module.ts
  billing.controller.ts   ← cria checkout session, portal do cliente
  billing.service.ts      ← lógica de assinatura
  webhook.controller.ts   ← recebe eventos do Stripe
```

**Fluxo básico:**

```
1. Usuário clica "Assinar"
2. Frontend → POST /billing/checkout
3. Backend cria Stripe Checkout Session e retorna URL
4. Usuário paga no Stripe
5. Stripe → POST /billing/webhook (payment_intent.succeeded / subscription.created)
6. Backend atualiza status do tenant no banco
7. Guard verifica se tenant tem assinatura ativa antes de liberar rotas
```

**Campos a adicionar no schema Prisma:**

```prisma
model Tenant {
  // ... campos existentes ...
  stripeCustomerId     String?  @unique
  stripeSubscriptionId String?  @unique
  subscriptionStatus   String?  // active, trialing, past_due, canceled
  trialEndsAt          DateTime?
  currentPeriodEnd     DateTime?
}
```

### 6.3 Guard de assinatura

```typescript
// Middleware que bloqueia acesso às rotas protegidas se assinatura vencida
if (tenant.subscriptionStatus !== 'active' && tenant.subscriptionStatus !== 'trialing') {
  throw new ForbiddenException('SUBSCRIPTION_REQUIRED');
}
```

### 6.4 Trial gratuito

Configurar no Stripe: **14 dias grátis** ao criar a subscription. O campo `trialEndsAt` fica preenchido e o guard permite acesso durante o trial.

### 6.5 Portal do cliente (cancelamento, trocar cartão)

O Stripe tem um portal pronto — sem precisar construir. Apenas:

```typescript
// billing.service.ts
async createPortalSession(customerId: string) {
  const session = await this.stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.APP_URL}/dashboard`,
  });
  return { url: session.url };
}
```

---

## Etapa 7 — Configurações de produção obrigatórias

### 7.1 Google OAuth — redirecionar para domínio de produção

No [Google Cloud Console](https://console.cloud.google.com):
- **APIs & Services → Credentials → OAuth 2.0 Client**
- Adicionar em **Authorized redirect URIs:**
  ```
  https://api.gestaostudio.com.br/api/auth/callback/google
  ```

### 7.2 Resend — domínio de email verificado

No [Resend](https://resend.com):
- **Domains → Add domain** → `gestaostudio.com.br`
- Adicionar os registros DNS (SPF, DKIM) no registrador do domínio
- Isso evita que os emails caiam no spam

### 7.3 Webhook do Stripe

No Stripe Dashboard → **Webhooks → Add endpoint:**
```
URL: https://api.gestaostudio.com.br/billing/webhook
Eventos: customer.subscription.created, customer.subscription.updated,
          customer.subscription.deleted, invoice.payment_failed
```

Copiar o `Signing secret` → variável `STRIPE_WEBHOOK_SECRET` no Railway.

---

## Etapa 8 — Checklist final antes de abrir para usuários

### Banco
- [ ] Migration rodada em produção (`prisma migrate deploy`)
- [ ] Bucket `ml-models` criado no Supabase Storage (privado)
- [ ] Seed de tipos de serviço rodado (Tatuagem, Piercing, Laser)

### Backend
- [ ] `NODE_ENV=production` configurado
- [ ] Todas as variáveis de ambiente presentes
- [ ] Health check respondendo (`GET /` retorna 200)
- [ ] CORS apontando para o domínio de produção

### Frontend
- [ ] `NEXT_PUBLIC_API_URL` apontando para `api.gestaostudio.com.br`
- [ ] Build sem erros de TypeScript

### Segurança (já implementado)
- [x] Helmet configurado
- [x] Rate limiting global + regras específicas no Better Auth
- [x] Swagger desabilitado em produção
- [x] Upload de arquivo com validação de tipo e tamanho
- [x] Convite de colaborador via token (sem senha em email)
- [x] CORS com whitelist por variável de ambiente
- [x] Validação de variáveis de ambiente na inicialização

### Pagamentos
- [ ] Produto e plano criados no Stripe
- [ ] Módulo de billing implementado no backend
- [ ] Guard de assinatura protegendo as rotas
- [ ] Webhook configurado e testado
- [ ] Portal do cliente funcionando

### Emails
- [ ] Domínio verificado no Resend
- [ ] Testar email de verificação, reset de senha e convite de colaborador

### Monitoramento mínimo
- [ ] Logs do Railway configurados (ficam disponíveis automaticamente)
- [ ] Alertas de falha de pagamento configurados no Stripe (por email)

---

## Ordem de execução recomendada

```
1. Criar projeto Supabase de produção + rodar migrations
2. Criar conta Railway + deploy do backend
3. Criar conta Railway + deploy do ML service
4. Criar conta Vercel + deploy do frontend
5. Configurar domínios (Vercel + Railway)
6. Verificar domínio de email no Resend
7. Criar produto no Stripe
8. Implementar módulo de billing no backend
9. Testar fluxo completo: cadastro → trial → pagamento → acesso
10. Abrir para os primeiros usuários
```

---

## Custo estimado da infraestrutura (início)

| Serviço | Plano | Custo |
|---------|-------|-------|
| Vercel | Hobby (gratuito até projetos pessoais) | R$ 0 |
| Railway | Starter — paga por uso | ~R$ 25–50/mês |
| Supabase | Free tier (500MB, 50k linhas) | R$ 0 |
| Resend | Free (3.000 emails/mês) | R$ 0 |
| Stripe | Sem mensalidade — 2,9% + R$ 0,30 por transação | Por transação |
| Domínio | .com.br no Registro.br | ~R$ 40/ano |

**Total fixo inicial:** ~R$ 25–50/mês (só o Railway)

Com 10 assinantes a R$ 49,90: R$ 499/mês de receita. Infraestrutura paga a partir do primeiro cliente.
