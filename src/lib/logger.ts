// src/lib/logger.ts
import pino from "pino";
import type { LevelWithSilent } from "pino";

const LOG_LEVEL = (import.meta.env.PUBLIC_LOG_LEVEL as LevelWithSilent | undefined) ?? "info";
const isSSR = import.meta.env.SSR;
const isDev = import.meta.env.DEV;

let logger: ReturnType<typeof pino>;

if (!isSSR) {
  // Browser-friendly logger (keeps objects for structured logging)
  logger = pino({ level: LOG_LEVEL, browser: { asObject: true } });
} else {
  // Server-side logger: pretty-print during local development, structured JSON in production
  if (isDev) {
    try {
      const transport = pino.transport({
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      });
      logger = pino({ level: LOG_LEVEL }, transport);
    } catch (err) {
      // If pino-pretty isn't available for any reason, fall back to normal pino output
      // and log the failure to initialize the prettifier.
      const fallback = pino({ level: LOG_LEVEL });
      fallback.warn({ err }, "pino-pretty unavailable, falling back to JSON output");
      logger = fallback;
    }
  } else {
    // Production: JSON output optimized for Cloudflare Pages
    logger = pino({
      level: LOG_LEVEL,
      formatters: {
        level: (label) => ({ level: label }),
      },
      timestamp: pino.stdTimeFunctions.isoTime,
      base: undefined, // Remove pid and hostname for cleaner Cloudflare logs
    });
  }
}

export { logger };
export default logger;
