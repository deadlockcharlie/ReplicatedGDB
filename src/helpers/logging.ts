import {createLogger, format, transports} from "winston";

export const logger = createLogger({
level: process.env.LOG_LEVEL || 'error',
  format: format.combine(
    format.timestamp(),
    format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}]: ${message}`)
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: './Logs/Logs.log' }) // all updates are stored here
  ]
});
