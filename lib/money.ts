export function dollarsToCents(input: string): number {
  const cleaned = input.replace(/[$,]/g, '').trim();
  if (!cleaned) return 0;
  const n = parseFloat(cleaned);
  if (Number.isNaN(n) || n < 0) return 0;
  return Math.round(n * 100);
}

export function formatFee(cents: number): string {
  if (cents === 0) return 'Free';
  if (cents % 100 === 0) return `$${(cents / 100).toFixed(0)}`;
  return `$${(cents / 100).toFixed(2)}`;
}

export function centsToDollarsInput(cents: number): string {
  if (cents === 0) return '';
  if (cents % 100 === 0) return String(cents / 100);
  return (cents / 100).toFixed(2);
}
