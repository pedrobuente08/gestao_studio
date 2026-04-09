/**
 * Testes e2e: Sessão + Transação atômica
 *
 * Verifica que criar uma sessão de tatuagem sempre gera o lançamento
 * financeiro correspondente — e que nunca existem os dois desacoplados.
 *
 * Requer: DATABASE_URL_TEST apontando para um PostgreSQL de teste.
 */

import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp, clearDatabase } from './helpers/test-app.helper';
import { createTestUser, createTestClient } from './helpers/test-auth.helper';

const TEST_DB = process.env.DATABASE_URL_TEST;

const describeE2E = TEST_DB ? describe : describe.skip;

describeE2E('Sessions — atomicidade (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    process.env.DATABASE_URL = TEST_DB!;
    process.env.DIRECT_URL = TEST_DB!;
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await clearDatabase(prisma);
  });

  it('POST /sessions → cria sessão E lançamento financeiro juntos', async () => {
    const user = await createTestUser(prisma);
    const client = await createTestClient(prisma, user.tenantId);

    await request(app.getHttpServer())
      .post('/sessions')
      .set('Cookie', user.cookie)
      .send({
        clientId: client.id,
        userId: user.id,
        finalPrice: 150,
        date: '2025-06-01',
      })
      .expect(201);

    const [sessions, transactions] = await Promise.all([
      prisma.tattooSession.findMany({ where: { tenantId: user.tenantId } }),
      prisma.transaction.findMany({ where: { tenantId: user.tenantId } }),
    ]);

    expect(sessions).toHaveLength(1);
    expect(transactions).toHaveLength(1);
    expect(transactions[0].amount).toBe(15000); // R$ 150,00 em centavos
    expect(transactions[0].sessionId).toBe(sessions[0].id);
  });

  it('sessão com guest location → split correto na transaction', async () => {
    const user = await createTestUser(prisma);
    const client = await createTestClient(prisma, user.tenantId);

    const guestLocation = await prisma.guestLocation.create({
      data: { tenantId: user.tenantId, name: 'Studio Parceiro' },
    });

    await request(app.getHttpServer())
      .post('/sessions')
      .set('Cookie', user.cookie)
      .send({
        clientId: client.id,
        userId: user.id,
        finalPrice: 200,
        date: '2025-06-01',
        guestLocationId: guestLocation.id,
        studioPercentage: 30,
      })
      .expect(201);

    const session = await prisma.tattooSession.findFirst({
      where: { tenantId: user.tenantId },
    });

    expect(session!.studioFee).toBe(6000);       // 30% de R$ 200
    expect(session!.tatuadorRevenue).toBe(14000); // 70% de R$ 200
    expect(session!.studioFee! + session!.tatuadorRevenue!).toBe(20000);
  });

  it('DELETE /sessions/:id → remove sessão e lançamento financeiro', async () => {
    const user = await createTestUser(prisma);
    const client = await createTestClient(prisma, user.tenantId);

    const { body: session } = await request(app.getHttpServer())
      .post('/sessions')
      .set('Cookie', user.cookie)
      .send({
        clientId: client.id,
        userId: user.id,
        finalPrice: 100,
        date: '2025-06-01',
      })
      .expect(201);

    await request(app.getHttpServer())
      .delete(`/sessions/${session.id}`)
      .set('Cookie', user.cookie)
      .expect(200);

    const [sessions, transactions] = await Promise.all([
      prisma.tattooSession.findMany({ where: { tenantId: user.tenantId } }),
      prisma.transaction.findMany({ where: { tenantId: user.tenantId } }),
    ]);

    expect(sessions).toHaveLength(0);
    expect(transactions).toHaveLength(0);
  });

  it('GET /sessions sem autenticação → 401', async () => {
    await request(app.getHttpServer()).get('/sessions').expect(401);
  });
});
