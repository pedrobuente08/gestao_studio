# PLANO DE REFATORAÇÃO PARA BETTER-AUTH

Este documento contém um plano passo a passo para refatorar o sistema de autenticação atual (JWT + bcrypt + Passport) para Better-Auth.

Execute cada fase em ordem, testando após cada uma.

---


## FASE 1: INSTALAR BETTER-AUTH E DEPENDÊNCIAS

### Arquivo de instrução: `INSTRUCAO_FASE1_BETTER_AUTH.md`

```markdown
Leia o CLAUDE_CONTEXT.md na raiz do projeto.

Tarefa: Instalar Better-Auth e suas dependências no backend.

## 1. Instale as dependências dentro de backend/

```bash
cd backend
npm install better-auth
npm install @better-auth/prisma
```

## 2. Remova as dependências antigas que não serão mais necessárias

```bash
npm uninstall passport passport-google-oauth20 passport-local jsonwebtoken
npm uninstall @types/passport-google-oauth20 @types/passport-local @types/jsonwebtoken
```

Nota: bcryptjs ainda será necessário, Better-Auth usa internamente.

## 3. Verifique que o package.json foi atualizado corretamente

Confirme que better-auth e @better-auth/prisma estão em dependencies.
```

---

## FASE 2: ATUALIZAR O SCHEMA DO PRISMA

### Arquivo de instrução: `INSTRUCAO_FASE2_BETTER_AUTH.md`

```markdown
Leia o CLAUDE_CONTEXT.md na raiz do projeto.

Tarefa: Atualizar o schema.prisma para usar as tabelas do Better-Auth mantendo multi-tenant.

## 1. Substitua os modelos de autenticação

Remova completamente estes modelos do schema.prisma:
- AuthCredential
- AuthSession

Mantenha o modelo User, mas simplifique ele para:

```prisma
model User {
  id        String     @id @default(cuid())
  tenantId  String
  email     String     @unique
  name      String
  role      UserRole
  status    UserStatus @default(ACTIVE)
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt

  // Relações
  tenant          Tenant          @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  tattooSessions  TattooSession[]
  procedures      Procedure[]
  benefits        TatuadorBenefit[]
  mlModels        MLModel[]
  mlTrainingData  MLTrainingData[]
  mlPredictions   MLPrediction[]
  
  // Better-Auth relations
  sessions Session[]
  accounts Account[]
}
```

## 2. Adicione os modelos do Better-Auth

Adicione estes modelos ao final do schema.prisma:

```prisma
// ============================================================
// BETTER-AUTH MODELS
// ============================================================

model Session {
  id        String   @id @default(cuid())
  userId    String
  expiresAt DateTime
  token     String   @unique
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model Account {
  id                String   @id @default(cuid())
  userId            String
  type              String   // "email" | "oauth"
  provider          String   // "google" | "credentials"
  providerAccountId String?
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  
  // Para email/password
  password          String?
  emailVerified     DateTime?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
}

model VerificationToken {
  id         String   @id @default(cuid())
  identifier String
  token      String   @unique
  expires    DateTime
  createdAt  DateTime @default(now())

  @@unique([identifier, token])
}
```

## 3. Remova o enum UserStatus PENDING_VERIFICATION

Atualize o enum UserStatus para apenas:

```prisma
enum UserStatus {
  ACTIVE
  INACTIVE
}
```

## 4. Gere a migration

```bash
npx prisma migrate dev --name better-auth-schema
npx prisma generate
```

## 5. Opcional: Limpe o banco

Se você não tem dados importantes:

```bash
npx prisma migrate reset
```

Isso vai limpar tudo e aplicar as migrations do zero.
```

---

## FASE 3: CONFIGURAR BETTER-AUTH NO BACKEND

### Arquivo de instrução: `INSTRUCAO_FASE3_BETTER_AUTH.md`

```markdown
Leia o CLAUDE_CONTEXT.md na raiz do projeto.

Tarefa: Configurar Better-Auth no backend com Prisma adapter e multi-tenant.

## 1. Crie o arquivo de configuração do Better-Auth

Crie `backend/src/config/better-auth.config.ts`:

```typescript
import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Desabilita verificação de email no MVP
  },
  
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      redirectURI: process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/auth/google/callback",
    },
  },
  
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 dias
    updateAge: 60 * 60 * 24, // Atualiza a cada 24h
  },
  
  advanced: {
    generateId: () => {
      // Usa cuid como no resto do sistema
      return Math.random().toString(36).substring(2, 15);
    },
  },
});

