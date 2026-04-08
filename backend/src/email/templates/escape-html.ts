/**
 * Escapa caracteres especiais HTML para prevenir XSS em templates de email.
 * Aplicar em todo dado vindo do usuário antes de interpolar no HTML.
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
