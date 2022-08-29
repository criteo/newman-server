const winston = require('winston');

class Logger {
  constructor() {
    this.logger = setUpWinston(this.format);
  }

  debug(message) {
    this.logger.log({ level: LogLevel.debug, message });
  }

  info(message) {
    this.logger.log({ level: LogLevel.info, message });
  }

  warn(message) {
    this.logger.log({ level: LogLevel.warn, message });
  }

  error(message, error) {
    this.logger.log({ level: LogLevel.error, message, error });
  }

  format(info) {
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

function setUpWinston(formatter) {
  const printedFormat = winston.format.printf((info) => formatter(info));
  return winston.createLogger({
    level: LogLevel.info,
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          printedFormat
        ),
      }),
    ],
  });
}

const LogLevel = {
  debug: 'debug',
  info: 'info',
  warn: 'warn',
  error: 'error',
};

module.exports = { logger: new Logger(), LogLevel };
