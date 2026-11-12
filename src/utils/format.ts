const CURRENCY_SYMBOL = '$';

export function formatCurrency(amount: number): string {
  const digits = Number.isInteger(amount) ? 0 : 2;
  return `${CURRENCY_SYMBOL}${amount.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;
}

export function formatCount(count: number): string {
  return count.toLocaleString('en-US');
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}