# Plano Completo de Testes — InkStudio

## Stack atual
- **Backend:** NestJS 11 + Prisma 5 + PostgreSQL (Supabase)
- **Frontend:** Next.js 16 + React 19 + Zustand + React Query + Zod
- **Testes existentes:** Zero

---

## Fase 1 — Instalacao de dependencias

### Backend

```bash
cd backend
npm install --save-dev \
  supertest @types/supertest \
  jest-mock-extended \
  @faker-js/faker
```

O Jest e `@nestjs/testing` ja estao instalados. O `jest-mock-extended` cria mocks tipados do Prisma sem precisar de banco real nos testes unitarios.

### Frontend

```bash
cd frontend
npm install --save-dev \
  vitest @vitejs/plugin-react \
  @testing-library/react @testing-library/user-event @testing-library/jest-dom \
  msw \
  @playwright/test \
  @faker-js/faker
```

O Vitest e preferivel ao Jest no frontend por ser nativo ESM e compativel com o bundler do Next.js.

---

## Fase 2 — Configuracao

### Backend — `backend/jest.config.ts`

```typescript
export default {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.(t|j)s$': 'ts-jest' },
  collectCoverageFrom: ['**/*.(t|j)s', '!**/node_modules/**', '!**/*.module.ts', '!**/main.ts'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
  coverageThreshold: {
    global: { lines: 90, functions: 90, branches: 85, statements: 90 }
  }
};
```

### Backend e2e — `backend/test/jest-e2e.config.ts`

```typescript
export default {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.e2e-spec.ts$',
  transform: { '^.+\\.(t|j)s$': 'ts-jest' },
  testEnvironment: 'node',
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/../src/$1' },
};
```

### Frontend — `frontend/vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      thresholds: { lines: 90, functions: 90, branches: 85 },
      exclude: ['src/tests/**', '**/*.config.*', 'src/types/**'],
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
```

### Frontend setup — `frontend/src/tests/setup.ts`

```typescript
import '@testing-library/jest-dom';
import { server } from './mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### MSW handlers — `frontend/src/tests/mocks/handlers.ts`

Handlers para todas as rotas da API, retornando fixtures realistas:

```typescript
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.post('/auth/login', () => HttpResponse.json({ token: 'fake-jwt', user: mockUser })),
  http.post('/auth/register', () => HttpResponse.json({ token: 'fake-jwt', user: mockUser })),
  http.get('/clients', () => HttpResponse.json({ data: [mockClient], total: 1 })),
  http.get('/sessions', () => HttpResponse.json({ data: [mockSession], total: 1 })),
  http.get('/financial/summary', () => HttpResponse.json(mockSummary)),
  http.get('/calculator', () => HttpResponse.json(mockCalculatorResult)),
  // ... todos os outros endpoints
];
```

