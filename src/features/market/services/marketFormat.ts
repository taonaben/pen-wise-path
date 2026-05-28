export function toNumber(value: number | string | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function cleanText(value: string | null | undefined) {
  return value?.trim() || null;
}
