# Plano de Implementação — Novas Features

## Resumo das Features

1. Cadastro de funcionário sem auto-login + email com credenciais
2. Menu de perfil de usuário (avatar → menu com Perfil e Trocar Senha)
3. Restrição de acesso para role EMPLOYEE
4. Campo Instagram no cadastro de cliente
5. Campos obrigatórios no modal de sessão

---

## Feature 1 — Cadastro de Funcionário: E-mail com Credenciais, Sem Auto-Login

### Situação atual
- `employees.service.ts` cria o usuário e envia e-mail de verificação com link.
- `auth.service.ts` no método `verifyEmail()` cria uma sessão automaticamente após verificar o e-mail (auto-login).

### O que muda

#### Backend

**`backend/src/auth/auth.service.ts`**
- Separar o fluxo de verificação de e-mail do auto-login.
- Criar flag ou parâmetro `autoLogin: boolean` no `verifyEmail()`, ou verificar se o token é de employee vs owner.
- Alternativa mais limpa: após `verifyEmail()`, **não criar sessão** — apenas marcar `emailVerified` e retornar `{ message: "Email verificado. Faça login para continuar." }`.
- Isso afeta o fluxo de verificação do owner também. Avaliar se o owner deve ou não ter auto-login. **Recomendação:** remover auto-login de todos os fluxos de verificação para consistência.

**`backend/src/employees/employees.service.ts`**
- Trocar `emailService.sendVerificationEmail()` por novo método: `emailService.sendEmployeeWelcomeEmail()`.
- O novo e-mail deve conter:
  - Boas-vindas
  - Link de verificação de e-mail
  - Login (e-mail)
  - Senha temporária em texto claro (**atenção: exige que a senha ainda não tenha sido hasheada, portanto capturar a senha antes do bcrypt**)

**`backend/src/email/email.service.ts`** (ou equivalente)
- Criar método `sendEmployeeWelcomeEmail(email, name, verificationLink, rawPassword)`.
- Template: "Bem-vindo(a) ao sistema! Seus dados de acesso são: **Email:** ... **Senha:** ... Acesse o link para ativar: ..."

**`backend/src/auth/auth.service.ts` — método `verifyEmail()`**
- Remover `createSession()` do fluxo.
- Retornar apenas confirmação de verificação.
- Frontend redireciona para `/login` após verificação.

#### Frontend

**`frontend/src/app/(auth)/verify-email/page.tsx`** (existente ou criar)
- Após verificação bem-sucedida, exibir mensagem de sucesso e botão "Ir para Login".
- Remover qualquer lógica de redirecionamento automático com token de sessão.

---

## Feature 2 — Menu de Perfil de Usuário (Avatar com Dropdown)

### Situação atual
- Sidebar tem botão de logout no rodapé.
- Não existe componente de avatar ou menu de perfil.
- `User` no schema Prisma não tem campos de `age`, `gender`, `profilePhotoUrl`.

### O que muda

#### Backend — Prisma Schema

**`backend/prisma/schema.prisma`**
- Adicionar campos ao model `User`:
  ```prisma
  age              Int?
  gender           String?   // "MASCULINO" | "FEMININO" | "NAO_BINARIO" | "PREFIRO_NAO_DIZER"
  profilePhotoUrl  String?
  ```
- Gerar nova migration: `npx prisma migrate dev --name add_profile_fields`

#### Backend — Auth / Profile

**`backend/src/auth/auth.controller.ts`** (ou criar `backend/src/profile/`)
- `GET /auth/me` — já existe, garantir que retorna `age`, `gender`, `profilePhotoUrl`
- `PATCH /auth/me` — criar endpoint para atualizar perfil
  - Body: `{ name?, age?, gender?, profilePhotoUrl? }`
- `PATCH /auth/me/password` — criar endpoint para trocar senha
  - Body: `{ currentPassword: string, newPassword: string }`
  - Validar senha atual antes de atualizar

