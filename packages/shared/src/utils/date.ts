import { format, formatDistance, formatRelative, isValid, parseISO, differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds } from 'date-fns';

export function isValidDate(date: any): boolean {
  return isValid(date);
}

export function parseDate(dateString: string): Date {
  return parseISO(dateString);
}

export function formatDateWithPattern(date: Date, formatString: string = 'yyyy-MM-dd'): string {
  return format(date, formatString);
}

export function formatDateDistance(date: Date, baseDate: Date = new Date()): string {
  return formatDistance(date, baseDate, { addSuffix: true });
}

export function formatDateRelative(date: Date, baseDate: Date = new Date()): string {
  return formatRelative(date, baseDate);
}

export function getDaysDifference(date1: Date, date2: Date): number {
  return differenceInDays(date1, date2);
}

export function getHoursDifference(date1: Date, date2: Date): number {
  return differenceInHours(date1, date2);
}

export function getMinutesDifference(date1: Date, date2: Date): number {
  return differenceInMinutes(date1, date2);
}

export function getSecondsDifference(date1: Date, date2: Date): number {
  return differenceInSeconds(date1, date2);
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function addHours(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}

export function addMinutes(date: Date, minutes: number): Date {
  const result = new Date(date);
  result.setMinutes(result.getMinutes() + minutes);
  return result;
}

export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

export function startOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  const diff = result.getDate() - day + (day === 0 ? -6 : 1);
  result.setDate(diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function endOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  const diff = result.getDate() - day + (day === 0 ? 0 : 7);
  result.setDate(diff);
  result.setHours(23, 59, 59, 999);
  return result;
}

export function startOfMonth(date: Date): Date {
  const result = new Date(date);
  result.setDate(1);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function endOfMonth(date: Date): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + 1, 0);
  result.setHours(23, 59, 59, 999);
  return result;
}

export function isToday(date: Date): boolean {
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
}

export function isYesterday(date: Date): boolean {
  const yesterday = addDays(new Date(), -1);
  return date.getDate() === yesterday.getDate() &&
         date.getMonth() === yesterday.getMonth() &&
         date.getFullYear() === yesterday.getFullYear();
}

export function isThisWeek(date: Date): boolean {
  const startOfThisWeek = startOfWeek(new Date());
  const endOfThisWeek = endOfWeek(new Date());
  return date >= startOfThisWeek && date <= endOfThisWeek;
}

export function isThisMonth(date: Date): boolean {
  const startOfThisMonth = startOfMonth(new Date());
  const endOfThisMonth = endOfMonth(new Date());
  return date >= startOfThisMonth && date <= endOfThisMonth;
}

export function getAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

export function getWeekNumber(date: Date): number {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + startOfYear.getDay() + 1) / 7);
}

export function getQuarter(date: Date): number {
  return Math.ceil((date.getMonth() + 1) / 3);
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
} 