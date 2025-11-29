/**
 * Fiscal Year Utilities
 * Thai fiscal year runs from July 1 to June 30
 * Example: FY 2025 = July 1, 2024 to June 30, 2025
 */

/**
 * Get the current fiscal year
 * @returns Current fiscal year number
 */
export function getCurrentFiscalYear(): number {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-11

  // If current month is July (6) or later, fiscal year is next year
  // Otherwise, fiscal year is current year
  return currentMonth >= 6 ? currentYear + 1 : currentYear;
}

/**
 * Get the start and end dates for a specific fiscal year
 * @param fiscalYear The fiscal year number
 * @returns Object with startDate and endDate
 */
export function getFiscalYearRange(fiscalYear: number): {
  startDate: Date;
  endDate: Date;
} {
  // Fiscal year starts on July 1 of previous year
  const startDate = new Date(fiscalYear - 1, 6, 1); // Month is 0-indexed, so 6 = July
  
  // Fiscal year ends on June 30 of current year
  const endDate = new Date(fiscalYear, 5, 30, 23, 59, 59, 999); // Month 5 = June

  return { startDate, endDate };
}

/**
 * Get fiscal year for a specific date
 * @param date The date to check
 * @returns Fiscal year number
 */
export function getFiscalYearForDate(date: Date): number {
  const year = date.getFullYear();
  const month = date.getMonth();

  return month >= 6 ? year + 1 : year;
}

/**
 * Check if a date is within a specific fiscal year
 * @param date The date to check
 * @param fiscalYear The fiscal year to check against
 * @returns True if date is within the fiscal year
 */
export function isDateInFiscalYear(date: Date, fiscalYear: number): boolean {
  const { startDate, endDate } = getFiscalYearRange(fiscalYear);
  return date >= startDate && date <= endDate;
}

/**
 * Format fiscal year for display
 * @param fiscalYear The fiscal year number
 * @returns Formatted string (e.g., "FY 2025 (Jul 2024 - Jun 2025)")
 */
export function formatFiscalYear(fiscalYear: number): string {
  const startYear = fiscalYear - 1;
  return `FY ${fiscalYear} (Jul ${startYear} - Jun ${fiscalYear})`;
}