**`backend/src/auth/dto/`**
- `update-profile.dto.ts`: `name?`, `age?`, `gender?`, `profilePhotoUrl?`
- `change-password.dto.ts`: `currentPassword`, `newPassword` (min 6)

#### Backend — Upload de Foto (opcional, fase 2)
- Se usar upload direto: `POST /auth/me/photo` com `multipart/form-data`
- Alternativa mais simples: aceitar URL externa (link do Google Drive, etc.) — **recomendado para MVP**
- Se implementar upload: usar `@nestjs/platform-express` com `multer`, salvar em `/uploads/` ou Supabase Storage

#### Frontend — Tipos

**`frontend/src/types/auth.types.ts`**
- Adicionar ao `User`: `age?: number`, `gender?: string`, `profilePhotoUrl?: string`

#### Frontend — Componente Avatar + Menu

**Criar: `frontend/src/components/layout/user-menu.tsx`**
- Componente com:
  - Círculo com iniciais do usuário (ou foto se `profilePhotoUrl`)
  - Ao clicar: dropdown com:
    ```
    [Foto ou iniciais] Nome do usuário
    ─────────────────
    Perfil
    Trocar Senha
    ─────────────────
    Sair
    ```
- Usar `@radix-ui/react-dropdown-menu` ou `shadcn/ui DropdownMenu` (verificar o que já está instalado)

**`frontend/src/components/layout/sidebar.tsx`**
- Substituir o botão "Sair" no rodapé pelo componente `<UserMenu />`
- O `UserMenu` encapsula logout + perfil + trocar senha

#### Frontend — Páginas/Modais de Perfil e Senha

**Opção A (Modal inline):**
- `frontend/src/components/modals/profile-modal.tsx` — formulário de edição de perfil (nome, idade, gênero, foto)
- `frontend/src/components/modals/change-password-modal.tsx` — formulário: senha atual + nova senha + confirmar

**Opção B (Páginas dedicadas):**
- `frontend/src/app/(dashboard)/profile/page.tsx`
- `frontend/src/app/(dashboard)/profile/change-password/page.tsx`

**Recomendação:** Opção A (modais) mantém o usuário na página atual sem perder contexto.

#### Frontend — Serviço

**`frontend/src/services/auth.service.ts`**
- Adicionar: `updateProfile(data)` → `PATCH /auth/me`
- Adicionar: `changePassword(data)` → `PATCH /auth/me/password`

---

## Feature 3 — Restrição de Acesso para Role EMPLOYEE

### Situação atual
- Sidebar filtra por `role` e `tenantType`, mas EMPLOYEE ainda vê: Dashboard, Clientes, Procedimentos, Calculadora, Sugestão de Orçamento.
- EMPLOYEE consegue acessar a página de sessões e inserir procedimentos.

### O que muda

#### Frontend — Sidebar

**`frontend/src/components/layout/sidebar.tsx`**
- EMPLOYEE deve ver **apenas**:
  - Dashboard
  - Sugestão de Orçamento (a confirmar)
- Remover do filtro para EMPLOYEE: Clientes, Procedimentos, Calculadora, Desempenho, Financeiro, Equipe, Tipos de Serviço

```typescript
// Lógica de filtro ajustada
const isEmployee = user?.role === 'EMPLOYEE'

// Para cada item de nav, adicionar condição:
{
  href: '/sessions',
  label: 'Procedimentos',
  visible: !isEmployee  // EMPLOYEE não vê
}
```

#### Frontend — Proteção de Rotas (Guards)

**`frontend/src/app/(dashboard)/sessions/page.tsx`**
- Adicionar verificação no início do componente (ou em layout):
  ```typescript
  if (user?.role === 'EMPLOYEE') redirect('/dashboard')
  ```

**`frontend/src/app/(dashboard)/clients/page.tsx`**
- Idem: redirecionar EMPLOYEE para `/dashboard`

**`frontend/src/app/(dashboard)/calculator/page.tsx`**
- Idem

