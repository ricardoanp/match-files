import { hash, verify } from 'argon2';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database.js';
import { config } from '../config.js';
import { ValidationError, UnauthorizedError } from '../utils/errors.js';
import { User, JwtPayload } from '../types.js';
import { auditLog } from '../utils/logger.js';

export class AuthService {
  async register(name: string, email: string, password: string, phone?: string) {
    // Validate inputs
    if (!name || name.length < 2) {
      throw new ValidationError('Name must be at least 2 characters');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError('Invalid email format');
    }

    if (password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters');
    }

    const existingUser = await db('users').where({ email: email.toLowerCase() }).first();
    if (existingUser) {
      throw new ValidationError('Email already registered');
    }

    const passwordHash = await hash(password, {
      type: 2,
      timeCost: 3,
      memoryCost: 65536,
      parallelism: 1,
    });

    const userId = uuidv4();
    const now = new Date().toISOString();

    await db('users').insert({
      id: userId,
      name,
      email: email.toLowerCase(),
      phone: phone || null,
      password_hash: passwordHash,
      roles: ['JOGADOR'],
      status: 'active',
      consent: JSON.stringify({
        marketing: false,
        sms: false,
        push: true,
      }),
      created_at: now,
      updated_at: now,
    });

    auditLog('user_registered', { userId, email });

    const token = this.generateToken(userId, email, ['JOGADOR']);
    return { token, user: { id: userId, name, email, roles: ['JOGADOR'] } };
  }

  async login(email: string, password: string) {
    const user = await db('users').where({ email: email.toLowerCase() }).first();

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isPasswordValid = await verify(user.password_hash, password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (user.status === 'suspended') {
      throw new UnauthorizedError('Account is suspended');
    }

    auditLog('user_login', { userId: user.id, email });

    const token = this.generateToken(user.id, user.email, user.roles);
    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roles: user.roles,
      },
    };
  }

  async getUser(userId: string): Promise<User> {
    const user = await db('users').where({ id: userId }).first();

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      passwordHash: user.password_hash,
      roles: user.roles,
      status: user.status,
      location: user.location,
      consent: user.consent,
      createdAt: new Date(user.created_at),
      updatedAt: new Date(user.updated_at),
    };
  }

  async updateConsents(userId: string, consents: { marketing?: boolean; sms?: boolean; push?: boolean }) {
    const user = await db('users').where({ id: userId }).first();
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    const currentConsent = user.consent;
    const updatedConsent = {
      ...currentConsent,
      ...consents,
    };

    await db('users').where({ id: userId }).update({
      consent: JSON.stringify(updatedConsent),
      updated_at: new Date().toISOString(),
    });

    auditLog('user_consent_updated', { userId, consents: updatedConsent });

    return updatedConsent;
  }

  private generateToken(userId: string, email: string, roles: string[]): string {
    const payload: JwtPayload = {
      userId,
      email,
      roles: roles as any,
    };

    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: `${config.jwt.ttlMinutes}m`,
    });
  }
}

export const authService = new AuthService();