export type Auth = typeof auth;
```

## 2. Atualize o .env

Adicione estas variáveis se ainda não tiver:

```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

BETTER_AUTH_SECRET=seu_secret_aqui_bem_longo_e_seguro
```

Gere um secret seguro:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
```

---

## FASE 4: REFATORAR O AUTH SERVICE

### Arquivo de instrução: `INSTRUCAO_FASE4_BETTER_AUTH.md`

```markdown
Leia o CLAUDE_CONTEXT.md na raiz do projeto.

Tarefa: Refatorar completamente o auth.service.ts para usar Better-Auth.

## 1. Reescreva src/auth/auth.service.ts

Substitua completamente o conteúdo por:

```typescript
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponse } from './dto/auth-response.dto';
import { auth } from '../config/better-auth.config';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    // Verifica se o email já existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email já cadastrado');
    }

    // Cria o tenant
    const tenant = await this.prisma.tenant.create({
      data: {
        type: dto.tenantType,
        name: dto.tenantName,
      },
    });

    // Cria o usuário
    const user = await this.prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: dto.email,
        name: dto.name,
        role: 'OWNER',
        status: 'ACTIVE',
      },
    });

    // Usa Better-Auth para criar a conta com senha
    const account = await auth.api.signUpEmail({
      email: dto.email,
      password: dto.password,
      name: dto.name,
    });

    // Vincula a conta Better-Auth ao nosso usuário
    await this.prisma.account.update({
      where: { id: account.id },
      data: { userId: user.id },
    });

    // Cria sessão
    const session = await auth.api.createSession({
      userId: user.id,
    });

    return {
      token: session.token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
      },
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    // Usa Better-Auth para validar credenciais
    const result = await auth.api.signInEmail({
      email: dto.email,
      password: dto.password,
    });

    if (!result.user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Busca nosso usuário
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Usuário inválido ou inativo');
    }

    return {
      token: result.session.token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
      },
    };
  }

  async loginWithGoogle(googleUser: {
    email: string;
    name: string;
    providerAccountId: string;
  }): Promise<AuthResponse> {
    // Busca ou cria usuário
    let user = await this.prisma.user.findUnique({
      where: { email: googleUser.email },
    });

    if (!user) {
      // Cria tenant e usuário
      const tenant = await this.prisma.tenant.create({
        data: {
          type: 'AUTONOMO',
          name: googleUser.name,
        },
      });

      user = await this.prisma.user.create({
        data: {
          tenantId: tenant.id,
          email: googleUser.email,
          name: googleUser.name,
          role: 'OWNER',
          status: 'ACTIVE',
        },
      });
    }

    // Cria ou busca conta OAuth
    let account = await this.prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: 'google',
          providerAccountId: googleUser.providerAccountId,
        },
      },
    });

    if (!account) {
      account = await this.prisma.account.create({
        data: {
          userId: user.id,
          type: 'oauth',
          provider: 'google',
          providerAccountId: googleUser.providerAccountId,
        },
      });
    }

    // Cria sessão
    const session = await auth.api.createSession({
      userId: user.id,
    });

    return {
      token: session.token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
      },
    };
  }

  async validateToken(token: string) {
    const session = await auth.api.getSession({ token });

    if (!session?.user) {
      return null;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tenantId: true,
        status: true,
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      return null;
    }

    return user;
  }

  async logout(token: string) {
    await auth.api.signOut({ token });
    return { message: 'Logout realizado com sucesso' };
  }
}
```

## 2. Delete as strategies

Remova completamente a pasta `src/auth/strategies/`.

## 3. Simplifique os DTOs

Remova os DTOs de reset de senha e verificação de email por enquanto (Better-Auth tem seus próprios endpoints para isso).

Mantenha apenas:
- register.dto.ts
- login.dto.ts
- auth-response.dto.ts
```

---

## FASE 5: ATUALIZAR O AUTH CONTROLLER E GUARD

