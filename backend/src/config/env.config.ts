import { ConfigModuleOptions } from '@nestjs/config';

export const envConfig: ConfigModuleOptions = {
  isGlobal: true,
  validate: (config: Record<string, unknown>) => {
    const required = ['DATABASE_URL'];

    for (const key of required) {
      if (!config[key]) {
        throw new Error(`Variável de ambiente obrigatória não definida: ${key}`);
      }
    }

    return config;
  },
};
