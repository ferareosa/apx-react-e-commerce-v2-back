import { randomInt } from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { HttpError } from '../lib/http-error.js';
import type { InMemoryDatabase } from './database.js';
import type { EmailService } from './email-service.js';
import type { UserService } from './user-service.js';

export type AuthTokenPayload = {
  userId: string;
  email: string;
  supabaseUserId?: string;
};

export class AuthService {
  constructor(
    private readonly db: InMemoryDatabase,
    private readonly emailService: EmailService,
    private readonly userService: UserService
  ) {}

  async requestCode(email: string) {
    const sanitizedEmail = email.trim().toLowerCase();
    const user = await this.userService.ensureUser(sanitizedEmail);
    const code = randomInt(100000, 999999).toString();
    const expiresAt = new Date(
      Date.now() + env.loginCodeTTLMinutes * 60 * 1000
    );

    this.db.saveAuthCode({
      email: sanitizedEmail,
      code,
      expiresAt,
      attempts: 0
    });

    await this.emailService.sendLoginCode(user.email, code, expiresAt);

    return { expiresAt, userId: user.id };
  }

  async exchangeCodeForToken(email: string, code: string) {
    const sanitizedEmail = email.trim().toLowerCase();

    const record = this.db.getAuthCode(sanitizedEmail);

    if (!record) {
      throw new HttpError(401, 'Código inválido o inexistente');
    }

    if (record.expiresAt < new Date()) {
      this.db.deleteAuthCode(sanitizedEmail);
      throw new HttpError(401, 'El código expiró, solicitá uno nuevo');
    }

    if (record.code !== code) {
      record.attempts += 1;
      this.db.saveAuthCode(record);
      throw new HttpError(401, 'Código incorrecto');
    }

    this.db.deleteAuthCode(sanitizedEmail);
    const user = await this.userService.getByEmail(sanitizedEmail);
    return this.buildTokenResponse(user);
  }

  verifyToken(token: string) {
    try {
      return jwt.verify(token, env.authSecret) as AuthTokenPayload;
    } catch (error) {
      throw new HttpError(401, 'Token inválido');
    }
  }

  private signToken(payload: AuthTokenPayload) {
    return jwt.sign(payload, env.authSecret, { expiresIn: '2h' });
  }

  private buildTokenResponse(user: { id: string; email: string }) {
    const token = this.signToken({ userId: user.id, email: user.email });
    return {
      token,
      expiresIn: '2h'
    };
  }
}
