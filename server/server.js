/**
 * server.js — HTTP server entry point.
 * Connects to MongoDB first, then starts listening.
 * Handles graceful shutdown on SIGINT / SIGTERM.
 */
import app from './app.js';
import { connectDB, disconnectDB } from './src/config/db.js';
import logger from './src/utils/logger.js';
import env from './src/config/env.js';

const startServer = async () => {
    // Connect to MongoDB before accepting traffic
    await connectDB();

    const server = app.listen(env.PORT, '0.0.0.0', () => {
        logger.info('═'.repeat(60));
        logger.info('  Intix AI Interview Coach — Express Server v1.0');
        logger.info('═'.repeat(60));
        logger.info(`  Environment : ${env.NODE_ENV}`);
        logger.info(`  Port        : ${env.PORT}`);
        logger.info(`  API Base    : http://localhost:${env.PORT}/api/v1`);
        logger.info(`  Health      : http://localhost:${env.PORT}/api/v1/health`);
        logger.info(`  Groq        : ${env.GROQ_API_KEY ? 'configured ✓' : 'MISSING ✗'}`);
        logger.info(`  CORS Origin : ${env.CORS_ORIGIN.join(', ')}`);
        logger.info('═'.repeat(60));
    });

    // ── Graceful shutdown ──────────────────────────────────────────────────────
    const shutdown = async (signal) => {
        logger.info(`\nReceived ${signal}. Shutting down gracefully…`);
        server.close(async () => {
            logger.info('HTTP server closed');
            await disconnectDB();
            logger.info('Goodbye.');
            process.exit(0);
        });
        // Force-kill if graceful close takes too long
        setTimeout(() => {
            logger.error('Forced shutdown after timeout');
            process.exit(1);
        }, 10_000);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    // Unhandled promise rejections — log and exit so the process restarts cleanly
    process.on('unhandledRejection', (reason) => {
        logger.error(`Unhandled Rejection: ${reason}`);
        shutdown('unhandledRejection');
    });
};

startServer();