### Arquivo de instrução: `INSTRUCAO_FASE5_BETTER_AUTH.md`

```markdown
Leia o CLAUDE_CONTEXT.md na raiz do projeto.

Tarefa: Atualizar o controller e o guard para usar Better-Auth.

## 1. Reescreva src/auth/auth.controller.ts

```typescript
import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '../common/guards/auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('google')
  googleAuth() {
    // Redireciona para a URL de auth do Google gerada pelo Better-Auth
    return { url: 'http://localhost:3000/api/auth/sign-in/google' };
  }

  @Get('google/callback')
  async googleCallback(@Req() req) {
    // Better-Auth já processa o callback
    // Aqui você extrai os dados e chama loginWithGoogle
    const googleUser = req.user; // Better-Auth injeta isso
    return this.authService.loginWithGoogle(googleUser);
  }

  @UseGuards(AuthGuard)
  @Get('me')
  async getMe(@Req() req) {
    return req.user;
  }

  @UseGuards(AuthGuard)
  @Post('logout')
  async logout(@Req() req) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    return this.authService.logout(token);
  }
}
```

## 2. Reescreva src/common/guards/auth.guard.ts

```typescript
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../../auth/auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new UnauthorizedException('Token não fornecido');
    }

    const user = await this.authService.validateToken(token);

    if (!user) {
      throw new UnauthorizedException('Token inválido');
    }

    request.user = user;
    return true;
  }
}
```

## 3. Atualize src/auth/auth.module.ts

```typescript
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthGuard } from '../common/guards/auth.guard';

@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard],
  exports: [AuthService, AuthGuard],
})
export class AuthModule {}
```
```

---

## FASE 6: TESTAR NO POSTMAN

### Checklist de testes:

1. **Registro:**
```
POST http://localhost:3000/auth/register
Body: { name, email, password, tenantType, tenantName }
```

2. **Login:**
```
POST http://localhost:3000/auth/login
Body: { email, password }
```

3. **Get Me (rota protegida):**
```
GET http://localhost:3000/auth/me
Header: Authorization: Bearer TOKEN
```

4. **Criar cliente (teste de permissão):**
```
POST http://localhost:3000/clients
Header: Authorization: Bearer TOKEN
Body: { name, email, phone }
```

5. **Logout:**
```
POST http://localhost:3000/auth/logout
Header: Authorization: Bearer TOKEN
```

---

## FASE 7: ATUALIZAR O FRONTEND (se já começou)

Se você já começou o frontend, precisa ajustar:

1. Os endpoints podem ter mudado
2. A estrutura do token pode ser diferente
3. O formato das respostas pode ter mudado

Teste tudo antes de seguir.

---

## ROLLBACK (se algo der errado)

Se em qualquer momento der problema:

```bash
git checkout main
git branch -D refactor/better-auth
```

E você volta pro código que estava funcionando.

---

## PRÓXIMOS PASSOS APÓS SUCESSO

Quando tudo estiver funcionando:

```bash
git add .
git commit -m "feat: refatora autenticação para Better-Auth"
git checkout main
git merge refactor/better-auth
git push origin main
```
```

---

## COMO EXECUTAR ESTE PLANO

**Com Claude Code:**

1. Coloque cada arquivo `INSTRUCAO_FASEX_BETTER_AUTH.md` na raiz do projeto
2. Execute fase por fase:
```
Leia CLAUDE_CONTEXT.md e INSTRUCAO_FASE1_BETTER_AUTH.md e execute.
```
3. Teste após cada fase antes de seguir

**Com Cursor:**

1. Coloque este arquivo completo (`PLANO_BETTER_AUTH.md`) na raiz
2. Selecione todo o conteúdo de uma fase
3. Use Cmd+K (Mac) ou Ctrl+K (Windows) e diga: "Execute esta fase"
4. Teste após cada fase

---

## TEMPO ESTIMADO

- Fase 1: 5 minutos
- Fase 2: 15 minutos
- Fase 3: 10 minutos
- Fase 4: 30 minutos
- Fase 5: 15 minutos
- Fase 6: 15 minutos
- Fase 7: 20 minutos (se necessário)

**Total: ~2 horas**