import pino from "pino";

const logLevel = "debug";

const isServer = typeof window === "undefined";

const logger = isServer
  ? pino(
      { level: logLevel },
      pino.multistream([
        { level: logLevel, stream: pino.destination(1) },
        {
          level: logLevel,
          stream: pino.destination({ dest: "logs/app.log", mkdir: true }),
        },
      ])
    )
  : pino({ level: logLevel, browser: { asObject: true } });

export default logger;
