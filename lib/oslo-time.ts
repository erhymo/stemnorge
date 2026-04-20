const OSLO_TIME_ZONE = "Europe/Oslo";

type OsloDateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

type OsloCalendarDate = {
  year: number;
  month: number;
  day: number;
};

const osloDateTimeFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: OSLO_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

function getOsloDateTimeParts(date: Date): OsloDateParts {
  const parts = osloDateTimeFormatter.formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value ?? "0");

  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    hour: read("hour"),
    minute: read("minute"),
    second: read("second"),
  };
}

function toCalendarDate(date: Date): OsloCalendarDate {
  const parts = getOsloDateTimeParts(date);
  return { year: parts.year, month: parts.month, day: parts.day };
}

function formatCalendarDate(date: OsloCalendarDate) {
  return `${date.year}-${pad(date.month)}-${pad(date.day)}`;
}

export function toDatetimeLocalValueInOslo(date: Date) {
  const parts = getOsloDateTimeParts(date);
  return `${formatCalendarDate(parts)}T${pad(parts.hour)}:${pad(parts.minute)}`;
}

export function parseOsloDatetimeLocal(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const match = value.trim().match(/^([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2})$/);

  if (!match) {
    return null;
  }

  const [, yearRaw, monthRaw, dayRaw, hourRaw, minuteRaw] = match;
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);

  let candidate = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));

  for (let index = 0; index < 4; index += 1) {
    const parts = getOsloDateTimeParts(candidate);
    const desiredUtc = Date.UTC(year, month - 1, day, hour, minute, 0);
    const actualUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, 0);
    const diff = desiredUtc - actualUtc;

    if (diff === 0) {
      return candidate;
    }

    candidate = new Date(candidate.getTime() + diff);
  }

  const finalParts = getOsloDateTimeParts(candidate);

  if (finalParts.year !== year || finalParts.month !== month || finalParts.day !== day || finalParts.hour !== hour || finalParts.minute !== minute) {
    return null;
  }

  return candidate;
}

export function addDaysInCalendarDate(date: OsloCalendarDate, days: number): OsloCalendarDate {
  const next = new Date(Date.UTC(date.year, date.month - 1, date.day));
  next.setUTCDate(next.getUTCDate() + days);

  return {
    year: next.getUTCFullYear(),
    month: next.getUTCMonth() + 1,
    day: next.getUTCDate(),
  };
}

export function getMondayBaseInOslo(date = new Date()) {
  const calendarDate = toCalendarDate(date);
  const weekday = new Date(Date.UTC(calendarDate.year, calendarDate.month - 1, calendarDate.day)).getUTCDay();
  const diff = weekday === 0 ? -6 : 1 - weekday;

  return addDaysInCalendarDate(calendarDate, diff);
}

export function buildOsloDateTime(date: OsloCalendarDate, hour: number, minute = 0) {
  return parseOsloDatetimeLocal(`${formatCalendarDate(date)}T${pad(hour)}:${pad(minute)}`);
}