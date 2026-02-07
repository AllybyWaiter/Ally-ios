import { describe, it, expect } from 'vitest';
import { cn, sanitizeInput, sanitizeHtml } from './utils';

describe('cn (classNames utility)', () => {
  it('should merge class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    const showBar = false;
    expect(cn('foo', showBar && 'bar', 'baz')).toBe('foo baz');
  });

  it('should handle undefined and null', () => {
    expect(cn('foo', undefined, null, 'bar')).toBe('foo bar');
  });

  it('should merge Tailwind classes correctly', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });

  it('should handle array of classes', () => {
    expect(cn(['foo', 'bar'], 'baz')).toBe('foo bar baz');
  });

  it('should handle object syntax', () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz');
  });
});

describe('sanitizeInput', () => {
  it('should trim whitespace', () => {
    expect(sanitizeInput('  hello  ')).toBe('hello');
  });

  it('should remove HTML tags', () => {
    expect(sanitizeInput('<div>hello</div>')).toBe('hello');
  });

  it('should remove script tags and content', () => {
    expect(sanitizeInput('<script>alert("xss")</script>hello')).toBe('hello');
  });

  it('should remove javascript: protocol', () => {
    expect(sanitizeInput('javascript:alert(1)')).toBe('alert(1)');
  });

  it('should remove data: protocol', () => {
    expect(sanitizeInput('data:text/html,test')).toBe('text/html,test');
  });

  it('should remove vbscript: protocol', () => {
    expect(sanitizeInput('vbscript:msgbox("test")')).toBe('msgbox("test")');
  });

  it('should remove null bytes', () => {
    expect(sanitizeInput('hello\0world')).toBe('hello world');
  });

  it('should normalize whitespace', () => {
    expect(sanitizeInput('hello    world')).toBe('hello world');
  });

  it('should handle empty string', () => {
    expect(sanitizeInput('')).toBe('');
  });

  it('should handle string with only whitespace', () => {
    expect(sanitizeInput('   ')).toBe('');
  });
});

describe('sanitizeHtml', () => {
  it('should remove script tags', () => {
    const result = sanitizeHtml('<p>hello</p><script>alert(1)</script>');
    expect(result).not.toContain('<script>');
    expect(result).toContain('<p>hello</p>');
  });

  it('should remove event handlers', () => {
    const result = sanitizeHtml('<div onclick="alert(1)">hello</div>');
    expect(result).not.toContain('onclick');
    expect(result).toContain('hello');
  });

  it('should remove onmouseover handlers', () => {
    const result = sanitizeHtml('<span onmouseover="alert(1)">text</span>');
    expect(result).not.toContain('onmouseover');
  });

  it('should preserve safe HTML', () => {
    const result = sanitizeHtml('<p><strong>bold</strong> and <em>italic</em></p>');
    expect(result).toContain('<strong>bold</strong>');
    expect(result).toContain('<em>italic</em>');
  });

  it('should handle empty string', () => {
    expect(sanitizeHtml('')).toBe('');
  });
});
