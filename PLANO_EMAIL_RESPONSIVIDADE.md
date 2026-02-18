# InkStudio — Plano: Email Transacional + Responsividade Mobile-First

Leia o arquivo `CLAUDE_CONTEXT.md` antes de começar qualquer implementação.

---

## VISÃO GERAL

Este documento cobre três implementações futuras:

1. **Verificação de email** — Usuário recebe link por email após cadastro
2. **Recuperação de senha** — Usuário recebe link por email para redefinir senha
3. **Responsividade Mobile-First** — Todas as páginas adaptadas para mobile

Ferramenta de email: **Resend** (`npm install resend`)

---

## PARTE 1 — VERIFICAÇÃO DE EMAIL

### Estado Atual

O registro cria o usuário com `status: ACTIVE` imediatamente, sem verificar o email.
O modelo `VerificationToken` já existe no schema do Prisma.
O campo `emailVerified` já existe no modelo `Account`.

### O que precisa ser feito

---

### 1.1 Variáveis de Ambiente

Adicionar ao `backend/.env`:

```env
RESEND_API_KEY=re_xxxxxxxxxx
RESEND_FROM_EMAIL=noreply@inkstudio.com.br
APP_URL=http://localhost:3000
```

---

### 1.2 Schema do Prisma — Ajuste no User

O modelo `User` precisa de um campo `emailVerified` para controlar o estado de verificação.
Atualmente apenas `Account.emailVerified` existe (campo da Better-Auth).
Usar `Account.emailVerified` é suficiente — não precisa alterar o schema.

---

### 1.3 Backend — EmailModule

Criar `backend/src/email/`:

```
email/
├── email.module.ts
├── email.service.ts
└── templates/
    ├── verify-email.template.ts
    └── reset-password.template.ts
```

**`email.service.ts`** — métodos:

```typescript
sendVerificationEmail(to: string, name: string, token: string): Promise<void>
// Envia email com link: {APP_URL}/verify-email?token={token}

sendPasswordResetEmail(to: string, name: string, token: string): Promise<void>
// Envia email com link: {APP_URL}/reset-password?token={token}
```

Usar Resend:
```typescript
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);
await resend.emails.send({ from, to, subject, html });
```

**`email.module.ts`** — exportar `EmailService` para uso em `AuthModule`.

---

### 1.4 Backend — Alterações no AuthService

**`register()`** — mudar para:
1. Criar usuário com `status: 'ACTIVE'` (mantém igual)
2. Criar conta com `emailVerified: null`
3. Gerar token de verificação e salvar em `VerificationToken`:
   - `identifier` = email do usuário
   - `token` = token aleatório criptograficamente seguro (`crypto.randomBytes(32).toString('hex')`)
   - `expires` = agora + 24 horas
4. Chamar `emailService.sendVerificationEmail()`
5. **NÃO retornar sessão** — retornar apenas `{ message: 'Verifique seu email para ativar a conta' }`

**`login()`** — adicionar verificação:
```typescript
const account = user.accounts[0];
if (!account.emailVerified) {
  throw new UnauthorizedException('Email não verificado. Verifique sua caixa de entrada.');
}
```

Novo método **`verifyEmail(token: string)`**:
1. Buscar `VerificationToken` pelo token
2. Se não encontrar ou expirado → `BadRequestException('Token inválido ou expirado')`
3. Atualizar `Account.emailVerified = new Date()`
4. Deletar o `VerificationToken` usado
5. Criar sessão e retornar `AuthResponse` (faz login automático após verificação)

Novo método **`resendVerificationEmail(email: string)`**:
1. Buscar usuário pelo email
2. Verificar se `Account.emailVerified` é null
3. Invalidar tokens anteriores do mesmo identifier
4. Gerar novo token e enviar email novamente

---

### 1.5 Backend — Novos Endpoints no AuthController

```typescript
@Post('email/verify')
verifyEmail(@Body() dto: VerifyEmailDto) {
  return this.authService.verifyEmail(dto.token);
}

@Post('email/resend')
resendVerification(@Body() dto: ResendVerificationDto) {
  return this.authService.resendVerificationEmail(dto.email);
}
```

**DTOs novos** em `auth/dto/`:
- `VerifyEmailDto` — `token: string` (IsString, IsNotEmpty)
- `ResendVerificationDto` — `email: string` (IsEmail, IsNotEmpty)

---

### 1.6 Frontend — Nova Página de Verificação

Criar `frontend/src/app/(auth)/verify-email/page.tsx`:

