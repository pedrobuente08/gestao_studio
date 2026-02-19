export function formatCurrency(valueInCents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valueInCents / 100);
}

export function parseCurrency(formatted: string): number {
  // "R$ 1.500,00" → 150000
  const raw = formatted.replace(/[R$\s.]/g, '').replace(',', '.');
  return Math.round(parseFloat(raw) * 100);
}
