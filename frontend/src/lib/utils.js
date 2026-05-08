import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDecimal(value) {
  if (value === null || value === undefined) {
    return "-";
  }
  const num = parseFloat(value);
  if (isNaN(num)) {
    return "-";
  }
  return num.toFixed(2);
}
