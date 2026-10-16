const LOCALE = 'es-CO';
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;

const pad = (value) => String(value).padStart(2, '0');

/** Parses ISO strings; date-only values are treated as local dates (not UTC). */
export function toDate(value) {
  if (value instanceof Date) return value;
  if (typeof value === 'string' && DATE_ONLY.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(value);
}

const formatter = (options) => new Intl.DateTimeFormat(LOCALE, options);

export const formatDate = (value) =>
  formatter({ day: 'numeric', month: 'short', year: 'numeric' }).format(toDate(value));

export const formatLongDate = (value) =>
  capitalize(formatter({ weekday: 'long', day: 'numeric', month: 'long' }).format(toDate(value)));

export const formatTime = (value) =>
  formatter({ hour: 'numeric', minute: '2-digit', hour12: true }).format(toDate(value));

export const formatDateTime = (value) => `${formatDate(value)} · ${formatTime(value)}`;

export const formatWeekdayShort = (value) =>
  capitalize(formatter({ weekday: 'short' }).format(toDate(value)).replace('.', ''));

export const formatMonthShort = (value) =>
  formatter({ month: 'short' }).format(toDate(value)).replace('.', '');

export function formatSlot(time) {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return formatTime(date);
}

export const formatNumber = (value) =>
  new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 1 }).format(value);

function startOfDay(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function daysUntil(value) {
  return Math.round((startOfDay(toDate(value)) - startOfDay(new Date())) / DAY_MS);
}

export function formatRelativeDay(value) {
  const days = daysUntil(value);
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Mañana';
  if (days === -1) return 'Ayer';
  return days > 0 ? `En ${days} días` : `Hace ${-days} días`;
}

export function toISODate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function toLocalDateTime(date) {
  return `${toISODate(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function calculateAge(birthDate) {
  if (!birthDate) return null;
  const birth = toDate(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const hadBirthday =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
  if (!hadBirthday) age -= 1;
  return age;
}

export function getInitials(firstName = '', lastName = '') {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function capitalize(text) {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

export function greetingForNow() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}
