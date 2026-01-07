/**
 * Production-safe logger utility
 * Suppresses console.log/warn/debug in production but always logs errors for Sentry
 */

const isDev = import.meta.env.DEV;

type LogLevel = 'log' | 'warn' | 'error' | 'debug' | 'info';

interface LogEntry {
  level: LogLevel;
  timestamp: number;
  args: unknown[];
}

// Buffer for structured logging if needed
const logBuffer: LogEntry[] = [];
const MAX_BUFFER_SIZE = 100;

const addToBuffer = (level: LogLevel, args: unknown[]) => {
  if (logBuffer.length >= MAX_BUFFER_SIZE) {
    logBuffer.shift(); // Remove oldest entry
  }
  logBuffer.push({ level, timestamp: Date.now(), args });
};

export const logger = {
  log: (...args: unknown[]): void => {
    if (isDev) {
      console.log(...args);
      addToBuffer('log', args);
    }
  },
  warn: (...args: unknown[]): void => {
    if (isDev) {
      console.warn(...args);
    }
    addToBuffer('warn', args);
  },
  error: (...args: unknown[]): void => {
    // Always log errors - these are captured by Sentry
    console.error(...args);
    addToBuffer('error', args);
  },
  debug: (...args: unknown[]): void => {
    if (isDev) {
      console.debug(...args);
      addToBuffer('debug', args);
    }
  },
  info: (...args: unknown[]): void => {
    if (isDev) {
      console.info(...args);
      addToBuffer('info', args);
    }
  },
  // Get recent logs for debugging
  getRecentLogs: (count = 20): LogEntry[] => {
    return logBuffer.slice(-count);
  },
  // Clear log buffer
  clearBuffer: (): void => {
    logBuffer.length = 0;
  },
};

export default logger;