### Playwright — `playwright.config.ts` (raiz)

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { channel: 'chromium' } },
  ],
  webServer: [
    { command: 'npm run dev', cwd: './backend', port: 3001, reuseExistingServer: true },
    { command: 'npm run dev', cwd: './frontend', port: 3000, reuseExistingServer: true },
  ],
});
```

---

## Fase 3 — Testes Unitarios Backend

### 3.1 `auth/auth.service.spec.ts`

O mais critico de todos. Cobrir:

| Caso | Descricao |
|------|-----------|
| `register()` — sucesso | Cria Tenant + User + AuthCredential, retorna JWT |
| `register()` — email duplicado | Lanca `ConflictException` |
| `login()` — sucesso | Verifica senha, gera JWT, cria AuthSession |
| `login()` — usuario nao encontrado | Lanca `UnauthorizedException` |
| `login()` — senha errada | Lanca `UnauthorizedException` |
| `login()` — usuario PENDING | Lanca `ForbiddenException` |
| `requestPasswordReset()` | Gera token, seta expiracao em 24h |
| `resetPassword()` — token valido | Atualiza senha com bcrypt |
| `resetPassword()` — token expirado | Lanca `BadRequestException` |
| `verifyEmail()` | Seta status ACTIVE, limpa token |

```typescript
// Exemplo de estrutura
describe('AuthService', () => {
  let service: AuthService;
  let prisma: DeepMockProxy<PrismaClient>; // via jest-mock-extended

  beforeEach(async () => {
    prisma = mockDeep<PrismaClient>();
    const module = await Test.createTestingModule({
      providers: [AuthService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(AuthService);
  });

  it('should hash password on register', async () => {
    prisma.tenant.create.mockResolvedValue(mockTenant);
    prisma.user.create.mockResolvedValue(mockUser);
    const result = await service.register(registerDto);
    expect(result.token).toBeDefined();
    expect(prisma.authCredential.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          password: expect.not.stringContaining('plain_password')
        })
      })
    );
  });
});
```

### 3.2 `clients/clients.service.spec.ts`

| Caso |
|------|
| `create()` — cria com tenantId correto |
| `findAll()` com role OWNER — retorna todos do tenant |
| `findAll()` com role EMPLOYEE — retorna so os do usuario |
| `findById()` — cliente de outro tenant lanca `ForbiddenException` |
| `update()` — campos parciais |
| `delete()` — cliente com sessoes lanca erro (ou cascade) |

### 3.3 `sessions/sessions.service.spec.ts`

Mais complexo por causa das regras de negocio:

| Caso |
|------|
| `create()` — cria sessao e Transaction automaticamente |
| `create()` com guest location — calcula `studioFee` e `tatuadorRevenue` corretamente |
| `create()` sem guest — `studioFee = 0`, `tatuadorRevenue = totalValue` |
| `update()` — atualiza Transaction correspondente |
| `delete()` — deleta Transaction correspondente |
| Calculo de split: 30% studio / 70% tatuador (configuravel) |

### 3.4 `financial/financial.service.spec.ts`

| Caso |
|------|
| `getSummary()` — soma income e expense corretamente |
| `update()` — bloqueia se Transaction vinculada a sessao |
| `delete()` — bloqueia se Transaction vinculada a sessao |
| Filtros: por tipo, categoria, range de data |

### 3.5 `calculator/calculator.service.spec.ts`

Logica pura, facil de testar:

| Caso |
|------|
| Taxa minima = (custos fixos + variaveis) / horas * (1 + margem) |
| Sem custos cadastrados retorna zero |
| Margem de 20% sobre custo base |
| WorkSettings ausente usa defaults |

### 3.6 `common/guards/auth.guard.spec.ts`

| Caso |
|------|
| Token valido — passa e injeta userId/tenantId |
| Token ausente — lanca `UnauthorizedException` |
| Token expirado — lanca `UnauthorizedException` |
| Token com signature errada — lanca `UnauthorizedException` |

### 3.7 `common/guards/roles.guard.spec.ts`

| Caso |
|------|
| OWNER acessando rota de OWNER — passa |
| EMPLOYEE acessando rota de OWNER — bloqueia |
| Rota sem `@Roles()` — passa qualquer role |

---

## Fase 4 — Testes de Integracao Backend (e2e real com DB)

Esses testes sobem a aplicacao NestJS inteira e usam um banco PostgreSQL de teste (variavel `DATABASE_URL_TEST`).

### Setup — `backend/test/helpers/test-app.helper.ts`

```typescript
export async function createTestApp() {
  const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = module.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  await app.init();
  return app;
}

