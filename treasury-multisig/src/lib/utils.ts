import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatAddress = (address: string): string => {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatNumber = (num: number, decimals = 2): string => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

export const formatBytes = (bytes: string): string => {
  if (!bytes) return "";
  if (bytes.length <= 10) return bytes;
  return `${bytes.slice(0, 6)}...${bytes.slice(-4)}`;
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const truncateText = (text: string, length = 50): string => {
  return text.length > length ? `${text.slice(0, length)}...` : text;
};

export const getTimeRemaining = (endTime: number): string => {
  const now = Math.floor(Date.now() / 1000);
  const remaining = endTime - now;

  if (remaining <= 0) return "Expired";
  if (remaining < 60) return `${remaining}s`;
  if (remaining < 3600) return `${Math.floor(remaining / 60)}m`;
  if (remaining < 86400) return `${Math.floor(remaining / 3600)}h`;
  return `${Math.floor(remaining / 86400)}d`;
};

export const parseJSON = <T = unknown>(json: string, fallback?: T): T => {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback as T;
  }
};
