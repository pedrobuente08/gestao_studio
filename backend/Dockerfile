FROM node:22-slim AS builder

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

# Instala TODAS as dependências (incluindo devDependencies para o build)
RUN npm ci --include=dev

COPY . .

# Gera Prisma Client e compila TypeScript
RUN npx prisma generate
RUN npm run build

# ─── Runtime ───────────────────────────────────────────────
FROM node:22-slim AS runner

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

# Apenas dependências de produção
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
