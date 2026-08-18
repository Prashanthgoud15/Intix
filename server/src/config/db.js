/**
 * db.js — MongoDB connection via Mongoose.
 * Retries on initial failure and listens for post-connect errors.
 */
import mongoose from 'mongoose';
import env from './env.js';
import logger from '../utils/logger.js';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

export const connectDB = async (attempt = 1) => {
    try {
        const conn = await mongoose.connect(env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            maxPoolSize: 10,
            family: 4, // Use IPv4, skip trying IPv6
        });
        logger.info(`MongoDB connected: ${conn.connection.host}`);
    } catch (err) {
        logger.error(`MongoDB connection failed (attempt ${attempt}/${MAX_RETRIES}): ${err.message}`);
        if (attempt < MAX_RETRIES) {
            logger.info(`Retrying in ${RETRY_DELAY_MS / 1000}s…`);
            await new Promise((res) => setTimeout(res, RETRY_DELAY_MS));
            return connectDB(attempt + 1);
        }
        logger.error('Could not connect to MongoDB after maximum retries. Exiting.');
        process.exit(1);
    }
};

// Post-connect error (e.g. network drop after initial success)
mongoose.connection.on('error', (err) => {
    logger.error(`MongoDB runtime error: ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
});

export const disconnectDB = async () => {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
};