**Estados da página:**

**Estado A — Aguardando verificação (sem token na URL):**
- Ícone de email
- Mensagem: "Enviamos um link de verificação para {email}"
- Botão "Reenviar email" (chama `POST /auth/email/resend`)
- Link "Voltar para login"
- Mostrar sucesso ao reenviar

**Estado B — Verificando (com token na URL):**
- Spinner enquanto valida
- Chama `POST /auth/email/verify` ao montar o componente
- Se sucesso: salva token no store + redireciona para /dashboard
- Se erro: mostra mensagem + link para solicitar novo email

**Ajuste no `register/page.tsx`:**
- Após registro bem-sucedido, redirecionar para `/verify-email` (não mais para `/dashboard`)
- Passar email via query param: `/verify-email?email=usuario@email.com`

**Ajuste no `login/page.tsx`:**
- Tratar erro de email não verificado: mostrar mensagem com link "Reenviar email de verificação"

**Novo método no `auth.service.ts`:**
```typescript
verifyEmail(token: string): Promise<AuthResponse>
resendVerificationEmail(email: string): Promise<{ message: string }>
```

---

## PARTE 2 — RECUPERAÇÃO DE SENHA

### Estado Atual

O frontend já tem a página `reset-password/page.tsx` com os dois estados (solicitar + redefinir).
O backend tem os DTOs (`reset-password.dto.ts`) mas **não tem os endpoints implementados**.
O `auth.service.ts` não tem os métodos de reset.

### O que precisa ser feito

---

### 2.1 Backend — Métodos no AuthService

Novo método **`requestPasswordReset(email: string)`**:
1. Buscar usuário pelo email — se não encontrar, retornar sucesso mesmo assim (segurança)
2. Invalidar tokens anteriores (`VerificationToken` com mesmo identifier)
3. Gerar token: `crypto.randomBytes(32).toString('hex')`
4. Salvar em `VerificationToken`:
   - `identifier` = `password-reset:{email}` (prefixo para diferenciar de verificação de email)
   - `expires` = agora + 1 hora
5. Chamar `emailService.sendPasswordResetEmail()`
6. Retornar `{ message: 'Se o email existir, você receberá as instruções' }`

Novo método **`validateResetToken(token: string)`**:
1. Buscar `VerificationToken` pelo token
2. Verificar se o identifier começa com `password-reset:`
3. Se inválido ou expirado → retornar `{ valid: false }`
4. Retornar `{ valid: true }`

Novo método **`resetPassword(token: string, newPassword: string)`**:
1. Buscar e validar `VerificationToken`
2. Extrair email do identifier (`password-reset:{email}`)
3. Buscar usuário e conta
4. Hash da nova senha com bcrypt
5. Atualizar `Account.password`
6. Deletar o `VerificationToken` usado
7. Invalidar todas as sessões ativas do usuário (`Session.deleteMany({ userId })`)
8. Retornar `{ message: 'Senha redefinida com sucesso' }`

---

### 2.2 Backend — Endpoints no AuthController

```typescript
@Post('password/request')
requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
  return this.authService.requestPasswordReset(dto.email);
}

@Post('password/validate')
validateResetToken(@Body() dto: ValidateResetTokenDto) {
  return this.authService.validateResetToken(dto.token);
}

@Post('password/reset')
resetPassword(@Body() dto: ResetPasswordDto) {
  return this.authService.resetPassword(dto.token, dto.newPassword);
}
```

Os DTOs já existem em `auth/dto/reset-password.dto.ts`.

---

### 2.3 Frontend — Nenhuma Alteração Necessária

O `reset-password/page.tsx` já está implementado corretamente.
O `auth.service.ts` já tem os métodos `requestPasswordReset`, `validateResetToken` e `resetPassword`.
O `use-auth.ts` já expõe as mutations correspondentes.

**Só precisa o backend implementar os endpoints.**

---

### 2.4 Templates de Email (Resend)

Criar `backend/src/email/templates/`:

