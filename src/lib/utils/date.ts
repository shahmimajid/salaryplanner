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
