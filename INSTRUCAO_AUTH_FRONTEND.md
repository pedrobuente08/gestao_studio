Leia o arquivo CLAUDE_CONTEXT.md na raiz do projeto antes de começar.

Sua tarefa é implementar a autenticação completa do frontend. Trabalhe dentro da pasta frontend/src/.

---

## 1. CONFIGURAÇÃO INICIAL

### API Client Base

Implemente `services/api.ts`:
- Configure o Axios com baseURL do .env (NEXT_PUBLIC_API_URL)
- Configure interceptor para adicionar o token JWT automaticamente em todas as requisições
- Configure interceptor para tratar erros 401 (token inválido/expirado) e redirecionar para login
- Exporte uma instância configurada do axios

---

## 2. TYPES

Implemente `types/auth.types.ts`:

```typescript
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'OWNER' | 'STAFF' | 'EMPLOYEE';
  tenantId: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  tenantType: 'AUTONOMO' | 'STUDIO';
  tenantName: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface ResetPasswordData {
  email?: string;
  token?: string;
  newPassword?: string;
}
```

---

## 3. AUTH SERVICE

Implemente `services/auth.service.ts`:

Métodos:

`register(data: RegisterData)`:
- POST /auth/register
- Retorna AuthResponse

`login(data: LoginData)`:
- POST /auth/login
- Retorna AuthResponse

`loginWithGoogle()`:
- Redireciona para GET /auth/google
- O callback será tratado pelo backend

`requestPasswordReset(email: string)`:
- POST /auth/password/request
- Retorna mensagem de sucesso

`validateResetToken(token: string)`:
- POST /auth/password/validate
- Retorna { valid: boolean }

`resetPassword(token: string, newPassword: string)`:
- POST /auth/password/reset
- Retorna mensagem de sucesso

`verifyEmail(token: string)`:
- POST /auth/email/verify
- Retorna mensagem de sucesso

`getMe()`:
- GET /auth/me
- Retorna User

`logout()`:
- Remove o token do localStorage
- Redireciona para /login

---

## 4. AUTH STORE (Zustand)

Crie `stores/auth.store.ts`:

Estado global de autenticação usando Zustand:

```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
}
```

Funcionalidades:
- Salva token no localStorage quando setAuth é chamado
- Remove token do localStorage quando clearAuth é chamado
- Carrega token do localStorage quando o store é inicializado (se existir)

---

## 5. AUTH HOOK

Implemente `hooks/use-auth.ts`:

Hook customizado que usa React Query + Zustand:

Funcionalidades:
- `login(data)` — chama authService.login(), salva no store, redireciona para /dashboard
- `register(data)` — chama authService.register(), salva no store, redireciona para /dashboard
- `logout()` — chama authService.logout(), limpa o store, redireciona para /login
- `requestPasswordReset(email)` — chama authService.requestPasswordReset()
- `resetPassword(token, newPassword)` — chama authService.resetPassword()
- `verifyEmail(token)` — chama authService.verifyEmail()

Retorna também:
- `user` — usuário atual do store
- `isAuthenticated` — boolean do store
- `isLoading` — estados de loading das mutations

Use React Query mutations para todas as operações.

---

## 6. PÁGINA DE LOGIN

Implemente `app/(auth)/login/page.tsx`:

Layout:
- Formulário centralizado na tela
- Logo do InkStudio no topo
- Campo de email
- Campo de senha
- Botão "Entrar"
- Botão "Entrar com Google"
- Link "Esqueci minha senha"
- Link "Não tem conta? Cadastre-se"

Lógica:
- Use React Hook Form + Zod para validação
- Ao submeter, chama `login()` do hook
- Mostra loading enquanto processa
- Mostra mensagens de erro se falhar
- Redireciona para /dashboard se sucesso

Validações:
- Email: obrigatório, formato válido
- Senha: obrigatório, mínimo 6 caracteres

---

## 7. PÁGINA DE REGISTRO

Implemente `app/(auth)/register/page.tsx`:

Layout:
- Formulário centralizado
- Logo do InkStudio no topo
- Campo de nome completo
- Campo de email
- Campo de senha
- Campo de confirmar senha
- Radio buttons: "Autônomo" ou "Estúdio"
- Campo "Nome do estúdio" ou "Seu nome profissional" (dependendo do tipo)
- Botão "Criar conta"
- Link "Já tem conta? Faça login"

Lógica:
- Use React Hook Form + Zod para validação
- Ao submeter, chama `register()` do hook
- Mostra loading enquanto processa
- Mostra mensagens de erro se falhar
- Redireciona para /dashboard se sucesso

Validações:
- Nome: obrigatório, mínimo 3 caracteres
- Email: obrigatório, formato válido
- Senha: obrigatório, mínimo 6 caracteres
- Confirmar senha: deve ser igual à senha
- Tipo de conta: obrigatório
- Nome do estúdio/profissional: obrigatório

---

## 8. PÁGINA DE RESET DE SENHA

Implemente `app/(auth)/reset-password/page.tsx`:

Esta página tem 2 estados:

**Estado A — Solicitar reset (sem token na URL):**
- Formulário com campo de email
- Botão "Enviar link de recuperação"
- Ao submeter, chama `requestPasswordReset()`
- Mostra mensagem de sucesso após enviar

**Estado B — Definir nova senha (com token na URL):**
- Lê o token dos query params
- Valida o token ao montar o componente
- Se válido: mostra formulário com 2 campos de senha
- Se inválido: mostra mensagem de erro

Formulário de nova senha:
- Campo "Nova senha"
- Campo "Confirmar nova senha"
- Botão "Redefinir senha"
- Ao submeter, chama `resetPassword()`
- Redireciona para /login após sucesso

---

## 9. LAYOUT DE AUTH

Implemente um layout simples para as páginas de auth:

O layout padrão `app/(auth)/layout.tsx` (se não existir, crie):
- Fundo dark (seguindo o tema)
- Centraliza o conteúdo
- Sem sidebar, sem header
- Apenas o conteúdo da página no centro

---

## 10. PROTEÇÃO DE ROTAS

Crie um componente `components/auth/route-guard.tsx`:

Este componente:
- Verifica se o usuário está autenticado (lê do store)
- Se não estiver, redireciona para /login
- Se estiver, renderiza o children
- Mostra um loading enquanto verifica

Use este componente no layout do dashboard: `app/(dashboard)/layout.tsx`

---

## 11. PÁGINA RAIZ (REDIRECIONAMENTO)

Atualize `app/page.tsx`:

Esta página deve apenas redirecionar:
- Se usuário autenticado → redireciona para /dashboard
- Se não autenticado → redireciona para /login

---

## 12. REACT QUERY PROVIDER

Crie `app/providers.tsx`:

Configure o QueryClientProvider do React Query:
- Envolva toda a aplicação
- Configure retry e staleTime padrões

Atualize `app/layout.tsx` para usar o Provider.

---

## ESTILO

Todos os componentes devem seguir:
- Dark mode (fundo escuro)
- Cores primárias: vermelho/rosa para botões e links
- Inputs com borda sutil, fundo ligeiramente mais claro que o fundo da página
- Botões com hover effect
- Mensagens de erro em vermelho
- Mensagens de sucesso em verde
- Loading states com spinners

Use Tailwind CSS para estilização.

---

## VALIDAÇÃO COM ZOD

Exemplo de schema Zod para o login:

```typescript
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});
```

Use `@hookform/resolvers/zod` para integrar com React Hook Form.

---

## REGRAS IMPORTANTES

- Sempre use o hook `use-auth` para operações de autenticação
- Sempre use React Hook Form + Zod para formulários
- Sempre mostre loading states
- Sempre trate erros e mostre mensagens claras ao usuário
- Token JWT deve ser salvo no localStorage
- Ao fazer logout, limpa o localStorage e o store
- Todas as páginas de auth não precisam de autenticação (rotas públicas)
- Todas as páginas do dashboard precisam de autenticação (use RouteGuard)