**`verify-email.template.ts`:**
```typescript
export function verifyEmailTemplate(name: string, verificationUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>...</head>
      <body style="background:#09090b; color:#f4f4f5; font-family:sans-serif;">
        <div style="max-width:600px; margin:0 auto; padding:40px 20px;">
          <h1 style="color:#f43f5e;">InkStudio</h1>
          <h2>Olá, ${name}!</h2>
          <p>Confirme seu email para ativar sua conta:</p>
          <a href="${verificationUrl}"
             style="display:inline-block; background:#e11d48; color:#fff;
                    padding:12px 24px; border-radius:8px; text-decoration:none;">
            Verificar Email
          </a>
          <p style="color:#71717a; font-size:12px;">
            Link válido por 24 horas. Se não solicitou, ignore este email.
          </p>
        </div>
      </body>
    </html>
  `;
}
```

**`reset-password.template.ts`:** — estrutura similar, validade de 1 hora.

---

## PARTE 3 — RESPONSIVIDADE MOBILE-FIRST

### Filosofia

Tailwind CSS já é mobile-first. O padrão é: estilos sem prefixo = mobile, `sm:` = ≥640px, `md:` = ≥768px, `lg:` = ≥1024px.

---

### 3.1 Páginas de Auth (login, register, reset-password, verify-email)

As páginas de auth já são razoavelmente responsivas — ocupam largura máxima em mobile.

**Ajustes necessários:**

**`(auth)/layout.tsx`:**
```tsx
// Atual: padding fixo
<div className="w-full max-w-md px-4">

// Proposto: safe area para dispositivos com notch
<div className="w-full max-w-md px-4 pt-safe pb-safe">
```

**Formulários em geral:**
- Campos com `py-3` já são touch-friendly (mínimo 44px de altura) ✅
- Botões com `py-3` já são touch-friendly ✅
- Espaçamento `space-y-6` adequado para mobile ✅

**`register/page.tsx` — Radio buttons:**
```tsx
// Atual: lado a lado (funciona em mobile)
<div className="flex gap-4">

// Proposto: em mobile empilhar, em telas maiores lado a lado
<div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
  <label className="flex items-center gap-2 p-3 rounded-lg border border-zinc-700 cursor-pointer">
    {/* Touch target maior */}
  </label>
```

---

### 3.2 Layout do Dashboard

**`(dashboard)/layout.tsx`** — estrutura atual é um placeholder simples. Implementar layout completo:

```tsx
// Mobile: sidebar como drawer (overlay)
// Desktop: sidebar fixo lateral
<div className="flex min-h-screen">
  {/* Sidebar — hidden no mobile, visível no desktop */}
  <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
    <Sidebar />
  </aside>

  {/* Conteúdo principal */}
  <div className="flex flex-col flex-1 lg:pl-64">
    {/* Header mobile com botão de menu */}
    <Header onMenuToggle={toggleSidebar} />

    {/* Drawer mobile */}
    {isSidebarOpen && (
      <div className="fixed inset-0 z-50 lg:hidden">
        <div className="fixed inset-0 bg-black/60" onClick={closeSidebar} />
        <div className="fixed inset-y-0 left-0 w-72 bg-zinc-900">
          <Sidebar onClose={closeSidebar} />
        </div>
      </div>
    )}

    <main className="flex-1 p-4 sm:p-6 lg:p-8">
      {children}
    </main>
  </div>
</div>
```

---

### 3.3 Sidebar (`components/layout/sidebar.tsx`)

O arquivo existe mas está vazio. Implementar com responsividade:

**Itens de navegação:**
```typescript
const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: HomeIcon },
  { href: '/clients', label: 'Clientes', icon: UsersIcon },
  { href: '/procedures', label: 'Procedimentos', icon: ClipboardIcon },
  { href: '/sessions', label: 'Sessões', icon: CalendarIcon },
  { href: '/financial', label: 'Financeiro', icon: CurrencyIcon },
  { href: '/calculator', label: 'Calculadora', icon: CalculatorIcon },
];
```

**Comportamento:**
- Desktop: sidebar sempre visível, 256px de largura
- Mobile: drawer que abre sobre o conteúdo (z-index alto)
- Item ativo destacado com cor rose-500
- Ícones de 20px, texto visível (não colapsar em ícones apenas)

---

### 3.4 Header (`components/layout/header.tsx`)

O arquivo existe mas está vazio. Implementar:

```tsx
// Mobile: botão hamburger + logo centralizado + avatar
// Desktop: breadcrumb/título da página + avatar com nome do usuário

