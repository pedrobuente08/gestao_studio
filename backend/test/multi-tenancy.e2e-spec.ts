/**
 * Testes e2e: Isolamento entre tenants (CRÍTICO)
 *
 * Verifica que nenhum tenant consegue ler, modificar ou deletar
 * dados de outro tenant — a regra mais importante do sistema.
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

describeE2E('Multi-tenancy — isolamento de dados (e2e)', () => {
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

  // ─── Clientes ───────────────────────────────────────────────────────────────

  describe('Clientes', () => {
    it('tenant A não vê clientes do tenant B', async () => {
      const userA = await createTestUser(prisma, { email: 'a@test.com' });
      const userB = await createTestUser(prisma, { email: 'b@test.com' });

      await createTestClient(prisma, userB.tenantId, 'Cliente Secreto do B');

      const { body } = await request(app.getHttpServer())
        .get('/clients')
        .set('Cookie', userA.cookie)
        .expect(200);

      const names = body.data.map((c: any) => c.name);
      expect(names).not.toContain('Cliente Secreto do B');
      expect(body.data).toHaveLength(0);
    });

    it('tenant A não consegue acessar cliente do tenant B por ID → 404', async () => {
      const userA = await createTestUser(prisma, { email: 'a@test.com' });
      const userB = await createTestUser(prisma, { email: 'b@test.com' });

      const clienteB = await createTestClient(prisma, userB.tenantId, 'Cliente do B');

      await request(app.getHttpServer())
        .get(`/clients/${clienteB.id}`)
        .set('Cookie', userA.cookie)
        .expect(404);
    });

    it('tenant A não consegue atualizar cliente do tenant B → 404', async () => {
      const userA = await createTestUser(prisma, { email: 'a@test.com' });
      const userB = await createTestUser(prisma, { email: 'b@test.com' });

      const clienteB = await createTestClient(prisma, userB.tenantId, 'Cliente do B');

      await request(app.getHttpServer())
        .patch(`/clients/${clienteB.id}`)
        .set('Cookie', userA.cookie)
        .send({ name: 'Alterado pelo A' })
        .expect(404);

      // Confirma que o nome não foi alterado no banco
      const clienteNoBanco = await prisma.client.findUnique({ where: { id: clienteB.id } });
      expect(clienteNoBanco!.name).toBe('Cliente do B');
    });

    it('tenant A não consegue deletar cliente do tenant B → 404', async () => {
      const userA = await createTestUser(prisma, { email: 'a@test.com' });
      const userB = await createTestUser(prisma, { email: 'b@test.com' });

      const clienteB = await createTestClient(prisma, userB.tenantId, 'Cliente do B');

      await request(app.getHttpServer())
        .delete(`/clients/${clienteB.id}`)
        .set('Cookie', userA.cookie)
        .expect(404);

      // Confirma que o cliente ainda existe no banco
      const clienteNoBanco = await prisma.client.findUnique({ where: { id: clienteB.id } });
      expect(clienteNoBanco).not.toBeNull();
    });
  });

  // ─── Sessões ────────────────────────────────────────────────────────────────

  describe('Sessões', () => {
    it('tenant A não vê sessões do tenant B', async () => {
      const userA = await createTestUser(prisma, { email: 'a@test.com' });
      const userB = await createTestUser(prisma, { email: 'b@test.com' });

      // Cria sessão diretamente no banco para o tenant B
      const clienteB = await createTestClient(prisma, userB.tenantId);
      await prisma.tattooSession.create({
        data: {
          tenantId: userB.tenantId,
          clientId: clienteB.id,
          userId: userB.id,
          finalPrice: 20000,
          date: new Date(),
        },
      });
      // Cria transaction correspondente (normalmente criado pelo service)
      await prisma.transaction.create({
        data: {
          tenantId: userB.tenantId,
          type: 'INCOME',
          category: 'TATTOO',
          amount: 20000,
          date: new Date(),
        },
      });

      const { body } = await request(app.getHttpServer())
        .get('/sessions')
        .set('Cookie', userA.cookie)
        .expect(200);

      expect(body.data).toHaveLength(0);
    });

    it('tenant A não consegue deletar sessão do tenant B → 404', async () => {
      const userA = await createTestUser(prisma, { email: 'a@test.com' });
      const userB = await createTestUser(prisma, { email: 'b@test.com' });

      const clienteB = await createTestClient(prisma, userB.tenantId);
      const sessaoB = await prisma.tattooSession.create({
        data: {
          tenantId: userB.tenantId,
          clientId: clienteB.id,
          userId: userB.id,
          finalPrice: 20000,
          date: new Date(),
        },
      });

      await request(app.getHttpServer())
        .delete(`/sessions/${sessaoB.id}`)
        .set('Cookie', userA.cookie)
        .expect(404);

      const sessaoNoBanco = await prisma.tattooSession.findUnique({ where: { id: sessaoB.id } });
      expect(sessaoNoBanco).not.toBeNull();
    });
  });

  // ─── Financeiro ─────────────────────────────────────────────────────────────

  describe('Financeiro', () => {
    it('tenant A não vê transações do tenant B', async () => {
      const userA = await createTestUser(prisma, { email: 'a@test.com' });
      const userB = await createTestUser(prisma, { email: 'b@test.com' });

      await prisma.transaction.create({
        data: {
          tenantId: userB.tenantId,
          type: 'INCOME',
          category: 'TATTOO',
          amount: 50000,
          date: new Date(),
          description: 'Renda secreta do B',
        },
      });

      const { body } = await request(app.getHttpServer())
        .get('/financial')
        .set('Cookie', userA.cookie)
        .expect(200);

      expect(body.data).toHaveLength(0);
    });

    it('summary do tenant A não inclui valores do tenant B', async () => {
      const userA = await createTestUser(prisma, { email: 'a@test.com' });
      const userB = await createTestUser(prisma, { email: 'b@test.com' });

      // Tenant A tem R$ 100
      await prisma.transaction.create({
        data: { tenantId: userA.tenantId, type: 'INCOME', category: 'TATTOO', amount: 10000, date: new Date() },
      });
      // Tenant B tem R$ 999
      await prisma.transaction.create({
        data: { tenantId: userB.tenantId, type: 'INCOME', category: 'TATTOO', amount: 99900, date: new Date() },
      });

      const { body } = await request(app.getHttpServer())
        .get('/financial/summary')
        .set('Cookie', userA.cookie)
        .expect(200);

      expect(body.totalIncome).toBe(10000); // só os R$ 100 do tenant A
    });
  });
});
