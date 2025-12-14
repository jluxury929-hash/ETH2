import * as winston from 'winston';

const logFormat = winston.format.printf(
    // @ts-ignore FINAL FIX: Ignoring the TS2345 type mismatch to allow compilation.
    ({ level, message, timestamp, stack }) => { 
        const msg = String(message ?? '');
        const lvl = level ?? 'info';
        const time = timestamp ?? new Date().toISOString(); 
        
        if (stack) {
            return `${time} [${lvl.toUpperCase()}]: ${msg}\n${stack}`;
        }
        return `${time} [${lvl.toUpperCase()}]: ${msg}`;
    }
);

export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.colorize(),
        logFormat
    ),
    transports: [
        new winston.transports.Console()
    ]
});