export async function clearDatabase(prisma: PrismaService) {
  // Limpa em ordem correta por causa das FK constraints
  await prisma.mLPrediction.deleteMany();
  await prisma.mLModel.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.tattooSession.deleteMany();
  await prisma.procedure.deleteMany();
  await prisma.client.deleteMany();
  await prisma.authSession.deleteMany();
  await prisma.authCredential.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();
}
```

### 4.1 `backend/test/auth.e2e-spec.ts`

```typescript
describe('Auth (e2e)', () => {
  it('POST /auth/register → 201 com token', ...);
  it('POST /auth/register com email duplicado → 409', ...);
  it('POST /auth/login → 200 com token', ...);
  it('POST /auth/login com senha errada → 401', ...);
  it('GET /auth/me sem token → 401', ...);
  it('GET /auth/me com token valido → 200 com user', ...);
});
```

### 4.2 `backend/test/clients.e2e-spec.ts`

```typescript
describe('Clients (e2e)', () => {
  it('POST /clients → cria cliente no tenant correto', ...);
  it('GET /clients → retorna apenas clientes do tenant', ...);
  it('GET /clients → tenant A nao ve clientes do tenant B', ...); // CRITICO para multi-tenancy
  it('PATCH /clients/:id de outro tenant → 403', ...);
  it('DELETE /clients/:id → remove', ...);
});
```

### 4.3 `backend/test/sessions.e2e-spec.ts`

```typescript
describe('Sessions (e2e)', () => {
  it('POST /sessions → cria sessao e Transaction automaticamente', ...);
  it('POST /sessions com guestLocationId → split correto', ...);
  it('DELETE /sessions/:id → remove Transaction associada', ...);
  it('GET /sessions com role EMPLOYEE → so ver proprias', ...);
});
```

### 4.4 `backend/test/financial.e2e-spec.ts`

```typescript
describe('Financial (e2e)', () => {
  it('GET /financial/summary → totais corretos', ...);
  it('PATCH /financial/:id vinculado a sessao → 422', ...);
  it('DELETE /financial/:id vinculado a sessao → 422', ...);
});
```

---

## Fase 5 — Testes Unitarios Frontend

### 5.1 Utils — `src/utils/*.test.ts`

```typescript
// format-currency.test.ts
describe('formatCurrency', () => {
  it('converte centavos para reais: 1000 → R$ 10,00', ...);
  it('zero → R$ 0,00', ...);
  it('valores negativos', ...);
});

// format-date.test.ts
describe('formatDate', () => {
  it('ISO string → DD/MM/YYYY', ...);
  it('preserva timezone', ...);
});
```

### 5.2 Stores — `src/stores/auth.store.test.ts`

```typescript
describe('AuthStore', () => {
  it('setAuth → seta user, token e isAuthenticated', ...);
  it('clearAuth → limpa tudo e remove do localStorage', ...);
  it('initializeFromStorage → recupera token do localStorage', ...);
  it('initializeFromStorage sem token → isAuthenticated = false', ...);
});
```

### 5.3 Services — `src/services/*.test.ts`

Com MSW mockando a API:

```typescript
describe('AuthService', () => {
  it('login() → chama POST /auth/login com credenciais', ...);
  it('login() com 401 → lanca erro', ...);
  it('register() → chama POST /auth/register', ...);
});
```

### 5.4 Hooks — `src/hooks/*.test.tsx`

```typescript
// use-clients.test.tsx
describe('useClients', () => {
  it('busca lista de clientes', ...);
  it('loading state correto durante fetch', ...);
  it('erro de API propagado', ...);
});

// use-auth.test.tsx
describe('useAuth', () => {
  it('login bem sucedido → store atualizado', ...);
  it('login com erro → mensagem de erro', ...);
  it('logout → clearAuth chamado', ...);
});
```

### 5.5 Componentes UI — `src/components/ui/*.test.tsx`

```typescript
// button.test.tsx
describe('Button', () => {
  it('renderiza com children', ...);
  it('variant="destructive" aplica classe correta', ...);
  it('disabled=true previne click', ...);
  it('loading=true mostra spinner', ...);
});

// Idem para: input.test.tsx, table.test.tsx, modal.test.tsx
```

### 5.6 Componentes de pagina — `src/app/**/*.test.tsx`

```typescript
// login/page.test.tsx
describe('LoginPage', () => {
  it('renderiza campos de email e senha', ...);
  it('submit com campos vazios → mostra erros de validacao Zod', ...);
  it('submit valido → chama AuthService.login', ...);
  it('erro de API → exibe mensagem de erro', ...);
  it('login bem sucedido → redireciona para /dashboard', ...);
});

// clients/page.test.tsx
describe('ClientsPage', () => {
  it('renderiza lista de clientes', ...);
  it('loading state enquanto busca', ...);
  it('busca por nome filtra lista', ...);
  it('clicar em deletar → exibe modal de confirmacao', ...);
});
```

### 5.7 Route Guard — `src/components/auth/route-guard.test.tsx`

```typescript
describe('RouteGuard', () => {
  it('usuario autenticado → renderiza children', ...);
  it('usuario nao autenticado → redireciona para /login', ...);
  it('loading → mostra spinner, nao redireciona prematuramente', ...);
});
```

---

## Fase 6 — Testes E2E (Playwright)

Esses testam fluxos completos com backend + frontend reais contra banco de teste.

### 6.1 `e2e/auth.spec.ts` — Fluxo de autenticacao

```typescript
test('registro e login completo', async ({ page }) => {
  await page.goto('/register');
  await page.fill('[name=tenantName]', 'Studio Teste');
  await page.fill('[name=email]', 'teste@example.com');
  await page.fill('[name=password]', 'Senha123!');
  await page.click('[type=submit]');
  await expect(page).toHaveURL('/dashboard');

  // Logout e login novamente
  await page.click('[data-testid=logout]');
  await page.fill('[name=email]', 'teste@example.com');
  await page.fill('[name=password]', 'Senha123!');
  await page.click('[type=submit]');
  await expect(page).toHaveURL('/dashboard');
});

test('login com credenciais erradas → mensagem de erro', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name=email]', 'naoexiste@example.com');
  await page.fill('[name=password]', 'senhaErrada');
  await page.click('[type=submit]');
  await expect(page.locator('[data-testid=error-message]')).toBeVisible();
});

