// src/lib/logger.ts
import pino from "pino";
import type { LevelWithSilent } from "pino";

const LOG_LEVEL = (import.meta.env.PUBLIC_LOG_LEVEL as LevelWithSilent | undefined) ?? "info";
const isSSR = import.meta.env.SSR;

const logger = pino(!isSSR ? { level: LOG_LEVEL, browser: { asObject: true } } : { level: LOG_LEVEL });

export { logger };
export default logger;
