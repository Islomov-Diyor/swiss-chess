const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function formatDateDDMMMYYYY(isoDate: string): string {
  const d = new Date(isoDate);
  const day = String(d.getDate()).padStart(2, '0');
  const month = MONTHS[d.getMonth()] ?? '';
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}