test('acesso a rota protegida sem login → redirect para /login', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL('/login');
});
```

### 6.2 `e2e/clients.spec.ts` — CRUD de clientes

```typescript
test('criar, visualizar e deletar cliente', async ({ page }) => {
  await loginAs(page, 'owner');
  await page.goto('/clients');
  await page.click('[data-testid=btn-new-client]');
  await page.fill('[name=name]', 'Joao Silva');
  await page.fill('[name=phone]', '11999999999');
  await page.click('[type=submit]');
  await expect(page.locator('text=Joao Silva')).toBeVisible();

  await page.click('[data-testid=btn-delete-client]');
  await page.click('[data-testid=btn-confirm-delete]');
  await expect(page.locator('text=Joao Silva')).not.toBeVisible();
});
```

### 6.3 `e2e/sessions.spec.ts` — Sessao de tatuagem

```typescript
test('criar sessao gera transacao financeira automaticamente', async ({ page }) => {
  await loginAs(page, 'owner');
  await page.goto('/sessions');
  await page.click('[data-testid=btn-new-session]');
  // Preencher formulario...
  await page.click('[type=submit]');

  await page.goto('/financial');
  await expect(page.locator('[data-testid=transaction-list]')).toContainText('Sessao de tatuagem');
});
```

### 6.4 `e2e/financial.spec.ts` — Dashboard financeiro

```typescript
test('summary reflete sessoes criadas', async ({ page }) => {
  await loginAs(page, 'owner');
  await page.goto('/financial');
  await expect(page.locator('[data-testid=summary-income]')).toBeVisible();
  await expect(page.locator('[data-testid=summary-balance]')).toBeVisible();
});
```

### 6.5 `e2e/calculator.spec.ts` — Calculadora

```typescript
test('adicionar custo fixo atualiza taxa minima', async ({ page }) => {
  await loginAs(page, 'owner');
  await page.goto('/calculator');
  const rateBefore = await page.locator('[data-testid=min-rate]').textContent();
  // Adicionar custo...
  const rateAfter = await page.locator('[data-testid=min-rate]').textContent();
  expect(rateAfter).not.toBe(rateBefore);
});
```

### 6.6 `e2e/multi-tenancy.spec.ts` — Isolamento entre tenants (CRITICO)

```typescript
test('tenant A nao ve dados do tenant B', async ({ browser }) => {
  const pageA = await loginInNewPage(browser, 'tenantA@example.com');
  const pageB = await loginInNewPage(browser, 'tenantB@example.com');

  // Tenant A cria cliente
  await createClient(pageA, 'Cliente Secreto');

  // Tenant B nao deve ver esse cliente
  await pageB.goto('/clients');
  await expect(pageB.locator('text=Cliente Secreto')).not.toBeVisible();
});
```

---

## Fase 7 — CI/CD (GitHub Actions)

### `.github/workflows/test.yml`

```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  backend-unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json
      - run: npm ci
        working-directory: backend
      - run: npm run test:cov
        working-directory: backend
      - uses: actions/upload-artifact@v4
        with:
          name: backend-coverage
          path: backend/coverage

  backend-e2e:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: inkstudio_test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports: ['5432:5432']
        options: --health-cmd pg_isready --health-interval 10s
    env:
      DATABASE_URL: postgresql://test:test@localhost:5432/inkstudio_test
      JWT_SECRET: test-secret
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json
      - run: npm ci && npx prisma migrate deploy
        working-directory: backend
      - run: npm run test:e2e
        working-directory: backend

  frontend-unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      - run: npm ci
        working-directory: frontend
      - run: npm run test:cov
        working-directory: frontend

  e2e:
    runs-on: ubuntu-latest
    needs: [backend-unit, frontend-unit]
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: inkstudio_test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports: ['5432:5432']
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci && npx prisma migrate deploy
        working-directory: backend
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/inkstudio_test
      - run: npm ci
        working-directory: frontend
      - run: npx playwright install --with-deps chromium
      - run: npx playwright test
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/inkstudio_test
          JWT_SECRET: test-secret
          NEXT_PUBLIC_API_URL: http://localhost:3001
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Resumo de cobertura esperada

| Camada | Ferramenta | Meta |
|--------|-----------|------|
| Backend unit (services, guards) | Jest | 90%+ linhas |
| Backend e2e (HTTP real + DB) | Supertest | 100% das rotas |
| Frontend utils/stores | Vitest | 100% |
| Frontend hooks/services | Vitest + MSW | 90%+ |
| Frontend components | Vitest + RTL | 85%+ |
| Fluxos completos | Playwright | Todos os fluxos criticos |

---

## Ordem de implementacao recomendada

1. **Configurar Jest no backend** + primeiro spec de `AuthService` (valida a setup)
2. **Specs dos outros services** (Clients, Sessions, Financial, Calculator, Guards)
3. **Testes e2e do backend** com banco de teste real
4. **Configurar Vitest no frontend** + testes de utils e stores
5. **Testes de hooks e services** com MSW
6. **Testes de componentes** (paginas e UI)
7. **Playwright** para fluxos completos
8. **GitHub Actions** para rodar tudo no CI
