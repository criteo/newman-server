import * as winston from 'winston';

export const LogLevel = {
  debug: 'debug',
  info: 'info',
  warn: 'warn',
  error: 'error',
} as const;

class Logger {
  logger: winston.Logger;

  constructor() {
    this.logger = setUpWinston(this.format);
  }

  debug(message: string) {
    this.logger.log({ level: LogLevel.debug, message });
  }

  info(message: string) {
    this.logger.log({ level: LogLevel.info, message });
  }

  warn(message: string) {
    this.logger.log({ level: LogLevel.warn, message });
  }

  error(message: string, error: Error, stacktrace?: unknown) {
    this.logger.log({ level: LogLevel.error, message, error, stacktrace });
  }

  format(info: winston.Logform.TransformableInfo) {
    const date = new Date();

    let log = `level=${info.level} ts=${date.toISOString()} msg="${
      info.message
    }"`;

    if (info.error) {
      log += ` err="${info.error.message}"`;
    }
    if (info.duration) {
      log += ` duration=${info.duration}ms`;
    }
    if (info.caller) {
      log += ` caller=${info.caller}`;
    }
    return log;
  }
}

export const logger = new Logger();

function setUpWinston(
  formatter: (info: winston.Logform.TransformableInfo) => string,
) {
  const printedFormat = winston.format.printf((info) => formatter(info));
  return winston.createLogger({
    level: LogLevel.info,
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          printedFormat,
        ),
      }),
    ],
  });
}
