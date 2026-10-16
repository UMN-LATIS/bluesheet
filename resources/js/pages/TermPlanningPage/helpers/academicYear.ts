const FALL_SEASON_DIGIT = "9";
const CENTURY_START_YEAR = 2000;

/**
 * The calendar year the academic year ends in. A term code
 * is `1`, two year digits, then a season digit: 3 spring,
 * 5 summer, 9 fall. Fall belongs to the next year's end.
 */
export function academicYearEndOf(termCode: number): number {
  const digits = String(termCode);
  const calendarYear = CENTURY_START_YEAR + Number(digits.slice(1, 3));
  const isFall = digits.endsWith(FALL_SEASON_DIGIT);

  return isFall ? calendarYear + 1 : calendarYear;
}
