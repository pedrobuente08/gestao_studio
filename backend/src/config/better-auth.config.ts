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
        subject: 'Recuperação de senha — InkStudio',
        html: `
          <div style="background:#09090b;padding:40px 16px;min-height:100vh;">
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#18181b;border-radius:12px;padding:40px 32px;border:1px solid #27272a;">
              <div style="margin-bottom:28px;">
                <span style="font-size:22px;font-weight:900;color:#e11d48;font-style:italic;letter-spacing:-1px;">InkStudio</span>
              </div>
              <h2 style="color:#ffffff;margin:0 0 12px;font-size:20px;">Olá, ${user.name}!</h2>
              <p style="color:#a1a1aa;margin:0 0 28px;font-size:15px;line-height:1.6;">Clique no botão abaixo para redefinir sua senha.</p>
              <a href="${url}" style="display:inline-block;background:#e11d48;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">
                Redefinir Senha
              </a>
              <p style="color:#52525b;font-size:12px;margin-top:32px;border-top:1px solid #27272a;padding-top:20px;">
                Se você não solicitou a recuperação de senha, ignore este email com segurança.
              </p>
            </div>
          </div>
        `,
      });
    },
  },

  emailVerification: {
    callbackURL: `${process.env.APP_URL || 'http://localhost:3000'}/verify-email-success`,
    sendVerificationEmail: async ({ user, url }) => {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'noreply@tattoohubink.cloud',
        to: user.email,
        subject: 'Verifique seu email — InkStudio',
        html: `
          <div style="background:#09090b;padding:40px 16px;min-height:100vh;">
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#18181b;border-radius:12px;padding:40px 32px;border:1px solid #27272a;">
              <div style="margin-bottom:28px;">
                <span style="font-size:22px;font-weight:900;color:#e11d48;font-style:italic;letter-spacing:-1px;">InkStudio</span>
              </div>
              <h2 style="color:#ffffff;margin:0 0 12px;font-size:20px;">Olá, ${user.name}!</h2>
              <p style="color:#a1a1aa;margin:0 0 28px;font-size:15px;line-height:1.6;">Clique no botão abaixo para verificar seu email e ativar sua conta.</p>
              <a href="${url}" style="display:inline-block;background:#e11d48;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">
                Verificar Email
              </a>
              <p style="color:#52525b;font-size:12px;margin-top:32px;border-top:1px solid #27272a;padding-top:20px;">
                Se você não criou uma conta no InkStudio, pode ignorar este email com segurança.
              </p>
            </div>
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
