Leia o arquivo CLAUDE_CONTEXT.md na raiz do projeto antes de começar.

Sua tarefa é criar a estrutura de pastas e instalar as dependências do backend. Não implemente nenhuma lógica ainda — apenas crie os arquivos vazios e instale os pacotes necessários.

---

## 1. Instale as dependências dentro da pasta backend/

```bash
cd backend
npm install @nestjs/common @nestjs/core @nestjs/platform-express reflect-metadata rxjs
npm install --save-dev @nestjs/cli @types/node typescript ts-jest @nestjs/testing jest ts-node
npm install @nestjs/cli
npm install @prisma/client prisma
npm install @nestjs/passport passport passport-google-oauth20 passport-local bcryptjs jsonwebtoken
npm install --save-dev @types/passport-google-oauth20 @types/passport-local @types/bcryptjs @types/jsonwebtoken
npm install better-auth
npm install class-validator class-transformer
npm install @nestjs/config dotenv
```

---

## 2. Crie a estrutura de pastas e arquivos vazios

Crie todos os arquivos abaixo dentro de `backend/src/`. Cada arquivo deve estar vazio por enquanto (apenas um comentário com o nome do módulo que ele pertence).

```
backend/src/
├── main.ts
├── app.module.ts
├── app.controller.ts
├── app.service.ts
│
├── common/
│   ├── decorators/
│   │   └── current-tenant.decorator.ts
│   └── guards/
│       └── auth.guard.ts
│
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts
│
├── auth/
│   ├── dto/
│   │   ├── register.dto.ts
│   │   ├── login.dto.ts
│   │   ├── reset-password.dto.ts
│   │   └── auth-response.dto.ts
│   ├── strategies/
│   │   ├── google.strategy.ts
│   │   └── local.strategy.ts
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   └── auth.service.ts
│
├── tenants/
│   ├── dto/
│   │   ├── create-tenant.dto.ts
│   │   ├── update-tenant.dto.ts
│   │   └── tenant-response.dto.ts
│   ├── tenants.module.ts
│   ├── tenants.controller.ts
│   └── tenants.service.ts
│
├── clients/
│   ├── dto/
│   │   ├── create-client.dto.ts
│   │   ├── update-client.dto.ts
│   │   └── client-response.dto.ts
│   ├── clients.module.ts
│   ├── clients.controller.ts
│   └── clients.service.ts
│
├── procedures/
│   ├── dto/
│   │   ├── create-procedure.dto.ts
│   │   ├── update-procedure.dto.ts
│   │   └── procedure-response.dto.ts
│   ├── procedures.module.ts
│   ├── procedures.controller.ts
│   └── procedures.service.ts
│
├── sessions/
│   ├── dto/
│   │   ├── create-session.dto.ts
│   │   ├── update-session.dto.ts
│   │   └── session-response.dto.ts
│   ├── sessions.module.ts
│   ├── sessions.controller.ts
│   └── sessions.service.ts
│
├── financial/
│   ├── dto/
│   │   ├── create-transaction.dto.ts
│   │   ├── update-transaction.dto.ts
│   │   └── transaction-response.dto.ts
│   ├── financial.module.ts
│   ├── financial.controller.ts
│   └── financial.service.ts
│
├── calculator/
│   ├── dto/
│   │   ├── create-cost.dto.ts
│   │   ├── update-cost.dto.ts
│   │   └── calculator-response.dto.ts
│   ├── calculator.module.ts
│   ├── calculator.controller.ts
│   └── calculator.service.ts
│
└── ml/
    ├── dto/
    │   ├── predict.dto.ts
    │   └── prediction-response.dto.ts
    ├── ml.module.ts
    ├── ml.controller.ts
    └── ml.service.ts
```

---

## 3. Crie o tsconfig.json dentro de backend/

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "es2020",
    "lib": ["es2020"],
    "framework": "nestjs",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "resolveJsonModule": true,
    "paths": {
      "@/*": ["./src/*"]
    },
    "baseUrl": "."
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

## 4. Adicione os scripts no package.json do backend

Garanta que o package.json dentro de backend/ tenha estes scripts:

```json
"scripts": {
  "build": "tsc && tscpaths -p tsconfig.json",
  "start": "node dist/main.js",
  "start:dev": "nest start --watch",
  "start:prod": "node dist/main.js",
  "prisma:generate": "prisma generate",
  "prisma:migrate": "prisma migrate dev",
  "prisma:studio": "prisma studio"
}
```

---

## 5. Crie o arquivo .env dentro de backend/

```
# Banco de dados
DATABASE_URL=postgresql://user:password@localhost:5432/inkstudio

# JWT
JWT_SECRET=seu_secret_aqui
JWT_EXPIRATION=7d

# Google OAuth (preencher depois)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Resend (preencher depois)
RESEND_API_KEY=
```

---

Não implemente nenhuma lógica. Apenas crie a estrutura, instale os pacotes eonfigure os arquivos de configuração.