/**
 * Seed de dados de teste para desenvolvimento.
 * Executar com: npx ts-node prisma/seed-dev.ts
 *
 * Credenciais criadas:
 *   OWNER  → dono@inkstudio.com  / senha123
 *   STAFF  → staff@inkstudio.com / senha123
 */

import {
  PrismaClient,
  TattooSize,
  TattooComplexity,
  BodyLocation,
  PaymentMethod,
  TransactionType,
  TransactionCategory,
} from '@prisma/client';
import { hashPassword } from 'better-auth/crypto';
import { createId } from '@paralleldrive/cuid2';

const prisma = new PrismaClient();

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Retorna uma data N dias atrás */
function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

/** Aleatoriza um item de um array */
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Preço em centavos */
function reais(r: number) {
  return Math.round(r * 100);
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Iniciando seed de desenvolvimento...\n');

  const password = await hashPassword('senha123');

  // ── 1. Tenant ──────────────────────────────────────────────────────────────
  const tenant = await prisma.tenant.create({
    data: {
      id: createId(),
      type: 'STUDIO',
      name: 'Studio InkTest',
      city: 'São Paulo',
      state: 'SP',
      phone: '(11) 99999-0000',
      instagram: '@studioteste',
    },
  });
  console.log(`✅ Tenant criado: ${tenant.name} (${tenant.id})`);

  // ── 2. Usuários ────────────────────────────────────────────────────────────
  const owner = await prisma.user.create({
    data: {
      id: createId(),
      tenantId: tenant.id,
      email: 'dono@inkstudio.com',
      name: 'Pedro Buente',
      role: 'OWNER',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });
  await prisma.account.create({
    data: {
      id: createId(),
      userId: owner.id,
      accountId: owner.id,
      providerId: 'credential',
      password,
    },
  });
  console.log(`✅ Owner criado: ${owner.email}`);

  const staff = await prisma.user.create({
    data: {
      id: createId(),
      tenantId: tenant.id,
      email: 'staff@inkstudio.com',
      name: 'Lucas Tatuador',
      role: 'STAFF',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });
  await prisma.account.create({
    data: {
      id: createId(),
      userId: staff.id,
      accountId: staff.id,
      providerId: 'credential',
      password,
    },
  });
  console.log(`✅ Staff criado: ${staff.email}`);

  // ── 3. Tipos de Serviço ────────────────────────────────────────────────────
  const tatuagem = await prisma.serviceType.create({
    data: { id: createId(), tenantId: tenant.id, name: 'Tatuagem', isSystem: true },
  });
  const piercing = await prisma.serviceType.create({
    data: { id: createId(), tenantId: tenant.id, name: 'Piercing', isSystem: false },
  });
  const laser = await prisma.serviceType.create({
    data: { id: createId(), tenantId: tenant.id, name: 'Laser', isSystem: false },
  });
  console.log('✅ Tipos de serviço criados: Tatuagem, Piercing, Laser');

  // ── 4. Clientes ────────────────────────────────────────────────────────────
  const clientsData = [
    { name: 'Ana Souza',      email: 'ana@gmail.com',     phone: '(11) 91111-1111', instagram: '@anasouza' },
    { name: 'Bruno Lima',     email: 'bruno@gmail.com',   phone: '(11) 92222-2222', instagram: '@brunolima' },
    { name: 'Carla Mendes',   email: 'carla@hotmail.com', phone: '(11) 93333-3333', instagram: '@carlam' },
    { name: 'Diego Rocha',    email: 'diego@gmail.com',   phone: '(11) 94444-4444', instagram: '@diegorocha' },
    { name: 'Elisa Ferreira', email: 'elisa@gmail.com',   phone: '(11) 95555-5555', instagram: '@elisaferreira' },
    { name: 'Fábio Costa',    email: 'fabio@gmail.com',   phone: '(11) 96666-6666', instagram: '@fabiocosta' },
  ];

  const clients = await Promise.all(
    clientsData.map((c) =>
      prisma.client.create({
        data: { id: createId(), tenantId: tenant.id, ...c },
      }),
    ),
  );
  console.log(`✅ ${clients.length} clientes criados`);

  // ── 5. Configurações de Trabalho ───────────────────────────────────────────
  await prisma.workSettings.create({
    data: {
      id: createId(),
      tenantId: tenant.id,
      mode: 'STUDIO_PERCENTAGE',
      studioPercentage: 50,
      hoursPerMonth: 160,
      profitMargin: 30,
    },
  });

  await prisma.fixedCost.createMany({
    data: [
      { id: createId(), tenantId: tenant.id, name: 'Aluguel',  amount: reais(2000) },
      { id: createId(), tenantId: tenant.id, name: 'Energia',  amount: reais(350)  },
      { id: createId(), tenantId: tenant.id, name: 'Internet', amount: reais(150)  },
    ],
  });

  await prisma.variableCost.createMany({
    data: [
      { id: createId(), tenantId: tenant.id, name: 'Tinta',    amount: reais(80) },
      { id: createId(), tenantId: tenant.id, name: 'Agulhas',  amount: reais(30) },
      { id: createId(), tenantId: tenant.id, name: 'Películas', amount: reais(15) },
    ],
  });
  console.log('✅ Configurações da calculadora criadas');

  // ── 6. Sessões + Transações ────────────────────────────────────────────────
  const paymentMethods: PaymentMethod[] = ['PIX', 'CREDIT_CARD', 'DEBIT_CARD', 'CASH'];

  const sessionsData = [
    // Tatuagens
    { clientIdx: 0, daysBack: 120, size: TattooSize.MEDIUM,      complexity: TattooComplexity.HIGH,      bodyLocation: BodyLocation.FOREARM,    price: reais(600),  serviceType: tatuagem, desc: 'Mandala geométrica' },
    { clientIdx: 1, daysBack: 105, size: TattooSize.SMALL,       complexity: TattooComplexity.LOW,       bodyLocation: BodyLocation.WRIST,      price: reais(280),  serviceType: tatuagem, desc: 'Letreiro minimalista' },
    { clientIdx: 2, daysBack: 90,  size: TattooSize.LARGE,       complexity: TattooComplexity.VERY_HIGH, bodyLocation: BodyLocation.UPPER_BACK, price: reais(1200), serviceType: tatuagem, desc: 'Serpente japonesa' },
    { clientIdx: 3, daysBack: 75,  size: TattooSize.MICRO,       complexity: TattooComplexity.LOW,       bodyLocation: BodyLocation.FINGER,     price: reais(150),  serviceType: tatuagem, desc: 'Anel tatuado' },
    { clientIdx: 4, daysBack: 60,  size: TattooSize.MEDIUM,      complexity: TattooComplexity.MEDIUM,    bodyLocation: BodyLocation.CALF,       price: reais(500),  serviceType: tatuagem, desc: 'Rosa realism' },
    { clientIdx: 0, daysBack: 45,  size: TattooSize.EXTRA_LARGE, complexity: TattooComplexity.VERY_HIGH, bodyLocation: BodyLocation.THIGH,      price: reais(1800), serviceType: tatuagem, desc: 'Full sleeve inicial' },
    { clientIdx: 5, daysBack: 35,  size: TattooSize.SMALL,       complexity: TattooComplexity.MEDIUM,    bodyLocation: BodyLocation.ANKLE,      price: reais(350),  serviceType: tatuagem, desc: 'Borboleta watercolor' },
    { clientIdx: 1, daysBack: 22,  size: TattooSize.MEDIUM,      complexity: TattooComplexity.HIGH,      bodyLocation: BodyLocation.CHEST,      price: reais(700),  serviceType: tatuagem, desc: 'Lion geometrico' },
    { clientIdx: 3, daysBack: 15,  size: TattooSize.SMALL,       complexity: TattooComplexity.LOW,       bodyLocation: BodyLocation.WRIST,      price: reais(200),  serviceType: tatuagem, desc: 'Data em algarismo romano' },
    { clientIdx: 2, daysBack: 7,   size: TattooSize.LARGE,       complexity: TattooComplexity.HIGH,      bodyLocation: BodyLocation.SHOULDER,   price: reais(900),  serviceType: tatuagem, desc: 'Dragão oriental' },
    // Piercings
    { clientIdx: 4, daysBack: 80,  size: null, complexity: null, bodyLocation: null, price: reais(120), serviceType: piercing, desc: 'Helix' },
    { clientIdx: 5, daysBack: 50,  size: null, complexity: null, bodyLocation: null, price: reais(100), serviceType: piercing, desc: 'Tragus' },
    { clientIdx: 0, daysBack: 20,  size: null, complexity: null, bodyLocation: null, price: reais(150), serviceType: piercing, desc: 'Daith' },
    // Laser
    { clientIdx: 1, daysBack: 65,  size: null, complexity: null, bodyLocation: null, price: reais(400), serviceType: laser, desc: 'Remoção parcial (3 sessões)' },
    { clientIdx: 3, daysBack: 10,  size: null, complexity: null, bodyLocation: null, price: reais(350), serviceType: laser, desc: 'Clareamento de tatuagem' },
  ];

  let sessionCount = 0;
  for (const s of sessionsData) {
    const sessionId = createId();
    const date = daysAgo(s.daysBack);
    const userId = pick([owner.id, staff.id]);
    const paymentMethod = pick(paymentMethods);

    await prisma.tattooSession.create({
      data: {
        id: sessionId,
        tenantId: tenant.id,
        clientId: clients[s.clientIdx].id,
        userId,
        serviceTypeId: s.serviceType.id,
        size: s.size as TattooSize | null,
        complexity: s.complexity as TattooComplexity | null,
        bodyLocation: s.bodyLocation as BodyLocation | null,
        description: s.desc,
        finalPrice: s.price,
        date,
      },
    });

    await prisma.transaction.create({
      data: {
        id: createId(),
        tenantId: tenant.id,
        type: TransactionType.INCOME,
        category: TransactionCategory.TATTOO,
        amount: s.price,
        paymentMethod,
        clientId: clients[s.clientIdx].id,
        sessionId,
        description: s.desc,
        date,
      },
    });

    sessionCount++;
  }
  console.log(`✅ ${sessionCount} sessões e transações criadas`);

  // ── 7. Despesas extras ─────────────────────────────────────────────────────
  const expenses = [
    { name: 'Compra de tintas importadas', amount: reais(450),  daysBack: 95, category: TransactionCategory.MATERIAL   },
    { name: 'Agulhas e consumíveis',       amount: reais(180),  daysBack: 60, category: TransactionCategory.MATERIAL   },
    { name: 'Aluguel — Fevereiro',         amount: reais(2000), daysBack: 55, category: TransactionCategory.FIXED      },
    { name: 'Campanha Instagram',          amount: reais(300),  daysBack: 40, category: TransactionCategory.MARKETING  },
    { name: 'Aluguel — Março',             amount: reais(2000), daysBack: 25, category: TransactionCategory.FIXED      },
    { name: 'Pro-labore — Pedro',          amount: reais(3000), daysBack: 5,  category: TransactionCategory.PRO_LABORE },
  ];

  for (const e of expenses) {
    await prisma.transaction.create({
      data: {
        id: createId(),
        tenantId: tenant.id,
        type: TransactionType.EXPENSE,
        category: e.category,
        amount: e.amount,
        description: e.name,
        date: daysAgo(e.daysBack),
      },
    });
  }
  console.log(`✅ ${expenses.length} despesas criadas`);

  // ── Resumo ─────────────────────────────────────────────────────────────────
  console.log('\n🎉 Seed de desenvolvimento concluído!\n');
  console.log('┌─────────────────────────────────────────┐');
  console.log('│           CREDENCIAIS DE TESTE          │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  OWNER  dono@inkstudio.com  / senha123  │');
  console.log('│  STAFF  staff@inkstudio.com / senha123  │');
  console.log('└─────────────────────────────────────────┘');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
