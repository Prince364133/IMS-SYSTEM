'use strict';

/**
 * Simple date helpers — no heavy dependencies needed
 */

/**
 * Get current date as YYYY-MM-DD
 */
function todayStr() {
    return new Date().toISOString().slice(0, 10);
}

/**
 * Get current month as YYYY-MM
 */
function thisMonthStr() {
    return new Date().toISOString().slice(0, 7);
}

/**
 * Format a date to YYYY-MM-DD
 */
function toDateStr(date) {
    return new Date(date).toISOString().slice(0, 10);
}

/**
 * Get start of month ISO string
 */
function startOfMonth(yearMonth) {
    return new Date(`${yearMonth}-01T00:00:00.000Z`);
}

/**
 * Get end of month ISO string
 */
function endOfMonth(yearMonth) {
    const [year, month] = yearMonth.split('-').map(Number);
    return new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
}

module.exports = { todayStr, thisMonthStr, toDateStr, startOfMonth, endOfMonth };
