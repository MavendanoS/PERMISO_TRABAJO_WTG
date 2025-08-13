/**
 * Date and time utility functions for converting to Chile timezone and formatting.
 * Chile uses UTC-4 (standard time) and UTC-3 (daylight saving time).
 */

/**
 * Returns a Date object adjusted to Chile timezone.
 * Chile DST: Second Sunday in September to First Sunday in April (UTC-3)
 * Chile Standard: First Sunday in April to Second Sunday in September (UTC-4)
 * @param {number} offsetMinutes Number of minutes to add to the current time.
 * @returns {Date} Chile local date and time.
 */
export function getLocalDateTime(offsetMinutes = 0) {
  const now = new Date();
  
  // Determinar si estamos en horario de verano chileno (DST)
  const year = now.getUTCFullYear();
  
  // Segundo domingo de septiembre (inicio DST)
  const septemberSecondSunday = getSecondSunday(year, 8); // Septiembre = mes 8
  // Primer domingo de abril (fin DST)
  const aprilFirstSunday = getFirstSunday(year, 3); // Abril = mes 3
  
  const currentTime = now.getTime();
  const isDST = currentTime >= septemberSecondSunday.getTime() || currentTime < aprilFirstSunday.getTime();
  
  // UTC-3 durante DST, UTC-4 durante horario estándar
  const chileOffsetMinutes = isDST ? -3 * 60 : -4 * 60;
  
  return new Date(now.getTime() + (chileOffsetMinutes + offsetMinutes) * 60000);
}

/**
 * Obtiene el segundo domingo del mes
 */
function getSecondSunday(year, month) {
  const date = new Date(Date.UTC(year, month, 1));
  const firstSunday = 7 - date.getUTCDay();
  return new Date(Date.UTC(year, month, firstSunday + 7));
}

/**
 * Obtiene el primer domingo del mes
 */
function getFirstSunday(year, month) {
  const date = new Date(Date.UTC(year, month, 1));
  const firstSunday = 7 - date.getUTCDay();
  return new Date(Date.UTC(year, month, firstSunday === 7 ? 7 : firstSunday));
}

/**
 * Formats a Date object into a string "YYYY-MM-DD HH:MM:SS".
 * @param {Date} date The date to format.
 * @returns {string} Formatted date/time string.
 */
export function formatLocalDateTime(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
         `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export default {
  getLocalDateTime,
  formatLocalDateTime,
};
