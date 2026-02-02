Leia o arquivo CLAUDE_CONTEXT.md na raiz do projeto antes de começar.

Sua tarefa é implementar a autenticação completa do backend. Trabalhe dentro da pasta backend/.

---

## 1. Prisma Service

Implemente `src/prisma/prisma.service.ts` e `src/prisma/prisma.module.ts`:
- O PrismaService deve estender PrismaClient e implementar OnModuleInit para conectar ao banco
- O PrismaModule deve ser global para estar disponível em todos os módulos

---

## 2. Configuração de ambiente

Implemente `src/config/env.config.ts`:
- Use @nestjs/config para carregar variáveis do .env
- Valide que DATABASE_URL, JWT_SECRET e JWT_EXPIRATION existem

---

## 3. Common — Guards e Decorators

Implemente `src/common/guards/auth.guard.ts`:
- Guard que verifica se o usuário está autenticado antes de permitir acesso às rotas
- Extrai o token da header Authorization
- Verifica e decodifica o JWT
- Adiciona o usuário ao request

Implemente `src/common/decorators/current-tenant.decorator.ts`:
- Decorator que extrai o tenant_id do usuário autenticado no request
- Usado nos controllers para garantir isolamento multi-tenant

---

## 4. Auth — Strategies

Implemente `src/auth/strategies/local.strategy.ts`:
- Estratégia de autenticação com email e senha
- Valida as credenciais consultando o banco via AuthService

Implemente `src/auth/strategies/google.strategy.ts`:
- Estratégia OAuth com Google
- Usa as variáveis GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET do .env
- Após autenticação bem-sucedida, cria ou atualiza o usuário no banco

---

## 5. Auth — DTOs

Implemente os DTOs em `src/auth/dto/`:

`register.dto.ts`:
- name: string (obrigatório)
- email: string (obrigatório, formato email)
- password: string (obrigatório, mínimo 6 caracteres)
- tenantType: enum TenantType (obrigatório — AUTONOMO ou STUDIO)
- tenantName: string (obrigatório — nome do estúdio ou do próprio tatuador)

`login.dto.ts`:
- email: string (obrigatório, formato email)
- password: string (obrigatório)

`reset-password.dto.ts`:
- email: string (obrigatório, formato email) — para solicitar reset
- token: string (obrigatório) — para validar o token
- newPassword: string (obrigatório, mínimo 6 caracteres) — para definir nova senha

`auth-response.dto.ts`:
- token: string
- user: objeto com id, email, name, role, tenantId

Use class-validator para as validações e Zod para os esquemas.

---

## 6. Auth — Service

Implemente `src/auth/auth.service.ts` com os seguintes métodos:

`register(registerDto)`:
- Verifica se o email já existe no banco
- Cria o Tenant com o tipo e nome fornecidos
- Cria o User com role OWNER e status PENDING_VERIFICATION
- Cria o AuthCredential com a senha hasheada (use bcryptjs)
- Gera um token de verificação de email e salva no AuthCredential
- Retorna o usuário criado (sem retornar a senha)
- Nota: no MVP não envia email ainda (Resend será implementado depois), apenas gera o token

`login(loginDto)`:
- Busca o usuário pelo email
- Verifica se a senha está correta usando bcryptjs
- Verifica se o email foi validado (status não é PENDING_VERIFICATION)
- Gera um JWT com payload contendo userId e tenantId
- Cria uma AuthSession no banco
- Retorna o token e os dados do usuário

`loginWithGoogle(googleUser)`:
- Recebe os dados do usuário que vêm da estratégia Google
- Se o usuário não existe no banco, cria Tenant, User e AuthCredential (tipo google)
- Se já existe, apenas atualiza os dados se necessário
- O usuário criado via Google já fica com status ACTIVE (não precisa validar email)
- Gera JWT e AuthSession igual ao login normal
- Retorna o token e os dados do usuário

`requestPasswordReset(email)`:
- Busca o usuário pelo email
- Gera um token único e uma data de expiração (24 horas)
- Salva o token no AuthCredential
- Retorna sucesso (não revela se o email existe ou não por segurança)
- Nota: no MVP não envia email ainda, apenas gera o token

`validateResetToken(token)`:
- Busca o AuthCredential pelo token
- Verifica se o token não expirou
- Retorna se o token é válido ou não

`resetPassword(token, newPassword)`:
- Busca o AuthCredential pelo token
- Verifica se o token não expirou
- Atualiza a senha com o novo hash
- Limpa o token e a data de expiração
- Retorna sucesso

`verifyEmail(token)`:
- Busca o AuthCredential pelo token de verificação
- Verifica se o token não expirou
- Atualiza o status do usuário para ACTIVE
- Limpa o token de verificação
- Retorna sucesso

`validateToken(token)`:
- Decodifica o JWT
- Busca o usuário no banco pelo id do payload
- Retorna o usuário se válido

---

## 7. Auth — Controller

Implemente `src/auth/auth.controller.ts` com as seguintes rotas:

```
POST   /auth/register          → AuthService.register()
POST   /auth/login             → AuthService.login()
GET    /auth/google            → Redireciona para login com Google (usa estratégia Google)
GET    /auth/google/callback   → Callback do Google OAuth, chama AuthService.loginWithGoogle()
POST   /auth/password/request  → AuthService.requestPasswordReset()
POST   /auth/password/validate → AuthService.validateResetToken()
POST   /auth/password/reset    → AuthService.resetPassword()
POST   /auth/email/verify      → AuthService.verifyEmail()
GET    /auth/me                → Retorna dados do usuário atual (rota protegida pelo AuthGuard)
```

---

## 8. Auth — Module

Implemente `src/auth/auth.module.ts`:
- Importe PrismaModule, PassportModule, JwtModule e ConfigModule
- Configure o JwtModule com o secret e expiração do .env
- Declare AuthController e AuthService
- Exporte AuthService para ser usado em outros módulos se necessário

---

## 9. App Module

Atualize `src/app.module.ts`:
- Importe ConfigModule (com isGlobal: true para carregar .env automaticamente)
- Importe PrismaModule
- Importe AuthModule

---

## 10. Main.ts

Implemente `src/main.ts`:
- Configure a aplicação NestJS
- Habilite validação global usando ValidationPipe do @nestjs/common
- Configure CORS para permitir requisições do frontend (http://localhost:3000)
- Inicie o servidor na porta 3000 (ou da variável PORT do .env)

---

## Regras importantes

- Sempre use tenant_id para isolamento de dados nas queries
- Valores monetários sempre em centavos no banco
- Senhas sempre hasheadas com bcryptjs antes de salvar
- Tokens de reset e verificação devem ter expiração
- Nunca retorne senhas ou tokens sensiveis nas respostas da API
- Use os enums do schema.prisma (não crie novos)