// Structured logging utility for edge functions

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  requestId?: string;
  userId?: string;
  functionName?: string;
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  data?: unknown;
}

class Logger {
  private functionName: string;
  private requestId: string;
  private userId?: string;

  constructor(functionName: string, requestId?: string) {
    this.functionName = functionName;
    this.requestId = requestId || crypto.randomUUID().slice(0, 8);
  }

  setUserId(userId: string) {
    this.userId = userId;
  }

  private formatLog(level: LogLevel, message: string, data?: unknown): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: {
        requestId: this.requestId,
        functionName: this.functionName,
        userId: this.userId,
      },
      data,
    };
  }

  private output(entry: LogEntry) {
    const logString = JSON.stringify(entry);
    switch (entry.level) {
      case 'error':
        console.error(logString);
        break;
      case 'warn':
        console.warn(logString);
        break;
      case 'debug':
        console.debug(logString);
        break;
      default:
        console.log(logString);
    }
  }

  debug(message: string, data?: unknown) {
    this.output(this.formatLog('debug', message, data));
  }

  info(message: string, data?: unknown) {
    this.output(this.formatLog('info', message, data));
  }

  warn(message: string, data?: unknown) {
    this.output(this.formatLog('warn', message, data));
  }

  error(message: string, error?: unknown) {
    const errorData = error instanceof Error 
      ? { name: error.name, message: error.message, stack: error.stack }
      : error;
    this.output(this.formatLog('error', message, errorData));
  }
}

export function createLogger(functionName: string, requestId?: string): Logger {
  return new Logger(functionName, requestId);
}

export type { Logger };
