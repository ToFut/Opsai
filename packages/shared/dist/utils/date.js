"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidDate = isValidDate;
exports.parseDate = parseDate;
exports.formatDateWithPattern = formatDateWithPattern;
exports.formatDateDistance = formatDateDistance;
exports.formatDateRelative = formatDateRelative;
exports.getDaysDifference = getDaysDifference;
exports.getHoursDifference = getHoursDifference;
exports.getMinutesDifference = getMinutesDifference;
exports.getSecondsDifference = getSecondsDifference;
exports.addDays = addDays;
exports.addHours = addHours;
exports.addMinutes = addMinutes;
exports.startOfDay = startOfDay;
exports.endOfDay = endOfDay;
exports.startOfWeek = startOfWeek;
exports.endOfWeek = endOfWeek;
exports.startOfMonth = startOfMonth;
exports.endOfMonth = endOfMonth;
exports.isToday = isToday;
exports.isYesterday = isYesterday;
exports.isThisWeek = isThisWeek;
exports.isThisMonth = isThisMonth;
exports.getAge = getAge;
exports.getWeekNumber = getWeekNumber;
exports.getQuarter = getQuarter;
exports.isLeapYear = isLeapYear;
exports.getDaysInMonth = getDaysInMonth;
const date_fns_1 = require("date-fns");
function isValidDate(date) {
    return (0, date_fns_1.isValid)(date);
}
function parseDate(dateString) {
    return (0, date_fns_1.parseISO)(dateString);
}
function formatDateWithPattern(date, formatString = 'yyyy-MM-dd') {
    return (0, date_fns_1.format)(date, formatString);
}
function formatDateDistance(date, baseDate = new Date()) {
    return (0, date_fns_1.formatDistance)(date, baseDate, { addSuffix: true });
}
function formatDateRelative(date, baseDate = new Date()) {
    return (0, date_fns_1.formatRelative)(date, baseDate);
}
function getDaysDifference(date1, date2) {
    return (0, date_fns_1.differenceInDays)(date1, date2);
}
function getHoursDifference(date1, date2) {
    return (0, date_fns_1.differenceInHours)(date1, date2);
}
function getMinutesDifference(date1, date2) {
    return (0, date_fns_1.differenceInMinutes)(date1, date2);
}
function getSecondsDifference(date1, date2) {
    return (0, date_fns_1.differenceInSeconds)(date1, date2);
}
function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}
function addHours(date, hours) {
    const result = new Date(date);
    result.setHours(result.getHours() + hours);
    return result;
}
function addMinutes(date, minutes) {
    const result = new Date(date);
    result.setMinutes(result.getMinutes() + minutes);
    return result;
}
function startOfDay(date) {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
}
function endOfDay(date) {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
}
function startOfWeek(date) {
    const result = new Date(date);
    const day = result.getDay();
    const diff = result.getDate() - day + (day === 0 ? -6 : 1);
    result.setDate(diff);
    result.setHours(0, 0, 0, 0);
    return result;
}
function endOfWeek(date) {
    const result = new Date(date);
    const day = result.getDay();
    const diff = result.getDate() - day + (day === 0 ? 0 : 7);
    result.setDate(diff);
    result.setHours(23, 59, 59, 999);
    return result;
}
function startOfMonth(date) {
    const result = new Date(date);
    result.setDate(1);
    result.setHours(0, 0, 0, 0);
    return result;
}
function endOfMonth(date) {
    const result = new Date(date);
    result.setMonth(result.getMonth() + 1, 0);
    result.setHours(23, 59, 59, 999);
    return result;
}
function isToday(date) {
    const today = new Date();
    return date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
}
function isYesterday(date) {
    const yesterday = addDays(new Date(), -1);
    return date.getDate() === yesterday.getDate() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getFullYear() === yesterday.getFullYear();
}
function isThisWeek(date) {
    const startOfThisWeek = startOfWeek(new Date());
    const endOfThisWeek = endOfWeek(new Date());
    return date >= startOfThisWeek && date <= endOfThisWeek;
}
function isThisMonth(date) {
    const startOfThisMonth = startOfMonth(new Date());
    const endOfThisMonth = endOfMonth(new Date());
    return date >= startOfThisMonth && date <= endOfThisMonth;
}
function getAge(birthDate) {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}
function getWeekNumber(date) {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + startOfYear.getDay() + 1) / 7);
}
function getQuarter(date) {
    return Math.ceil((date.getMonth() + 1) / 3);
}
function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}
function getDaysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
}
//# sourceMappingURL=date.js.map