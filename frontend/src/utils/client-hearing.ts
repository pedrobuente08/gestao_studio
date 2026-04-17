import type { ClientHearingSource } from '@/types/client.types';

export const HEARING_SOURCE_OPTIONS: { value: ClientHearingSource; label: string }[] = [
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'GOOGLE', label: 'Google' },
  { value: 'REFERRAL', label: 'Indicação' },
  { value: 'YOUTUBE', label: 'YouTube' },
  { value: 'OTHER', label: 'Outro' },
];

export function hearingSourceLabel(
  v: ClientHearingSource | null | undefined,
): string {
  if (!v) return '—';
  return HEARING_SOURCE_OPTIONS.find((o) => o.value === v)?.label ?? v;
}
