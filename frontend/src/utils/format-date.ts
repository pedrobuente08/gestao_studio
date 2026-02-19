export function formatDate(isoString: string): string {
  // → "15/01/2025"
  return new Date(isoString).toLocaleDateString('pt-BR');
}

export function formatDateTime(isoString: string): string {
  // → "15/01/2025 às 14:30"
  return new Date(isoString).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export function formatRelativeDate(isoString: string): string {
  // → "há 3 dias" | "hoje" | "ontem"
  const date = new Date(isoString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  const diffInDays = Math.floor(diffInSeconds / 86400);

  if (diffInDays === 0) return 'hoje';
  if (diffInDays === 1) return 'ontem';
  
  const rtf = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });
  
  if (diffInDays < 7) {
    return rtf.format(-diffInDays, 'day');
  }
  
  if (diffInDays < 30) {
    return rtf.format(-Math.floor(diffInDays / 7), 'week');
  }
  
  if (diffInDays < 365) {
    return rtf.format(-Math.floor(diffInDays / 30), 'month');
  }
  
  return rtf.format(-Math.floor(diffInDays / 365), 'year');
}
