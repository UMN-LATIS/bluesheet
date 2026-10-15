const FALL_SEASON_DIGIT = "9";
const FIRST_TWO_YEAR_DIGITS = 2000;

/**
 * The calendar year the academic year ends in. A term code
 * is `1`, two year digits, then a season digit: 3 spring,
 * 5 summer, 9 fall. Fall belongs to the next year's end.
 */
export function academicYearEndOf(termCode: number): number {
  const digits = String(termCode);
  const calendarYear = FIRST_TWO_YEAR_DIGITS + Number(digits.slice(1, 3));
  const isFall = digits.endsWith(FALL_SEASON_DIGIT);

  return isFall ? calendarYear + 1 : calendarYear;
}
