// Input validation utilities using Zod-like validation
// Note: Using manual validation to avoid Deno import issues with Zod

import { corsHeaders, getCorsHeaders } from './cors.ts';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
}

// Helper functions for validation
export function validateString(value: unknown, field: string, options?: {
  minLength?: number;
  maxLength?: number;
  required?: boolean;
}): ValidationError | null {
  const { minLength = 0, maxLength = 10000, required = true } = options || {};
  
  if (value === undefined || value === null) {
    if (required) {
      return { field, message: `${field} is required` };
    }
    return null;
  }
  
  if (typeof value !== 'string') {
    return { field, message: `${field} must be a string` };
  }
  
  if (value.length < minLength) {
    return { field, message: `${field} must be at least ${minLength} characters` };
  }
  
  if (value.length > maxLength) {
    return { field, message: `${field} must be at most ${maxLength} characters` };
  }
  
  return null;
}

export function validateUrl(value: unknown, field: string, options?: {
  required?: boolean;
}): ValidationError | null {
  const { required = true } = options || {};
  
  if (value === undefined || value === null || value === '') {
    if (required) {
      return { field, message: `${field} is required` };
    }
    return null;
  }
  
  if (typeof value !== 'string') {
    return { field, message: `${field} must be a string` };
  }
  
  try {
    new URL(value);
    return null;
  } catch {
    return { field, message: `${field} must be a valid URL` };
  }
}

export function validateUuid(value: unknown, field: string, options?: {
  required?: boolean;
}): ValidationError | null {
  const { required = true } = options || {};
  
  if (value === undefined || value === null || value === '') {
    if (required) {
      return { field, message: `${field} is required` };
    }
    return null;
  }
  
  if (typeof value !== 'string') {
    return { field, message: `${field} must be a string` };
  }
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(value)) {
    return { field, message: `${field} must be a valid UUID` };
  }
  
  return null;
}

export function validateArray(value: unknown, field: string, options?: {
  minLength?: number;
  maxLength?: number;
  required?: boolean;
}): ValidationError | null {
  const { minLength = 0, maxLength = 1000, required = true } = options || {};
  
  if (value === undefined || value === null) {
    if (required) {
      return { field, message: `${field} is required` };
    }
    return null;
  }
  
  if (!Array.isArray(value)) {
    return { field, message: `${field} must be an array` };
  }
  
  if (value.length < minLength) {
    return { field, message: `${field} must have at least ${minLength} items` };
  }
  
  if (value.length > maxLength) {
    return { field, message: `${field} must have at most ${maxLength} items` };
  }
  
  return null;
}

export function validateEnum<T extends string>(value: unknown, field: string, allowedValues: T[], options?: {
  required?: boolean;
}): ValidationError | null {
  const { required = true } = options || {};
  
  if (value === undefined || value === null || value === '') {
    if (required) {
      return { field, message: `${field} is required` };
    }
    return null;
  }
  
  if (typeof value !== 'string') {
    return { field, message: `${field} must be a string` };
  }
  
  if (!allowedValues.includes(value as T)) {
    return { field, message: `${field} must be one of: ${allowedValues.join(', ')}` };
  }
  
  return null;
}

// Create validation error response
export function validationErrorResponse(errors: ValidationError[], request?: Request): Response {
  const cors = request ? getCorsHeaders(request) : corsHeaders;
  return new Response(
    JSON.stringify({
      error: 'Validation failed',
      details: errors,
    }),
    {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    }
  );
}

// Collect validation errors
export function collectErrors(...errors: (ValidationError | null)[]): ValidationError[] {
  return errors.filter((e): e is ValidationError => e !== null);
}

// Constant-time string comparison to prevent timing attacks on secret values
export function timingSafeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const bufA = encoder.encode(a);
  const bufB = encoder.encode(b);
  if (bufA.length !== bufB.length) {
    // Compare against self to keep constant time, then return false
    let dummy = 0;
    for (let i = 0; i < bufA.length; i++) {
      dummy |= bufA[i] ^ bufA[i];
    }
    // Read dummy so the loop is not optimized away.
    if (dummy === -1) {
      return false;
    }
    return false;
  }
  let result = 0;
  for (let i = 0; i < bufA.length; i++) {
    result |= bufA[i] ^ bufB[i];
  }
  return result === 0;
}

// HTML entity escaping for safe embedding in HTML templates (emails, etc.)
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
