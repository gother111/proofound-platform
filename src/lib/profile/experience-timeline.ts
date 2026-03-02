const MONTH_INPUT_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;
const ISO_DATE_REGEX = /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const ISO_YEAR_MONTH_REGEX = /^(\d{4})-(0[1-9]|1[0-2])$/;

const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const MONTH_TOKEN_TO_NUMBER: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};
const DURATION_SEPARATOR_PATTERN = '(?:-|–|—|to)';
const SLASH_MONTH_PATTERN = '(?:0?[1-9]|1[0-2])';

function normalizeIsoDate(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (ISO_DATE_REGEX.test(trimmed)) {
    return trimmed;
  }

  if (ISO_YEAR_MONTH_REGEX.test(trimmed)) {
    return `${trimmed}-01`;
  }

  const isoPrefixMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoPrefixMatch && ISO_DATE_REGEX.test(isoPrefixMatch[1])) {
    return isoPrefixMatch[1];
  }

  return null;
}

function toYearMonth(dateValue?: string | null): { year: number; month: number } | null {
  const normalized = normalizeIsoDate(dateValue);
  if (!normalized) {
    return null;
  }

  const match = normalized.match(/^(\d{4})-(\d{2})-\d{2}$/);
  if (!match) {
    return null;
  }

  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }

  return { year, month };
}

function compareYearMonth(
  a: { year: number; month: number },
  b: { year: number; month: number }
): number {
  if (a.year !== b.year) {
    return a.year - b.year;
  }
  return a.month - b.month;
}

function formatYearMonth({ year, month }: { year: number; month: number }): string {
  return `${MONTH_LABELS[month - 1]} ${year}`;
}

function isPresentToken(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized === 'present' || normalized === 'current' || normalized === 'now';
}

function parseMonthYearTokenToIsoDate(value: string): string | null {
  const match = value.trim().match(/^([A-Za-z]{3,9})\s+(\d{4})$/);
  if (!match) {
    return null;
  }

  const monthNumber = MONTH_TOKEN_TO_NUMBER[match[1].toLowerCase()];
  if (!monthNumber) {
    return null;
  }

  return `${match[2]}-${String(monthNumber).padStart(2, '0')}-01`;
}

function parseMonthSlashYearToIsoDate(value: string): string | null {
  const match = value.trim().match(new RegExp(`^(${SLASH_MONTH_PATTERN})/(\\d{4})$`));
  if (!match) {
    return null;
  }

  const month = Number.parseInt(match[1], 10);
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }

  return `${match[2]}-${String(month).padStart(2, '0')}-01`;
}

function parseYearSlashMonthToIsoDate(value: string): string | null {
  const match = value.trim().match(new RegExp(`^(\\d{4})/(${SLASH_MONTH_PATTERN})$`));
  if (!match) {
    return null;
  }

  const month = Number.parseInt(match[2], 10);
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }

  return `${match[1]}-${String(month).padStart(2, '0')}-01`;
}

export function monthInputToIsoDate(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!MONTH_INPUT_REGEX.test(trimmed)) {
    return null;
  }

  return `${trimmed}-01`;
}

export function isoDateToMonthInput(value?: string | null): string {
  const normalized = normalizeIsoDate(value);
  return normalized ? normalized.slice(0, 7) : '';
}

export function formatExperienceDurationFromDates(
  startDate?: string | null,
  endDate?: string | null
): string | null {
  const start = toYearMonth(startDate);
  if (!start) {
    return null;
  }

  const end = toYearMonth(endDate);
  if (end && compareYearMonth(end, start) < 0) {
    return null;
  }

  const startLabel = formatYearMonth(start);
  const endLabel = end ? formatYearMonth(end) : 'Present';

  return `${startLabel} - ${endLabel}`;
}

