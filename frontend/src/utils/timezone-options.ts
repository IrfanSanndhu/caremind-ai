export interface TimezoneOption {
  /** IANA timezone id stored in the database */
  value: string;
  /** Human label shown in the UI */
  label: string;
  /** UTC offset in hours (5.5 for India, etc.) — used for sorting */
  offsetHours: number;
  /** Extra search keywords (lowercase) */
  keywords: string;
}

function opt(
  value: string,
  offsetHours: number,
  cityLabel: string,
  keywords = '',
): TimezoneOption {
  const sign = offsetHours >= 0 ? '+' : '-';
  const abs = Math.abs(offsetHours);
  const h = Math.floor(abs);
  const m = Math.round((abs - h) * 60);
  const offset = `UTC${sign}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  return {
    value,
    offsetHours,
    label: `(${offset}) ${cityLabel}`,
    keywords: `${cityLabel} ${value} ${offset} ${keywords}`.toLowerCase(),
  };
}

/**
 * Curated IANA zones covering UTC−12 … UTC+12 (and common half-hour offsets).
 * Searchable by city, region (e.g. "asia"), country, or offset.
 */
export const TIMEZONE_OPTIONS: TimezoneOption[] = [
  // UTC−12 … UTC−1
  opt('Etc/GMT+12', -12, 'Baker Island', 'pacific'),
  opt('Pacific/Pago_Pago', -11, 'Pago Pago, American Samoa', 'pacific'),
  opt('Pacific/Honolulu', -10, 'Honolulu, Hawaii', 'usa pacific'),
  opt('America/Anchorage', -9, 'Anchorage, Alaska', 'usa'),
  opt('America/Los_Angeles', -8, 'Los Angeles, Vancouver', 'usa canada pacific'),
  opt('America/Denver', -7, 'Denver, Phoenix', 'usa mountain'),
  opt('America/Chicago', -6, 'Chicago, Mexico City', 'usa central'),
  opt('America/New_York', -5, 'New York, Toronto', 'usa canada eastern'),
  opt('America/Caracas', -4, 'Caracas, Santiago', 'south america'),
  opt('America/Sao_Paulo', -3, 'São Paulo, Buenos Aires', 'brazil argentina'),
  opt('Atlantic/South_Georgia', -2, 'South Georgia', 'atlantic'),
  opt('Atlantic/Azores', -1, 'Azores', 'atlantic portugal'),

  // UTC±0 … UTC+3
  opt('UTC', 0, 'UTC / GMT', 'greenwich london'),
  opt('Europe/London', 0, 'London, Dublin', 'uk ireland europe'),
  opt('Europe/Paris', 1, 'Paris, Berlin, Rome', 'europe central'),
  opt('Europe/Helsinki', 2, 'Helsinki, Cairo, Johannesburg', 'europe africa'),
  opt('Europe/Moscow', 3, 'Moscow, Istanbul', 'europe russia turkey'),
  opt('Asia/Riyadh', 3, 'Riyadh, Baghdad', 'middle east arabia'),

  // Asia & South Asia UTC+4 … UTC+9
  opt('Asia/Dubai', 4, 'Dubai, Abu Dhabi', 'uae middle east arabia gulf'),
  opt('Asia/Karachi', 5, 'Karachi, Islamabad, Lahore', 'pakistan asia south asia'),
  opt('Asia/Kolkata', 5.5, 'Mumbai, Delhi, Kolkata', 'india asia south asia'),
  opt('Asia/Kathmandu', 5.75, 'Kathmandu', 'nepal asia'),
  opt('Asia/Dhaka', 6, 'Dhaka', 'bangladesh asia'),
  opt('Asia/Almaty', 6, 'Almaty, Astana', 'kazakhstan asia central asia'),
  opt('Asia/Yangon', 6.5, 'Yangon', 'myanmar asia'),
  opt('Asia/Bangkok', 7, 'Bangkok, Hanoi, Jakarta', 'thailand vietnam indonesia asia southeast'),
  opt('Asia/Singapore', 8, 'Singapore, Kuala Lumpur', 'malaysia asia southeast'),
  opt('Asia/Shanghai', 8, 'Beijing, Shanghai', 'china asia east'),
  opt('Asia/Hong_Kong', 8, 'Hong Kong', 'china asia east'),
  opt('Asia/Taipei', 8, 'Taipei', 'taiwan asia east'),
  opt('Asia/Tokyo', 9, 'Tokyo, Osaka', 'japan asia east'),
  opt('Asia/Seoul', 9, 'Seoul', 'korea asia east'),

  // UTC+9:30 … UTC+12
  opt('Australia/Darwin', 9.5, 'Darwin', 'australia'),
  opt('Australia/Sydney', 10, 'Sydney, Melbourne', 'australia'),
  opt('Pacific/Guam', 10, 'Guam', 'pacific'),
  opt('Pacific/Guadalcanal', 11, 'Solomon Islands', 'pacific'),
  opt('Pacific/Auckland', 12, 'Auckland, Wellington', 'new zealand pacific'),
  opt('Pacific/Fiji', 12, 'Fiji', 'pacific'),
].sort((a, b) => a.offsetHours - b.offsetHours || a.label.localeCompare(b.label));

export function findTimezoneOption(value: string): TimezoneOption | undefined {
  return TIMEZONE_OPTIONS.find((o) => o.value === value);
}

export function filterTimezoneOptions(query: string): TimezoneOption[] {
  const q = query.trim().toLowerCase();
  if (!q) return TIMEZONE_OPTIONS;
  return TIMEZONE_OPTIONS.filter(
    (o) =>
      o.keywords.includes(q) ||
      o.label.toLowerCase().includes(q) ||
      o.value.toLowerCase().includes(q),
  );
}