**Alternativa mais limpa:** Criar middleware ou layout guard em `frontend/src/app/(dashboard)/layout.tsx` que leia a rota e redirecione EMPLOYEE se necessário.

#### Backend — Validações

**`backend/src/sessions/sessions.controller.ts`**
- Endpoint `POST /sessions` — adicionar guard que bloqueia EMPLOYEE de criar sessões.
- Ou verificar no service: `if (user.role === 'EMPLOYEE') throw new ForbiddenException()`

---

## Feature 4 — Campo Instagram no Cadastro de Cliente

### Situação atual
- `Client` model: `name`, `email?`, `phone?`, `notes?`
- Sem campo Instagram

### O que muda

#### Backend — Prisma Schema

**`backend/prisma/schema.prisma`**
- Adicionar ao model `Client`:
  ```prisma
  instagram  String?
  ```
- Migration: `npx prisma migrate dev --name add_instagram_to_client`

#### Backend — DTOs e Service

**`backend/src/clients/dto/create-client.dto.ts`**
- Adicionar: `@IsOptional() @IsString() instagram?: string`

**`backend/src/clients/dto/update-client.dto.ts`**
- Idem (já é partial, herda automaticamente se usar `PartialType`)

**`backend/src/clients/clients.service.ts`**
- Garantir que `instagram` é passado no `prisma.client.create()` e `update()`

#### Frontend — Tipos

**`frontend/src/types/client.types.ts`**
- Adicionar: `instagram?: string` na interface `Client` e `CreateClientData`

#### Frontend — Modal/Formulário de Cliente

**`frontend/src/components/modals/client-modal.tsx`** (verificar nome exato)
- Adicionar campo "Instagram" (input text, opcional)
- Placeholder: `@usuario` ou `instagram.com/usuario`
- Posicionamento sugerido: após o campo "Telefone"

---

## Feature 5 — Campos Obrigatórios no Modal de Sessão

### Situação atual
- Obrigatórios: `clientId`, `userId`, `serviceTypeId`, `date`, `finalPrice`
- Opcionais: `description`, `duration`, `size`, `complexity`, `bodyLocation`
- Quando `serviceType === 'Tatuagem'`: `size`, `complexity`, `bodyLocation` devem virar obrigatórios

### O que muda

#### Frontend — Validação (Zod)

**`frontend/src/components/modals/session-modal.tsx`**
- Ajustar schema Zod para tornar obrigatórios:
  - Para qualquer sessão: `clientId`, `userId`, `serviceTypeId`, `date`, `finalPrice`
  - Para `serviceType === 'Tatuagem'`: também `size`, `complexity`, `bodyLocation`
- Manter opcionais: `duration`, `description`

```typescript
// Exemplo de schema condicional
const sessionSchema = z.object({
  clientId: z.string().min(1, 'Selecione um cliente'),
  userId: z.string().min(1, 'Selecione um profissional'),
  serviceTypeId: z.string().min(1, 'Selecione o tipo de serviço'),
  date: z.string().min(1, 'Informe a data'),
  finalPrice: z.number({ required_error: 'Informe o valor' }).min(0.01, 'Valor deve ser maior que zero'),
  description: z.string().optional(),
  duration: z.number().optional(),
  // Tattoo fields - handled via .superRefine() or conditional schema
  size: z.string().optional(),
  complexity: z.string().optional(),
  bodyLocation: z.string().optional(),
}).superRefine((data, ctx) => {
  // Se o serviceType selecionado for Tatuagem, validar campos específicos
  // Isso exige acesso ao nome do tipo — implementar via contexto ou campo auxiliar
})
```

- Alternativa: validar manualmente no `onSubmit` antes de submeter ao React Hook Form.

#### Backend — Validação (NestJS)

