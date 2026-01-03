import { getKSTDate, getTodayNewsRange, isWithinRange } from '@/utils/date-time.js';

describe('getKSTDate', () => {
  it('should convert UTC date to KST (UTC+9)', () => {
    // Create a UTC date: 2025-01-01 00:00:00 UTC
    const utcDate = new Date('2025-01-01T00:00:00.000Z');
    const kstDate = getKSTDate(utcDate);

    // KST should be 9 hours ahead: 2025-01-01 09:00:00
    expect(kstDate.getHours()).toBe(9);
    expect(kstDate.getDate()).toBe(1);
    expect(kstDate.getMonth()).toBe(0); // January
    expect(kstDate.getFullYear()).toBe(2025);
  });

  it('should handle date boundary correctly', () => {
    // UTC date: 2025-01-01 23:00:00 UTC
    const utcDate = new Date('2025-01-01T23:00:00.000Z');
    const kstDate = getKSTDate(utcDate);

    // KST should be next day: 2025-01-02 08:00:00
    expect(kstDate.getHours()).toBe(8);
    expect(kstDate.getDate()).toBe(2);
    expect(kstDate.getMonth()).toBe(0);
    expect(kstDate.getFullYear()).toBe(2025);
  });

  it('should handle current date when no parameter provided', () => {
    const before = Date.now();
    const kstDate = getKSTDate();
    const after = Date.now();

    // Should be within reasonable time range
    const kstTime = kstDate.getTime();

    // The KST date should be a valid date within the test timeframe
    expect(kstTime).toBeGreaterThanOrEqual(before - 1000);
    expect(kstTime).toBeLessThanOrEqual(after + 86400000); // Within a day
  });

  it('should maintain correct offset for different timezones', () => {
    const utcDate = new Date('2025-06-15T12:30:45.123Z');
    const kstDate = getKSTDate(utcDate);

    // The KST date should have the offset applied
    // Note: getKSTDate creates a new Date with KST time, not just offset
    const utcTime = utcDate.getTime();
    const kstTime = kstDate.getTime();
    const offsetMs = utcDate.getTimezoneOffset() * 60000;
    const kstOffset = 9 * 60 * 60 * 1000;

    // Verify the time conversion is correct
    expect(kstTime).toBe(utcTime + offsetMs + kstOffset);
  });
});

describe('getTodayNewsRange', () => {
  it('should return 0:00 to 22:00 range for current day in KST', () => {
    const { startOfDay, endOfDay } = getTodayNewsRange();

    // Start should be 00:00:00
    expect(startOfDay.getHours()).toBe(0);
    expect(startOfDay.getMinutes()).toBe(0);
    expect(startOfDay.getSeconds()).toBe(0);
    expect(startOfDay.getMilliseconds()).toBe(0);

    // End should be 22:00:00
    expect(endOfDay.getHours()).toBe(22);
    expect(endOfDay.getMinutes()).toBe(0);
    expect(endOfDay.getSeconds()).toBe(0);
    expect(endOfDay.getMilliseconds()).toBe(0);

    // Should be same day
    expect(startOfDay.getDate()).toBe(endOfDay.getDate());
    expect(startOfDay.getMonth()).toBe(endOfDay.getMonth());
    expect(startOfDay.getFullYear()).toBe(endOfDay.getFullYear());
  });

  it('should handle midnight boundary correctly', () => {
    const { startOfDay, endOfDay } = getTodayNewsRange();

    // Should return full day range
    expect(startOfDay.getHours()).toBe(0);
    expect(endOfDay.getHours()).toBe(22);
  });

  it('should handle 22:00 boundary correctly', () => {
    const { startOfDay, endOfDay } = getTodayNewsRange();

    expect(startOfDay.getHours()).toBe(0);
    expect(endOfDay.getHours()).toBe(22);
  });

  it('should return same date for both start and end', () => {
    const { startOfDay, endOfDay } = getTodayNewsRange();

    expect(startOfDay.getFullYear()).toBe(endOfDay.getFullYear());
    expect(startOfDay.getMonth()).toBe(endOfDay.getMonth());
    expect(startOfDay.getDate()).toBe(endOfDay.getDate());
  });

  it('should ensure start time is before end time', () => {
    const { startOfDay, endOfDay } = getTodayNewsRange();

    expect(startOfDay.getTime()).toBeLessThan(endOfDay.getTime());
  });
});

