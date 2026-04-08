import { ConfigModuleOptions } from '@nestjs/config';

export const envConfig: ConfigModuleOptions = {
  isGlobal: true,
  validate: (config: Record<string, unknown>) => {
    // Variáveis cuja ausência causa falha silenciosa de segurança ou crash em produção
    const required: string[] = [
      'DATABASE_URL',
      'DIRECT_URL',        // necessária para prisma migrate deploy na inicialização
      'BETTER_AUTH_SECRET', // sessões inseguras se ausente (better-auth usa fallback fraco)
      'APP_URL',            // usado em redirects de OAuth e emails — errado = phishing
    ];

    const missing = required.filter((key) => !config[key]);

    if (missing.length > 0) {
      throw new Error(
        `Variáveis de ambiente obrigatórias não definidas: ${missing.join(', ')}`,
      );
    }

    return config;
  },
};