**`backend/src/sessions/dto/create-session.dto.ts`**
- Garantir que `size`, `complexity`, `bodyLocation` têm validação adequada quando presentes.
- A obrigatoriedade condicional por tipo de serviço pode ser checada no service:
  ```typescript
  if (serviceType.name === 'Tatuagem') {
    if (!dto.size || !dto.complexity || !dto.bodyLocation) {
      throw new BadRequestException('Campos obrigatórios para tatuagem não informados')
    }
  }
  ```

---

## Ordem de Implementação Recomendada

| # | Feature | Complexidade | Dependências |
|---|---------|--------------|--------------|
| 1 | Campos obrigatórios no modal de sessão | Baixa | Nenhuma |
| 2 | Campo Instagram no cliente | Baixa | Migration de DB |
| 3 | Restrição de acesso EMPLOYEE | Média | Nenhuma |
| 4 | Cadastro de funcionário sem auto-login | Média | Email service |
| 5 | Menu de perfil (avatar + edição) | Alta | Migration de DB + Upload opcional |

---

## Arquivos Impactados (Resumo)

### Backend
- `backend/prisma/schema.prisma` — adicionar campos ao `User` e `Client`
- `backend/src/auth/auth.service.ts` — remover auto-login do `verifyEmail()`
- `backend/src/auth/auth.controller.ts` — novos endpoints `PATCH /auth/me` e `PATCH /auth/me/password`
- `backend/src/auth/dto/update-profile.dto.ts` — novo DTO
- `backend/src/auth/dto/change-password.dto.ts` — novo DTO
- `backend/src/employees/employees.service.ts` — enviar e-mail com credenciais
- `backend/src/email/email.service.ts` — novo método `sendEmployeeWelcomeEmail()`
- `backend/src/clients/dto/create-client.dto.ts` — adicionar `instagram`
- `backend/src/sessions/sessions.service.ts` — bloquear EMPLOYEE + validar campos de tatuagem
- `backend/src/sessions/dto/create-session.dto.ts` — revisar obrigatoriedade

### Frontend
- `frontend/src/types/auth.types.ts` — adicionar `age`, `gender`, `profilePhotoUrl`
- `frontend/src/types/client.types.ts` — adicionar `instagram`
- `frontend/src/services/auth.service.ts` — adicionar `updateProfile()` e `changePassword()`
- `frontend/src/components/layout/sidebar.tsx` — restrições de EMPLOYEE + integrar `UserMenu`
- `frontend/src/components/layout/user-menu.tsx` — **novo componente**
- `frontend/src/components/modals/session-modal.tsx` — campos obrigatórios
- `frontend/src/components/modals/profile-modal.tsx` — **novo componente**
- `frontend/src/components/modals/change-password-modal.tsx` — **novo componente**
- `frontend/src/app/(dashboard)/sessions/page.tsx` — bloquear acesso de EMPLOYEE
- `frontend/src/app/(dashboard)/clients/page.tsx` — bloquear acesso de EMPLOYEE (se necessário)

---

## Pontos de Atenção

1. **Segurança da senha no e-mail:** Enviar senha em texto claro no e-mail é prática aceita para onboarding, mas o sistema deve exigir troca de senha no primeiro login (ou ao menos informar que o usuário pode trocar). Considerar adicionar flag `mustChangePassword` no `User`.

2. **Sugestão de Orçamento para EMPLOYEE:** O usuário ainda vai avaliar se EMPLOYEE terá acesso a essa página. Implementar toggle fácil na sidebar (`showBudgetSuggestion: true/false` por role).

3. **Upload de foto:** Para MVP, aceitar apenas URL externa. Upload de arquivo local adiciona complexidade (storage, CORS, tamanho). Decidir antes de implementar.

4. **Auto-login do Owner:** Remover auto-login do `verifyEmail()` também afeta o fluxo de cadastro do Owner. Testar esse fluxo após a mudança.

5. **Validação condicional (Tatuagem):** O schema Zod não tem acesso direto ao nome do serviceType, apenas ao ID. Será necessário ou (a) adicionar o nome ao estado do formulário, ou (b) fazer a validação condicional no `onSubmit` fora do schema.