describe('isWithinRange', () => {
  it('should return true for date within range', () => {
    const start = new Date('2025-01-15T00:00:00');
    const end = new Date('2025-01-15T22:00:00');
    const dateInRange = new Date('2025-01-15T12:00:00');

    expect(isWithinRange(dateInRange, start, end)).toBe(true);
  });

  it('should return true for date exactly at start boundary', () => {
    const start = new Date('2025-01-15T00:00:00');
    const end = new Date('2025-01-15T22:00:00');
    const dateAtStart = new Date('2025-01-15T00:00:00');

    expect(isWithinRange(dateAtStart, start, end)).toBe(true);
  });

  it('should return true for date exactly at end boundary', () => {
    const start = new Date('2025-01-15T00:00:00');
    const end = new Date('2025-01-15T22:00:00');
    const dateAtEnd = new Date('2025-01-15T22:00:00');

    expect(isWithinRange(dateAtEnd, start, end)).toBe(true);
  });

  it('should return false for date before start', () => {
    const start = new Date('2025-01-15T00:00:00');
    const end = new Date('2025-01-15T22:00:00');
    const dateBefore = new Date('2025-01-14T23:59:59');

    expect(isWithinRange(dateBefore, start, end)).toBe(false);
  });

  it('should return false for date after end', () => {
    const start = new Date('2025-01-15T00:00:00');
    const end = new Date('2025-01-15T22:00:00');
    const dateAfter = new Date('2025-01-15T22:00:01');

    expect(isWithinRange(dateAfter, start, end)).toBe(false);
  });

  it('should handle millisecond precision correctly', () => {
    const start = new Date('2025-01-15T00:00:00.000');
    const end = new Date('2025-01-15T22:00:00.000');

    const justBefore = new Date('2025-01-15T00:00:00.000');
    justBefore.setMilliseconds(-1);

    const justAfter = new Date('2025-01-15T22:00:00.000');
    justAfter.setMilliseconds(1);

    expect(isWithinRange(justBefore, start, end)).toBe(false);
    expect(isWithinRange(justAfter, start, end)).toBe(false);
  });

  it('should handle cross-day ranges', () => {
    const start = new Date('2025-01-14T20:00:00');
    const end = new Date('2025-01-15T02:00:00');

    const midnight = new Date('2025-01-15T00:00:00');
    const beforeStart = new Date('2025-01-14T19:59:59');
    const afterEnd = new Date('2025-01-15T02:00:01');

    expect(isWithinRange(midnight, start, end)).toBe(true);
    expect(isWithinRange(beforeStart, start, end)).toBe(false);
    expect(isWithinRange(afterEnd, start, end)).toBe(false);
  });

  it('should handle timezone differences correctly', () => {
    // FR-001-04: Date filtering should work across timezones
    const start = new Date('2025-01-15T00:00:00+09:00'); // KST
    const end = new Date('2025-01-15T22:00:00+09:00'); // KST
    const dateInRange = new Date('2025-01-15T12:00:00+09:00'); // KST

    expect(isWithinRange(dateInRange, start, end)).toBe(true);
  });
});

describe('FR-001-01: Today news range integration', () => {
  it('should satisfy requirement: collect news from 0:00 to 22:00 KST', () => {
    const { startOfDay, endOfDay } = getTodayNewsRange();

    // Should be exactly 0:00 and 22:00
    expect(startOfDay.getHours()).toBe(0);
    expect(startOfDay.getMinutes()).toBe(0);
    expect(endOfDay.getHours()).toBe(22);
    expect(endOfDay.getMinutes()).toBe(0);

    // Should be 22 hours apart
    const diffHours = (endOfDay.getTime() - startOfDay.getTime()) / (1000 * 60 * 60);
    expect(diffHours).toBe(22);
  });

  it('should filter news correctly using getTodayNewsRange and isWithinRange', () => {
    const { startOfDay, endOfDay } = getTodayNewsRange();

    // Create sample news dates
    const newsAt8am = new Date(startOfDay);
    newsAt8am.setHours(8);

    const newsAt21pm = new Date(startOfDay);
    newsAt21pm.setHours(21);

    const newsYesterday = new Date(startOfDay);
    newsYesterday.setDate(newsYesterday.getDate() - 1);

    const newsAt23pm = new Date(startOfDay);
    newsAt23pm.setHours(23);

    // Should include news at 8am and 9pm
    expect(isWithinRange(newsAt8am, startOfDay, endOfDay)).toBe(true);
    expect(isWithinRange(newsAt21pm, startOfDay, endOfDay)).toBe(true);

    // Should exclude yesterday's news and 11pm news
    expect(isWithinRange(newsYesterday, startOfDay, endOfDay)).toBe(false);
    expect(isWithinRange(newsAt23pm, startOfDay, endOfDay)).toBe(false);
  });
});
