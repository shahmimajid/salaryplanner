const rmFormatter = new Intl.NumberFormat("ms-MY", {
  style: "currency",
  currency: "MYR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formats a number/string as Malaysian Ringgit, e.g. "RM19,088.00". */
export function formatRinggit(amount: number | string): string {
  return rmFormatter.format(Number(amount));
}
