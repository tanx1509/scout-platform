/**
 * Centralized Logger Service
 * Replaces scattered console.logs with structured logging.
 * In a real production app, this would wrap Winston, Pino, or Datadog/Sentry.
 */
export const logger = {
  info: (message: string, meta?: any) => {
    console.log(JSON.stringify({ level: "INFO", message, timestamp: new Date().toISOString(), ...meta }));
  },
  warn: (message: string, meta?: any) => {
    console.warn(JSON.stringify({ level: "WARN", message, timestamp: new Date().toISOString(), ...meta }));
  },
  error: (message: string, error?: any, meta?: any) => {
    console.error(JSON.stringify({ 
      level: "ERROR", 
      message, 
      error: error?.message || error,
      stack: error?.stack,
      timestamp: new Date().toISOString(), 
      ...meta 
    }));
  },
  debug: (message: string, meta?: any) => {
    if (process.env.NODE_ENV !== "production") {
      console.debug(JSON.stringify({ level: "DEBUG", message, timestamp: new Date().toISOString(), ...meta }));
    }
  }
};
