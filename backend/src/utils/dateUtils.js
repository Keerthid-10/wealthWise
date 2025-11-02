/**
 * Date utility functions
 * Handles device time synchronization and date operations
 */

/**
 * Get current date based on device/client time
 * @param {Date} clientDate - Date from client device
 * @returns {Date} Current date
 */
const getCurrentDate = (clientDate = null) => {
  return clientDate ? new Date(clientDate) : new Date();
};

/**
 * Get start of day
 * @param {Date} date
 * @returns {Date}
 */
const getStartOfDay = (date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
};

/**
 * Get end of day
 * @param {Date} date
 * @returns {Date}
 */
const getEndOfDay = (date) => {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
};

/**
 * Get start of week (Monday)
 * @param {Date} date
 * @returns {Date}
 */
const getStartOfWeek = (date) => {
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1);
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  return start;
};

/**
 * Get end of week (Sunday)
 * @param {Date} date
 * @returns {Date}
 */
const getEndOfWeek = (date) => {
  const end = getStartOfWeek(date);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
};

/**
 * Get start of month
 * @param {Date} date
 * @returns {Date}
 */
const getStartOfMonth = (date) => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

/**
 * Get end of month
 * @param {Date} date
 * @returns {Date}
 */
const getEndOfMonth = (date) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
};

/**
 * Check if it's weekend (Saturday or Sunday)
 * @param {Date} date
 * @returns {boolean}
 */
const isWeekend = (date) => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

/**
 * Get date range for last N months
 * @param {number} months
 * @param {Date} currentDate
 * @returns {object} {startDate, endDate}
 */
const getLastNMonthsRange = (months, currentDate = new Date()) => {
  const endDate = getEndOfMonth(currentDate);
  const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - months + 1, 1);

  return {
    startDate,
    endDate
  };
};

/**
 * Get days remaining in month
 * @param {Date} date
 * @returns {number}
 */
const getDaysRemainingInMonth = (date) => {
  const endOfMonth = getEndOfMonth(date);
  const diff = endOfMonth - date;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

/**
 * Add days to date
 * @param {Date} date
 * @param {number} days
 * @returns {Date}
 */
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Add months to date
 * @param {Date} date
 * @param {number} months
 * @returns {Date}
 */
const addMonths = (date, months) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

/**
 * Check if date is in range
 * @param {Date} date
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {boolean}
 */
const isDateInRange = (date, startDate, endDate) => {
  return date >= startDate && date <= endDate;
};

/**
 * Format date to YYYY-MM-DD
 * @param {Date} date
 * @returns {string}
 */
const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

module.exports = {
  getCurrentDate,
  getStartOfDay,
  getEndOfDay,
  getStartOfWeek,
  getEndOfWeek,
  getStartOfMonth,
  getEndOfMonth,
  isWeekend,
  getLastNMonthsRange,
  getDaysRemainingInMonth,
  addDays,
  addMonths,
  isDateInRange,
  formatDate
};
