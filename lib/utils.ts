import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Date/Time Utilities
export function formatDate(date: string | Date, formatString: string = "MMM dd, yyyy"): string {
  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    return format(dateObj, formatString);
  } catch {
    return "Invalid date";
  }
}

export function formatRelativeTime(date: string | Date): string {
  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    return formatDistanceToNow(dateObj, { addSuffix: true });
  } catch {
    return "Unknown time";
  }
}

export function calculateHoursBetween(startDate: string | Date, endDate: string | Date): number {
  const start = typeof startDate === "string" ? parseISO(startDate).getTime() : startDate.getTime();
  const end = typeof endDate === "string" ? parseISO(endDate).getTime() : endDate.getTime();
  return Math.round((end - start) / (1000 * 60 * 60));
}

// Number/Currency Utilities
export function formatCurrency(amount: number, currency: string = "EUR"): string {
  return new Intl.NumberFormat("en-EU", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercentage(value: number, decimals: number = 0): string {
  return `${value.toFixed(decimals)}%`;
}

// String Utilities
export function truncate(str: string, length: number = 100): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Array Utilities
export function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

// Match Score Utilities
export function getMatchScoreColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  return "text-red-600";
}

export function getMatchScoreBadge(score: number): string {
  if (score >= 80) return "Strong Match";
  if (score >= 60) return "Good Match";
  return "Potential Match";
}

// Privacy/Masking Utilities
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  
  const maskedLocal = local[0] + "***" + (local.length > 1 ? local[local.length - 1] : "");
  return `${maskedLocal}@${domain}`;
}

export function maskSalaryRange(min: number, max: number, currency: string = "EUR"): string {
  // Round to nearest 10k for masking
  const roundedMin = Math.floor(min / 10000) * 10000;
  const roundedMax = Math.ceil(max / 10000) * 10000;
  
  return `${formatCurrency(roundedMin, currency)} - ${formatCurrency(roundedMax, currency)}`;
}

// File Size Utilities
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
}

// Error Message Helpers
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "An unknown error occurred";
}

