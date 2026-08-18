/**
 * logger.js — Winston logger.
 * Console transport in dev; JSON file transports (error.log + combined.log) always.
 * Import this and call logger.info() / logger.error() / logger.warn() throughout.
 */
import { createLogger, format, transports } from 'winston';
import env from '../config/env.js';

const { combine, timestamp, errors, json, colorize, printf } = format;

// Dev-friendly console format
const devFormat = combine(
    colorize({ all: true }),
    timestamp({ format: 'HH:mm:ss' }),
    errors({ stack: true }),
    printf(({ level, message, timestamp: ts, stack, requestId }) => {
        const reqPart = requestId ? ` [${requestId}]` : '';
        return `${ts}${reqPart} ${level}: ${stack || message}`;
    })
);

// Production JSON format
const prodFormat = combine(
    timestamp(),
    errors({ stack: true }),
    json()
);

const logger = createLogger({
    level: env.isDev ? 'debug' : 'info',
    format: env.isProd ? prodFormat : devFormat,
    transports: [
        // Always write to files
        new transports.File({
            filename: 'logs/error.log',
            level: 'error',
            format: combine(timestamp(), errors({ stack: true }), json()),
        }),
        new transports.File({
            filename: 'logs/combined.log',
            format: combine(timestamp(), json()),
        }),
    ],
    exceptionHandlers: [
        new transports.File({ filename: 'logs/exceptions.log' }),
    ],
    rejectionHandlers: [
        new transports.File({ filename: 'logs/rejections.log' }),
    ],
});

// Console transport in development
if (!env.isProd) {
    logger.add(new transports.Console());
}

export default logger;
