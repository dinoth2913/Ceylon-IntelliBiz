import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Mongo ids are 24 hex characters; the last six are enough to tell records apart on screen. */
export function shortId(id: string): string {
  return id.slice(-6).toUpperCase();
}
