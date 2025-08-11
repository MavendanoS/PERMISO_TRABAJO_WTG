/**
 * Date and time utility functions for converting to local timezone and formatting.
 * These functions mirror the logic in worker.js.
 */

/**
 * Returns a Date object adjusted to the local timezone, optionally offset by minutes.
 * @param {number} offsetMinutes Number of minutes to add to the current time.
 * @returns {Date} Local date and time.
 */
export function getLocalDateTime(offsetMinutes = 0) {
  const now = new Date();
  // Browser environment returns local time, but Worker might be in UTC; adjust using offset.
  const tzOffset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - tzOffset + offsetMinutes * 60000);
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
