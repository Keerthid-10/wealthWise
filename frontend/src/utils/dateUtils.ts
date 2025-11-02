/**
 * Date Utilities for Device Time Synchronization
 * Uses device's local time automatically
 */

/**
 * Get current date from device
 * @returns Current date from device
 */
export const getCurrentDate = (): Date => {
  return new Date();
};

/**
 * Format date to YYYY-MM-DD
 * @param date Date to format
 * @returns Formatted date string
 */
export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Format date to local string
 * @param date Date to format
 * @returns Local date string
 */
export const formatLocalDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString();
};

/**
 * Format date and time
 * @param date Date to format
 * @returns Formatted date and time
 */
export const formatDateTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString();
};

/**
 * Check if date is weekend
 * @param date Date to check
 * @returns True if weekend
 */
export const isWeekend = (date: Date = new Date()): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
};

/**
 * Get start of week
 * @param date Reference date
 * @returns Start of week date
 */
export const getStartOfWeek = (date: Date = new Date()): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
};

/**
 * Get end of week
 * @param date Reference date
 * @returns End of week date
 */
export const getEndOfWeek = (date: Date = new Date()): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() + (6 - day);
  return new Date(d.setDate(diff));
};

/**
 * Get start of month
 * @param date Reference date
 * @returns Start of month date
 */
export const getStartOfMonth = (date: Date = new Date()): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

/**
 * Get end of month
 * @param date Reference date
 * @returns End of month date
 */
export const getEndOfMonth = (date: Date = new Date()): Date => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};

/**
 * Get date N months ago
 * @param months Number of months
 * @returns Date N months ago
 */
export const getMonthsAgo = (months: number): Date => {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return date;
};

/**
 * Get days difference
 * @param date1 First date
 * @param date2 Second date
 * @returns Number of days difference
 */
export const getDaysDifference = (date1: Date, date2: Date): number => {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};
