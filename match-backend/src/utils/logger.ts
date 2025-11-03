import pino from 'pino';
import pinoHttp from 'pino-http';
import { config } from '../config.js';

const isDev = config.env === 'development';

export const logger = pino({
  level: isDev ? 'debug' : 'info',
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
});

export const pinoHttpMiddleware = pinoHttp({
  logger,
  customLogLevel: (req, res) => {
    if (res.statusCode >= 400 && res.statusCode < 500) return 'warn';
    if (res.statusCode >= 500) return 'error';
    return 'info';
  },
});

// Structured logging para eventos críticos
export const auditLog = (event: string, data: Record<string, any>) => {
  logger.info({ event, timestamp: new Date().toISOString(), ...data });
};

export const eventLog = (eventName: string, payload: Record<string, any>) => {
  logger.info({ event: eventName, ...payload });
};
