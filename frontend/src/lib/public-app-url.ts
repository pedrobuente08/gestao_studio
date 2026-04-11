/**
 * Origem pública do front (protocolo + host, sem path).
 * No browser usa o domínio real — evita "Invalid callbackURL" quando
 * NEXT_PUBLIC_APP_URL no build não coincide com produção (ex.: ainda localhost).
 */
export function getPublicAppOrigin(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin.replace(/\/+$/, '');
  }
  return (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/+$/, '');
}
