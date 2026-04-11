/**
 * Origens do frontend permitidas em CORS e no Better Auth (CSRF / trustedOrigins).
 * Normaliza para evitar 403 por diferença só de barra final (ex.: APP_URL com `/`).
 */
export function collectTrustedOriginStrings(): string[] {
  const raw: string[] = [
    process.env.APP_URL || '',
    ...(process.env.EXTRA_TRUSTED_ORIGINS?.split(',') ?? []),
  ];

  const set = new Set<string>();
  for (const entry of raw) {
    const s = entry.trim().replace(/\/+$/, '');
    if (s.length > 0) set.add(s);
  }

  if (set.size === 0) {
    set.add('http://localhost:3000');
  }

  return [...set];
}

/** Primeira origem (APP_URL normalizado) para links em emails e callbackURL. */
export function getPrimaryAppUrl(): string {
  const list = collectTrustedOriginStrings();
  return list[0] ?? 'http://localhost:3000';
}
