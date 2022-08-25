const winston = require('winston');
const { APPLICATION_NAME, INSTANCE_NAME, INSTANCE_ID } = require('./constants');

class Logger {
  constructor() {
    this.logger = setUpWinston(this.format);
  }

  log(level, message) {
    this.logger.log({ level, message });
  }

  logError(level, message, error) {
    this.logger.log({ level, message, error });
  }

  format(info) {
    const date = new Date();

    let log = `${date.toISOString()} ${INSTANCE_NAME} [${INSTANCE_ID}] level=${
      info.level
    } ts=${date.toISOString()} msg="${
      info.message
    }" service=${APPLICATION_NAME}`;

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
