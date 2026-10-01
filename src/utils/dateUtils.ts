/**
 * Standardized Thai Date Formatting Utilities (วัน/เดือน/ปี - DD/MM/YYYY)
 * Ensures consistent Day/Month/Year order across all operating systems and browsers.
 */

export function toThaiYear(year: number): number {
  return year < 2400 ? year + 543 : year;
}

/**
 * Format as DD/MM/YYYY (วัน/เดือน/ปี เช่น 21/09/2569)
 */
export function formatDateDMY(dateInput: Date | string | number | undefined | null): string {
  if (!dateInput) return '';
  const d = typeof dateInput === 'string' && dateInput.includes('-') && !dateInput.includes('T')
    ? new Date(dateInput + 'T00:00:00')
    : new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = toThaiYear(d.getFullYear());
  return `${day}/${month}/${year}`;
}

/**
 * Format as Day/Month (วัน/เดือน เช่น 21/09)
 */
export function formatDateDM(dateInput: Date | string | number | undefined | null): string {
  if (!dateInput) return '';
  const d = typeof dateInput === 'string' && dateInput.includes('-') && !dateInput.includes('T')
    ? new Date(dateInput + 'T00:00:00')
    : new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
}

/**
 * Format as DD Mon YYYY (เช่น 21 ก.ย. 2569)
 */
export function formatDateDMYShort(dateInput: Date | string | number | undefined | null): string {
  if (!dateInput) return '';
  const d = typeof dateInput === 'string' && dateInput.includes('-') && !dateInput.includes('T')
    ? new Date(dateInput + 'T00:00:00')
    : new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  const thaiMonthsShort = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];
  const day = d.getDate();
  const month = thaiMonthsShort[d.getMonth()];
  const year = toThaiYear(d.getFullYear());
  return `${day} ${month} ${year}`;
}

/**
 * Format as Full Thai Date (วัน เดือน ปี เช่น 21 กันยายน 2569 หรือ วันจันทร์ที่ 21 กันยายน 2569)
 */
export function formatFullThaiDate(
  dateInput: Date | string | number | undefined | null,
  includeWeekday = false
): string {
  if (!dateInput) return '';
  const d = typeof dateInput === 'string' && dateInput.includes('-') && !dateInput.includes('T')
    ? new Date(dateInput + 'T00:00:00')
    : new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);

  const thaiDays = [
    'วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'
  ];
  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  const day = d.getDate();
  const month = thaiMonths[d.getMonth()];
  const year = toThaiYear(d.getFullYear());
  const weekday = thaiDays[d.getDay()];

  return includeWeekday ? `${weekday}ที่ ${day} ${month} ${year}` : `${day} ${month} ${year}`;
}

/**
 * Format Time as HH:mm น.
 */
export function formatTimeHM(dateInput: Date | string | number | undefined | null): string {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes} น.`;
}
