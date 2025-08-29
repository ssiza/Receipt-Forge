import { serializeError } from './serializeError';

export const log = {
  info: (message: string, ...args: unknown[]) => {
    console.log(`ℹ️ [INFO] ${message}`, ...args);
  },
  
  warn: (message: string, ...args: unknown[]) => {
    console.warn(`⚠️ [WARN] ${message}`, ...args);
  },
  
  error: (message: string, error?: unknown, ...args: unknown[]) => {
    if (error) {
      console.error(`💥 [ERROR] ${message}`, serializeError(error), ...args);
    } else {
      console.error(`💥 [ERROR] ${message}`, ...args);
    }
  },
  
  debug: (message: string, ...args: unknown[]) => {
    console.debug(`🐛 [DEBUG] ${message}`, ...args);
  }
}; 