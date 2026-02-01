# InkStudio — Documento de Projeto

## 1. Visão Geral

Sistema de gestão para tatuadores e estúdios de tatuagem. Permite gerenciar clientes, procedimentos, financeiro e calculadora de custos.

Dois planos futuros:
- **Autônomo** — um único usuário por conta (foco inicial)
- **Estúdio** — múltiplos usuários por conta com roles (dono, tatuador, recepcionista)

Fase atual: MVP voltado para o plano **Autônomo**, com 20 tatuadores testando gratuitamente.

---

## 2. Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js + TypeScript |
| Backend | NestJS + TypeScript |
| Banco de Dados | PostgreSQL |
| ORM | Prisma |
| Autenticação | Better-Auth |
| Hospedagem | VPS Hostinger KVM 2 |
| SO da VPS | Ubuntu 22.04 LTS |
| Infraestrutura | Docker + Docker Compose |
| Reverse Proxy | Nginx |
| Deploy | GitHub Actions (CI/CD) |
| Gerenciador de Pacotes | npm |

---

## 3. Arquitetura

### 3.1 Multi-Tenant

Cada usuário ou estúdio possui um `tenant_id` único. Todos os dados (clientes, procedimentos, lançamentos financeiros) são isolados por esse ID. Nenhum tenant consegue ver os dados de outro.

### 3.2 Autenticação

- No plano **Autônomo**: um usuário por tenant
- No plano **Estúdio** (futuro): múltiplos usuários por tenant com roles
- Better-Auth gerencia sessões, tokens e suporta multi-tenant nativamente

### 3.3 Separação Frontend e Backend

- **Next.js** serve as páginas e a interface
- **NestJS** expõe a API REST que o frontend consome
- Comunicação entre eles via HTTP (chamadas de API)
- Nginx faz o roteamento entre os dois na VPS

---

## 4. Módulos do Sistema (baseado no MVP)

### 4.1 Dashboard
- Visão geral do estúdio/autônomo
- Faturamento mensal (gráfico de linha)
- Clientes ativos, procedimentos realizados, ticket médio
- Estilos populares (gráfico donut)
- Procedimentos por tipo (gráfico de barras horizontais)
- Últimos atendimentos

### 4.2 Clientes
- Listagem com busca e filtros
- Cards com dados de contato (nome, email, telefone)
- Informações por cliente: sessões realizadas, último visita, total gasto
- Criação de novo cliente
- Perfil individual do cliente

### 4.3 Procedimentos
- Tipos de tatuagem cadastrados
- Estatísticas por tipo: sessões, receita, tempo médio, preço médio, popularidade
- Ranking dos mais realizados do mês
- Criação de novo procedimento

### 4.4 Calculadora de Custos
- Entrada de custos fixos mensais (aluguel, energia, água, internet)
- Entrada de custos variáveis (materiais, marketing, outros)
- Configuração de horas trabalhadas/mês e margem de lucro desejada
- Cálculo automático de: custo por hora trabalhada, preço mínimo por hora
- Referência rápida de preços por duração de sessão (1h, 2h, 3h, 5h)

### 4.5 Financeiro
- Resumo: entradas, saídas, saldo, pró-labore, investimento, fluxo final
- Planilha de lançamentos com: data, cliente, descrição, categoria, forma de pagamento, valor
- Categorias: Tattoo, Material, Fixo, Marketing
- Formas de pagamento: PIX, Cartão, Boleto, Dinheiro, Débito Auto
- Adicionar entrada e saída
- Exportar dados

---

## 5. Infraestrutura na VPS

### 5.1 Containers (Docker Compose)

```
├── nginx          → Reverse proxy (porta 80/443)
├── frontend       → Next.js
├── backend        → NestJS (API)
├── postgres       → PostgreSQL
├── n8n            → Workflows pessoais (projeto separado)
└── outras apps    → Aplicações pessoais (projeto separado)
```

### 5.2 Ambientes

- **Produção (main):** Acessível pelo domínio dos usuários
- **Staging (develop):** Porta separada, para testes antes de subir para produção

---

## 6. Fluxo de Desenvolvimento e Deploy

### 6.1 Branches

| Branch | Função |
|---|---|
| `main` | Produção — código que usuários acessam |
| `develop` | Staging — features prontas para teste final |
| `feature/*` | Desenvolvimento — uma branch por feature |

### 6.2 Fluxo

1. Criar branch `feature/nome` a partir de `develop`
2. Desenvolver e testar localmente
3. Pull request para `develop`
4. Testar na staging
5. Aprovar e mergear `develop` → `main`
6. GitHub Actions faz deploy automático na VPS

---

## 7. Convenções do Projeto

- Linguagem: **Português** para nomes de variáveis e comentários voltados ao domínio do negócio
- Linguagem: **Inglês** para nomes de funções, métodos e estrutura de código (padrão da linguagem)
- Todos os valores monetários em **centavos (número inteiro)** no banco para evitar erros de ponto flutuante
- Formato de exibição de moeda: `R$ 1.500,00`
- Formato de datas: `DD/MM/YYYY`
- Tema visual: **Dark mode** (padrão, conforme design do Lovable)

---

## 8. Telas Planejadas (MVP)

- [x] Dashboard
- [x] Clientes (listagem)
- [x] Procedimentos
- [x] Calculadora de Custos
- [x] Financeiro
- [ ] Perfil do Cliente (detail)
- [ ] Cadastro de Novo Cliente
- [ ] Cadastro de Novo Procedimento
- [ ] Entrada/Saída Financeira (modal)
- [ ] Login / Registro
- [ ] Configurações da Conta

---

## 9. Referências Visuais

O design foi prototipado no Lovable. O sistema usa tema dark com cores primárias em vermelho/rosa (#ef4444 ou similar) e amarelo/laranja para destaques. Cards com fundo escuro e bordas sutis. Tipografia limpa e moderna.