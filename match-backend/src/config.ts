import dotenv from 'dotenv';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  apiUrl: process.env.API_URL || 'http://localhost:3000',

  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'match_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    ttlMinutes: parseInt(process.env.JWT_TTL_MIN || '60', 10),
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    publicKey: process.env.STRIPE_PUBLIC_KEY || '',
  },

  featureFlags: {
    enableJogosAula: process.env.ENABLE_JOGOS_AULA === 'true',
    enableMatchmaking: process.env.ENABLE_MATCHMAKING === 'true',
    enableSms: process.env.ENABLE_SMS === 'true',
  },

  split: {
    platformFeePct: parseFloat(process.env.PLATFORM_FEE_PCT || '0.15'),
    courtSharePct: parseFloat(process.env.COURT_SHARE_PCT || '0.65'),
    professorSharePct: parseFloat(process.env.PROFESSOR_SHARE_PCT || '0.20'),
  },

  geographic: {
    defaultRadiusKm: parseInt(process.env.DEFAULT_RADIUS_KM || '20', 10),
    cityPilotName: process.env.CITY_PILOT_NAME || 'São Paulo',
  },

  rateLimit: {
    windowMinutes: parseInt(process.env.RATE_LIMIT_WINDOW_MIN || '60', 10),
    maxRequestsPublic: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS_PUBLIC || '60', 10),
    maxRequestsAuth: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS_AUTH || '600', 10),
  },

  email: {
    smtpHost: process.env.SMTP_HOST || '',
    smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
    smtpUser: process.env.SMTP_USER || '',
    smtpPass: process.env.SMTP_PASS || '',
  },
};
