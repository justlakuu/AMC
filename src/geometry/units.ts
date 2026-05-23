export function parseDistanceToMm(value: string) {
  const trimmed = value.trim().replace(',', '.').toLowerCase();
  const match = trimmed.match(/^([0-9]*\.?[0-9]+)\s*(mm|cm)?$/);

  if (!match) {
    return Number.NaN;
  }

  const amount = Number(match[1]);
  const unit = match[2] ?? 'mm';
  return unit === 'cm' ? amount * 10 : amount;
}
