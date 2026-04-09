import { PrismaService } from '../../src/prisma/prisma.service';
import { createId } from '@paralleldrive/cuid2';
import { hashPassword } from 'better-auth/crypto';

export interface TestUser {
  id: string;
  tenantId: string;
  email: string;
  sessionToken: string;
  /** Header pronto para usar com supertest: .set('Cookie', user.cookie) */
  cookie: string;
}

/**
 * Cria um tenant + usuário OWNER + sessão Better-Auth diretamente no banco.
 * Evita depender do fluxo de registro/login nos testes e2e.
 */
export async function createTestUser(
  prisma: PrismaService,
  overrides: { email?: string; tenantName?: string } = {},
): Promise<TestUser> {
  const email = overrides.email ?? `test-${createId()}@example.com`;
  const tenantName = overrides.tenantName ?? `Studio ${createId()}`;

  const tenant = await prisma.tenant.create({
    data: { type: 'AUTONOMO', name: tenantName },
  });

  const user = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email,
      name: 'Usuário Teste',
      role: 'OWNER',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  const hashedPwd = await hashPassword('Senha@123');
  await prisma.account.create({
    data: {
      userId: user.id,
      accountId: user.id,
      providerId: 'credential',
      password: hashedPwd,
    },
  });

  // Cria sessão Better-Auth diretamente — AuthGuard valida pelo token no banco
  const sessionToken = createId();
  await prisma.session.create({
    data: {
      userId: user.id,
      token: sessionToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
    },
  });

  return {
    id: user.id,
    tenantId: tenant.id,
    email,
    sessionToken,
    cookie: `better-auth.session_token=${sessionToken}`,
  };
}

/**
 * Cria um cliente no banco para um tenant específico.
 */
export async function createTestClient(
  prisma: PrismaService,
  tenantId: string,
  name = 'Cliente Teste',
) {
  return prisma.client.create({
    data: { tenantId, name, phone: '11999999999' },
  });
}