<header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950">
  <div className="flex h-16 items-center px-4 sm:px-6">
    {/* Botão de menu — apenas mobile */}
    <button className="lg:hidden mr-4" onClick={onMenuToggle}>
      <MenuIcon />
    </button>

    {/* Logo — apenas mobile */}
    <span className="lg:hidden text-rose-500 font-bold">InkStudio</span>

    {/* Espaço flexível */}
    <div className="flex-1" />

    {/* Avatar e nome do usuário */}
    <div className="flex items-center gap-3">
      <div className="hidden sm:block text-right">
        <p className="text-sm font-medium text-zinc-100">{user?.name}</p>
        <p className="text-xs text-zinc-400">{user?.role}</p>
      </div>
      <div className="h-8 w-8 rounded-full bg-rose-500/20 flex items-center justify-center">
        <span className="text-sm font-medium text-rose-500">
          {user?.name?.charAt(0).toUpperCase()}
        </span>
      </div>
    </div>
  </div>
</header>
```

---

### 3.5 Páginas do Dashboard — Grid Responsivo

**`dashboard/page.tsx` — Cards de métricas:**
```tsx
// 1 coluna mobile → 2 colunas sm → 4 colunas lg
<div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
```

**Tabelas — scroll horizontal em mobile:**
```tsx
<div className="overflow-x-auto rounded-lg border border-zinc-800">
  <table className="min-w-full">
    ...
  </table>
</div>
```

**Modais — fullscreen em mobile:**
```tsx
// Mobile: ocupa tela inteira
// Desktop: modal centralizado com largura máxima
<div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
  <div className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-xl bg-zinc-900">
```

---

### 3.6 Componentes UI — Ajustes

**`input.tsx`** — já tem touch-friendly height (`py-3`) ✅

**`button.tsx`** — já tem touch-friendly (`py-3` no size md) ✅

**`table.tsx`** — adicionar scroll horizontal:
```tsx
<div className="overflow-x-auto">
  <table className="min-w-full divide-y divide-zinc-800">
```

**`modal.tsx`** — implementar como bottom sheet em mobile:
```tsx
// sm e abaixo: desliza de baixo para cima (bottom sheet)
// md e acima: modal centralizado
```

---

## ORDEM DE IMPLEMENTAÇÃO SUGERIDA

### Fase 1 — Email Transacional (Backend)
1. Instalar Resend: `npm install resend`
2. Criar `EmailModule` e `EmailService`
3. Criar templates HTML de email
4. Implementar `requestPasswordReset`, `validateResetToken`, `resetPassword` no `AuthService`
5. Adicionar endpoints no `AuthController`
6. Testar com Postman

### Fase 2 — Verificação de Email (Backend + Frontend)
1. Alterar `register()` para não criar sessão — só enviar email
2. Implementar `verifyEmail()` e `resendVerificationEmail()`
3. Adicionar bloqueio no `login()` para email não verificado
4. Criar página `/verify-email` no frontend
5. Ajustar redirect do `register/page.tsx`
6. Ajustar tratamento de erro de email não verificado no `login/page.tsx`

### Fase 3 — Responsividade (Frontend)
1. Implementar `sidebar.tsx` com drawer mobile
2. Implementar `header.tsx` com botão hamburger
3. Atualizar `(dashboard)/layout.tsx` com estrutura completa
4. Ajustar grids das páginas do dashboard (1→2→4 colunas)
5. Adicionar overflow-x-auto nas tabelas
6. Ajustar modal para bottom sheet em mobile
7. Revisar páginas de auth (register radio buttons, safe areas)

---

## DEPENDÊNCIAS A INSTALAR

```bash
# Backend
npm install resend

# Frontend (se quiser ícones para sidebar/header)
npm install lucide-react
```

---

## VARIÁVEIS DE AMBIENTE

**`backend/.env`** — adicionar:
```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@inkstudio.com.br
APP_URL=http://localhost:3000
```

**`frontend/.env.local`** — já existe com:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## OBSERVAÇÕES IMPORTANTES

- **Segurança no reset de senha:** Sempre retornar mensagem genérica de sucesso, mesmo que o email não exista, para não revelar quais emails estão cadastrados.
- **Token geração:** Usar `crypto.randomBytes(32).toString('hex')` (Node.js built-in) em vez de `Math.random()` — é criptograficamente seguro.
- **Expiração dos tokens:** Verificação de email = 24h. Reset de senha = 1h.
- **Invalidar sessões após reset:** Ao redefinir a senha, deletar todas as sessões ativas do usuário por segurança.
- **VerificationToken reutilizado:** O mesmo modelo serve para verificação de email e reset de senha — diferenciar pelo prefixo no campo `identifier` (`email-verify:` vs `password-reset:`).
- **Domínio Resend:** Configurar domínio verificado no painel do Resend antes de ir para produção. Em desenvolvimento, usar o email sandbox do Resend.
