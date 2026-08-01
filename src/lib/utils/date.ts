export const APP_TIMEZONE = "Asia/Kuala_Lumpur";

const ddmmyyyyFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: APP_TIMEZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

/** Formats a date as DD/MM/YYYY in the Asia/Kuala_Lumpur timezone. */
export function formatDateDDMMYYYY(date: Date): string {
  return ddmmyyyyFormatter.format(date);
}

/**
 * Converts a "YYYY-MM" payroll month (matching an HTML <input type="month">
 * value and the calculation engine's payrollMonth convention) into the Date
 * stored on SalaryEntry.payrollMonth (always the 1st of the month, UTC —
 * avoids local-timezone off-by-one-day drift for a @db.Date column).
 */
export function payrollMonthToDate(payrollMonth: string): Date {
  return new Date(`${payrollMonth}-01T00:00:00.000Z`);
}

/** Inverse of payrollMonthToDate — reads a stored payrollMonth Date back into "YYYY-MM". */
export function dateToPayrollMonth(date: Date): string {
  return date.toISOString().slice(0, 7);
}
