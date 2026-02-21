import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { createId } from '@paralleldrive/cuid2';
import { Resend } from 'resend';
import { prisma } from '../prisma/prisma.client';

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),

  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3001',

  trustedOrigins: [process.env.APP_URL || 'http://localhost:3000'],

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'noreply@tattoohubink.cloud',
        to: user.email,
        subject: 'Recuperação de senha — Gestão Studio',
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2>Olá, ${user.name}!</h2>
            <p>Clique no botão abaixo para redefinir sua senha.</p>
            <a href="${url}" style="display:inline-block;background:#e11d48;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;">
              Redefinir Senha
            </a>
            <p style="color:#888;font-size:12px;margin-top:24px;">Se você não solicitou a recuperação, ignore este email.</p>
          </div>
        `,
      });
    },
  },

  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'noreply@tattoohubink.cloud',
        to: user.email,
        subject: 'Verifique seu email — Gestão Studio',
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2>Olá, ${user.name}!</h2>
            <p>Clique no botão abaixo para verificar seu email e ativar sua conta.</p>
            <a href="${url}" style="display:inline-block;background:#e11d48;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;">
              Verificar Email
            </a>
            <p style="color:#888;font-size:12px;margin-top:24px;">Se você não criou uma conta, ignore este email.</p>
          </div>
        `,
      });
    },
    sendOnSignUp: true,
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7,  // 7 dias
    updateAge: 60 * 60 * 24,       // renova a cada 24h
  },

  // Multi-tenant: marca como PENDING_SETUP para usuários via Google OAuth
  // Eles deverão completar o cadastro informando o tipo e nome do Tenant
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          return {
            data: {
              ...user,
              role: 'OWNER',
              status: 'PENDING_SETUP',
            },
          };
        },
      },
    },
  },

  advanced: {
    database: {
      generateId: () => createId(),
    },
  },
});

export type Auth = typeof auth;
