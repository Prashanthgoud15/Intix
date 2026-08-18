/**
 * logger.js (middleware) — Morgan HTTP request logger.
 * Streams Morgan output through Winston so all logs go through
 * the same transport (console in dev, files always).
 */
import morgan from 'morgan';
import logger from '../utils/logger.js';
import env from '../config/env.js';

// Morgan writes to this Winston stream
const stream = {
    write: (message) => logger.http(message.trim()),
};

// Use brief 'dev' format locally, Apache-style 'combined' in production
const format = env.isDev ? 'dev' : 'combined';

const morganMiddleware = morgan(format, { stream });

export default morganMiddleware;