export function parseLegacyDurationToTimeline(
  duration?: string | null
): { startDate: string; endDate: string | null } | null {
  if (!duration) {
    return null;
  }

  const trimmed = duration.trim();
  if (!trimmed) {
    return null;
  }

  const fullIsoMatch = trimmed.match(
    /^(\d{4}-\d{2}-\d{2})\s*-\s*(\d{4}-\d{2}-\d{2}|present|current)$/i
  );
  if (fullIsoMatch) {
    const startDate = normalizeIsoDate(fullIsoMatch[1]);
    const endToken = fullIsoMatch[2];
    const endDate = isPresentToken(endToken) ? null : normalizeIsoDate(endToken);

    if (!startDate) {
      return null;
    }

    if (endDate) {
      const startYearMonth = toYearMonth(startDate);
      const endYearMonth = toYearMonth(endDate);
      if (!startYearMonth || !endYearMonth || compareYearMonth(endYearMonth, startYearMonth) < 0) {
        return null;
      }
    }

    return { startDate, endDate };
  }

  const isoMonthMatch = trimmed.match(/^(\d{4}-\d{2})\s*-\s*(\d{4}-\d{2}|present|current)$/i);
  if (isoMonthMatch) {
    const startDate = monthInputToIsoDate(isoMonthMatch[1]);
    const endToken = isoMonthMatch[2];
    const endDate = isPresentToken(endToken) ? null : monthInputToIsoDate(endToken);

    if (!startDate) {
      return null;
    }

    if (endDate) {
      const startYearMonth = toYearMonth(startDate);
      const endYearMonth = toYearMonth(endDate);
      if (!startYearMonth || !endYearMonth || compareYearMonth(endYearMonth, startYearMonth) < 0) {
        return null;
      }
    }

    return { startDate, endDate };
  }

  const monthSlashYearMatch = trimmed.match(
    new RegExp(
      `^(${SLASH_MONTH_PATTERN}/\\d{4})\\s*${DURATION_SEPARATOR_PATTERN}\\s*(${SLASH_MONTH_PATTERN}/\\d{4}|present|current|now)$`,
      'i'
    )
  );
  if (monthSlashYearMatch) {
    const startDate = parseMonthSlashYearToIsoDate(monthSlashYearMatch[1]);
    const endToken = monthSlashYearMatch[2];
    const endDate = isPresentToken(endToken) ? null : parseMonthSlashYearToIsoDate(endToken);

    if (!startDate) {
      return null;
    }

    if (endDate) {
      const startYearMonth = toYearMonth(startDate);
      const endYearMonth = toYearMonth(endDate);
      if (!startYearMonth || !endYearMonth || compareYearMonth(endYearMonth, startYearMonth) < 0) {
        return null;
      }
    }

    return { startDate, endDate };
  }

  const yearSlashMonthMatch = trimmed.match(
    new RegExp(
      `^(\\d{4}/${SLASH_MONTH_PATTERN})\\s*${DURATION_SEPARATOR_PATTERN}\\s*(\\d{4}/${SLASH_MONTH_PATTERN}|present|current|now)$`,
      'i'
    )
  );
  if (yearSlashMonthMatch) {
    const startDate = parseYearSlashMonthToIsoDate(yearSlashMonthMatch[1]);
    const endToken = yearSlashMonthMatch[2];
    const endDate = isPresentToken(endToken) ? null : parseYearSlashMonthToIsoDate(endToken);

    if (!startDate) {
      return null;
    }

    if (endDate) {
      const startYearMonth = toYearMonth(startDate);
      const endYearMonth = toYearMonth(endDate);
      if (!startYearMonth || !endYearMonth || compareYearMonth(endYearMonth, startYearMonth) < 0) {
        return null;
      }
    }

    return { startDate, endDate };
  }

  const monthTokenMatch = trimmed.match(
    new RegExp(
      `^([A-Za-z]{3,9}\\s+\\d{4})\\s*${DURATION_SEPARATOR_PATTERN}\\s*([A-Za-z]{3,9}\\s+\\d{4}|present|current|now)$`,
      'i'
    )
  );
  if (monthTokenMatch) {
    const startDate = parseMonthYearTokenToIsoDate(monthTokenMatch[1]);
    const endToken = monthTokenMatch[2];
    const endDate = isPresentToken(endToken) ? null : parseMonthYearTokenToIsoDate(endToken);

    if (!startDate) {
      return null;
    }

    if (endDate) {
      const startYearMonth = toYearMonth(startDate);
      const endYearMonth = toYearMonth(endDate);
      if (!startYearMonth || !endYearMonth || compareYearMonth(endYearMonth, startYearMonth) < 0) {
        return null;
      }
    }

    return { startDate, endDate };
  }

  const yearRangeMatch = trimmed.match(
    new RegExp(`^(\\d{4})\\s*${DURATION_SEPARATOR_PATTERN}\\s*(\\d{4}|present|current|now)$`, 'i')
  );
  if (yearRangeMatch) {
    const startDate = `${yearRangeMatch[1]}-01-01`;
    const endToken = yearRangeMatch[2];
    const endDate = isPresentToken(endToken) ? null : `${endToken}-01-01`;

    if (endDate) {
      const startYearMonth = toYearMonth(startDate);
      const endYearMonth = toYearMonth(endDate);
      if (!startYearMonth || !endYearMonth || compareYearMonth(endYearMonth, startYearMonth) < 0) {
        return null;
      }
    }

    return { startDate, endDate };
  }

  return null;
}

export function buildExperienceTimeline(input: {
  startDate?: string | null;
  endDate?: string | null;
  duration?: string | null;
}): { startDate: string | null; endDate: string | null; duration: string } {
  let startDate = normalizeIsoDate(input.startDate);
  let endDate = normalizeIsoDate(input.endDate);

  if (!startDate) {
    const parsedLegacy = parseLegacyDurationToTimeline(input.duration);
    if (parsedLegacy) {
      startDate = parsedLegacy.startDate;
      endDate = parsedLegacy.endDate;
    }
  }

  if (startDate && endDate) {
    const startYearMonth = toYearMonth(startDate);
    const endYearMonth = toYearMonth(endDate);
    if (!startYearMonth || !endYearMonth || compareYearMonth(endYearMonth, startYearMonth) < 0) {
      endDate = null;
    }
  }

  const canonicalDuration = formatExperienceDurationFromDates(startDate, endDate);
  const fallbackDuration = input.duration?.trim();

  return {
    startDate,
    endDate,
    duration:
      canonicalDuration ||
      (fallbackDuration && fallbackDuration.length > 0
        ? fallbackDuration
        : 'Duration not specified'),
  };
}
