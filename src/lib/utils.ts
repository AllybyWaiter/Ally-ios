import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import DOMPurify from "dompurify";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Sanitizes user input by removing potentially dangerous characters and HTML
 * @param input - The string to sanitize
 * @returns Sanitized string safe for display and storage
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    // Remove script tags and their content (must run before generic HTML tag stripping)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove any HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove potentially dangerous protocols
    .replace(/javascript:/gi, '')
    .replace(/\bdata:/gi, '')
    .replace(/vbscript:/gi, '')
    // Remove null bytes
    .replace(/\0/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Sanitizes HTML content while preserving safe formatting
 * @param html - HTML string to sanitize
 * @returns Sanitized HTML safe for rendering
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'a'],
    ALLOWED_ATTR: ['href', 'target'],
  });
}
