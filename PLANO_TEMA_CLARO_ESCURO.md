# Plano: Seletor de Tema Claro / Escuro

**Prioridade:** Pós-deploy
**Estimativa:** 5-6 horas
**Motivação:** Usuários poderão escolher entre tema escuro (atual) e tema claro, com preferência salva no dispositivo.

---

## Problema Atual

Todas as cores estão hardcoded nos componentes com classes Tailwind escuras:
- `bg-zinc-950`, `bg-zinc-900`, `bg-zinc-800`
- `text-zinc-100`, `text-zinc-400`, `text-zinc-500`
- `border-zinc-800`, `border-zinc-700`

São ~40 arquivos que precisam ser refatorados.

---

## Abordagem: CSS Variables + Tailwind `dark:`

### Etapa 1 — CSS Variables em `globals.css` (30min)

Definir tokens semânticos no `globals.css`:

```css
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f4f4f5;
  --bg-card: #ffffff;
  --bg-input: #f4f4f5;
  --border: #e4e4e7;
  --text-primary: #09090b;
  --text-secondary: #52525b;
  --text-muted: #a1a1aa;
}

.dark {
  --bg-primary: #09090b;
  --bg-secondary: #18181b;
  --bg-card: #18181b;
  --bg-input: #27272a;
  --border: #27272a;
  --text-primary: #f4f4f5;
  --text-secondary: #a1a1aa;
  --text-muted: #71717a;
}
```

Adicionar no `tailwind.config.ts`:
```ts
theme: {
  extend: {
    colors: {
      surface: {
        primary: 'var(--bg-primary)',
        secondary: 'var(--bg-secondary)',
        card: 'var(--bg-card)',
        input: 'var(--bg-input)',
      },
      border: 'var(--border)',
      content: {
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        muted: 'var(--text-muted)',
      }
    }
  }
}
```

### Etapa 2 — ThemeProvider (30min)

Criar `frontend/src/components/theme-provider.tsx`:
- Lê preferência do `localStorage`
- Aplica/remove classe `dark` no `<html>`
- Expõe `useTheme()` hook com `theme` e `toggleTheme`
- Respeita preferência do sistema via `prefers-color-scheme` como padrão inicial

### Etapa 3 — Botão de alternância no Header (15min)

Adicionar ícone `Sun` / `Moon` no header ao lado do avatar do usuário.

### Etapa 4 — Refatorar componentes (~4h)

Substituir classes hardcoded pelos tokens semânticos em cada arquivo.

**Arquivos de layout (prioridade 1):**
- `frontend/src/components/layout/sidebar.tsx`
- `frontend/src/components/layout/header.tsx`
- `frontend/src/app/(dashboard)/layout.tsx`

**Componentes UI reutilizáveis (prioridade 2):**
- `frontend/src/components/ui/card.tsx`
- `frontend/src/components/ui/button.tsx`
- `frontend/src/components/ui/table.tsx`
- `frontend/src/components/ui/input.tsx`
- `frontend/src/components/ui/skeleton.tsx`
- `frontend/src/components/ui/page-header.tsx`

**Páginas (prioridade 3):**
- `dashboard/page.tsx`
- `clients/page.tsx`
- `sessions/page.tsx`
- `financial/page.tsx`
- `employees/page.tsx`
- `calculator/page.tsx`
- `budget-suggestion/page.tsx`
- `performance/page.tsx`
- `settings/page.tsx`
- `service-types/page.tsx`

**Modais (prioridade 4):**
- Todos os arquivos em `frontend/src/components/modals/`

**Páginas de auth (prioridade 5):**
- `login/page.tsx`
- `register/page.tsx`
- `reset-password/page.tsx`
- `verify-email/page.tsx`
- `complete-registration/page.tsx`

### Etapa 5 — Testes visuais (1h)

- Testar cada página em tema claro e escuro
- Verificar contraste e legibilidade
- Testar em mobile (sidebar drawer, modais)
- Verificar que o tema persiste ao recarregar a página

---

## Exemplo de substituição

**Antes:**
```tsx
<div className="bg-zinc-900 border border-zinc-800 text-zinc-100">
```

**Depois:**
```tsx
<div className="bg-surface-card border border-border text-content-primary">
```

---

## Referência visual (tema claro)

A página de preview foi implementada e deletada após aprovação visual.
Cores aprovadas para o tema claro:
- Fundo principal: `gray-50` (#f9fafb)
- Cards: `white` com borda `gray-200`
- Texto principal: `gray-900`
- Texto secundário: `gray-500`
- Acento (rose): mantém igual ao tema escuro
- Sidebar: `white` com borda `gray-200`
- Header: `white` com borda `gray-100`
